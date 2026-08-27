import { AttendanceStatus, Prisma } from '@prisma/client';
import prisma from '../lib/prisma.js';

export interface DeriveStatusInput {
  checkIn?: Date | string | null;
  shiftStartTime?: string | null; // e.g. "07:00"
  explicitStatus?: AttendanceStatus | null;
}

/**
 * Pure business logic function to derive AttendanceStatus.
 * Rules:
 * - If explicitStatus is ON_LEAVE, it is preserved.
 * - If no checkIn provided and status not explicitly set -> ABSENT.
 * - If checkIn provided with a shiftStartTime:
 *     - If checkIn > shiftStartTime + 10 minutes grace period -> LATE.
 *     - Otherwise -> PRESENT.
 * - If checkIn provided without shiftStartTime -> explicitStatus or PRESENT.
 */
export function deriveAttendanceStatus(input: DeriveStatusInput): AttendanceStatus {
  if (input.explicitStatus === 'ON_LEAVE') {
    return 'ON_LEAVE';
  }

  if (!input.checkIn) {
    return input.explicitStatus ?? 'ABSENT';
  }

  if (!input.shiftStartTime) {
    return input.explicitStatus ?? 'PRESENT';
  }

  const [shiftHoursStr, shiftMinutesStr] = input.shiftStartTime.split(':');
  const shiftHours = parseInt(shiftHoursStr, 10);
  const shiftMinutes = parseInt(shiftMinutesStr, 10);

  if (isNaN(shiftHours) || isNaN(shiftMinutes)) {
    return input.explicitStatus ?? 'PRESENT';
  }

  const shiftStartTotalMinutes = shiftHours * 60 + shiftMinutes;

  const checkInDate = typeof input.checkIn === 'string' ? new Date(input.checkIn) : input.checkIn;
  
  // Extract hours and minutes from checkIn (using local or UTC depending on representation)
  // Support standard JS Date
  const checkInHours = checkInDate.getHours();
  const checkInMinutes = checkInDate.getMinutes();
  const checkInTotalMinutes = checkInHours * 60 + checkInMinutes;

  let diffMinutes = checkInTotalMinutes - shiftStartTotalMinutes;

  // Handle midnight wrap-around (e.g. shift 23:00, check-in 00:05)
  if (diffMinutes < -720) {
    diffMinutes += 1440;
  } else if (diffMinutes > 720) {
    diffMinutes -= 1440;
  }

  // Grace period is 10 minutes
  if (diffMinutes > 10) {
    return 'LATE';
  }

  return 'PRESENT';
}

import { toDateOnly, isAfterToday } from '../lib/date.js';
import { AppError } from '../middleware/errorHandler.js';

export interface RecordAttendanceInput {
  employeeId: number;
  date: string | Date;
  checkIn?: string | Date | null;
  checkOut?: string | Date | null;
  status?: AttendanceStatus | null;
}

export class AttendanceService {
  static async recordAttendance(data: RecordAttendanceInput) {
    const normalizedDate = toDateOnly(data.date);

    // Safeguard 1: Reject creating Attendance for an inactive employee (400 error)
    const employee = await prisma.employee.findUnique({
      where: { id: data.employeeId },
      select: { id: true, status: true, firstName: true, lastName: true },
    });

    if (!employee) {
      throw new AppError(`Employee with ID ${data.employeeId} not found`, 404);
    }

    if (employee.status === 'INACTIVE') {
      throw new AppError(`Cannot record attendance for inactive employee ${employee.firstName} ${employee.lastName}.`, 400);
    }

    // Safeguard 2: Reject attendance records dated after today, unless status is ON_LEAVE
    if (isAfterToday(normalizedDate) && data.status !== 'ON_LEAVE') {
      throw new AppError('Attendance records dated after today are not permitted unless status is ON_LEAVE.', 400);
    }

    // Safeguard 3: Validate checkOut > checkIn if both provided
    if (data.checkIn && data.checkOut) {
      const inTime = new Date(data.checkIn).getTime();
      const outTime = new Date(data.checkOut).getTime();
      if (outTime <= inTime) {
        throw new AppError('checkOut time must be later than checkIn time.', 400);
      }
    }

    // Find shift assignment for this employee on this date if any
    const assignment = await prisma.shiftAssignment.findUnique({
      where: {
        employeeId_date: {
          employeeId: data.employeeId,
          date: normalizedDate,
        },
      },
      include: {
        shift: true,
      },
    });

    const shiftStartTime = assignment?.shift?.startTime ?? null;
    const finalStatus = deriveAttendanceStatus({
      checkIn: data.checkIn,
      shiftStartTime,
      explicitStatus: data.status,
    });

    const checkInDate = data.checkIn ? new Date(data.checkIn) : null;
    const checkOutDate = data.checkOut ? new Date(data.checkOut) : null;

    // Upsert attendance record
    const attendance = await prisma.attendance.upsert({
      where: {
        employeeId_date: {
          employeeId: data.employeeId,
          date: normalizedDate,
        },
      },
      create: {
        employeeId: data.employeeId,
        date: normalizedDate,
        status: finalStatus,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        shiftAssignmentId: assignment ? assignment.id : null,
      },
      update: {
        status: finalStatus,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        shiftAssignmentId: assignment ? assignment.id : undefined,
      },
      include: {
        employee: {
          include: {
            department: true,
            role: true,
          },
        },
        shiftAssignment: {
          include: {
            shift: true,
          },
        },
      },
    });

    return attendance;
  }

  static async getAttendanceList(params: {
    search?: string;
    employeeId?: number;
    departmentId?: number;
    from?: string;
    to?: string;
    status?: AttendanceStatus;
    page?: number;
    pageSize?: number;
  }) {
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));
    const skip = (page - 1) * pageSize;

    const where: Prisma.AttendanceWhereInput = {};

    if (params.employeeId) {
      where.employeeId = params.employeeId;
    }

    if (params.departmentId || params.search) {
      where.employee = {};

      if (params.departmentId) {
        where.employee.departmentId = params.departmentId;
      }

      if (params.search && params.search.trim()) {
        const query = params.search.trim();
        where.employee.OR = [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ];
      }
    }

    if (params.status) {
      where.status = params.status;
    }

    if (params.from || params.to) {
      where.date = {};
      if (params.from) {
        where.date.gte = toDateOnly(params.from);
      }
      if (params.to) {
        // End of the target day (23:59:59.999 UTC)
        const toEnd = toDateOnly(params.to);
        toEnd.setUTCHours(23, 59, 59, 999);
        where.date.lte = toEnd;
      }
    }

    const [total, data] = await Promise.all([
      prisma.attendance.count({ where }),
      prisma.attendance.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { date: 'desc' },
        include: {
          employee: {
            include: {
              department: true,
              role: true,
            },
          },
          shiftAssignment: {
            include: {
              shift: true,
            },
          },
        },
      }),
    ]);

    return {
      data,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  static async getAttendanceById(id: number) {
    const record = await prisma.attendance.findUnique({
      where: { id },
      include: {
        employee: {
          include: {
            department: true,
            role: true,
          },
        },
        shiftAssignment: {
          include: {
            shift: true,
          },
        },
      },
    });
    return record;
  }

  static async deleteAttendance(id: number) {
    return prisma.attendance.delete({
      where: { id },
    });
  }
}
