import { AttendanceStatus, Prisma } from '@prisma/client';
import prisma from '../lib/prisma.js';

export interface DeriveStatusInput {
  checkIn?: Date | string | null;
  checkOut?: Date | string | null;
  shiftStartTime?: string | null; // e.g. "07:00"
  shiftEndTime?: string | null;   // e.g. "15:00"
  explicitStatus?: AttendanceStatus | null;
}

/**
 * Pure business logic function to derive AttendanceStatus.
 * Rules:
 * - If explicitStatus is ON_LEAVE, it is preserved.
 * - If no checkIn provided and status not explicitly set -> ABSENT.
 * - If checkOut provided and before shiftEndTime -> PARTIAL_PRESENT.
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

  // Rule: Check if check-out time is before scheduled shift end time (Partial Present)
  if (input.checkOut && input.shiftEndTime) {
    const [endHoursStr, endMinutesStr] = input.shiftEndTime.split(':');
    const endHours = parseInt(endHoursStr, 10);
    const endMinutes = parseInt(endMinutesStr, 10);

    if (!isNaN(endHours) && !isNaN(endMinutes)) {
      const shiftEndTotalMinutes = endHours * 60 + endMinutes;
      const checkOutDate = typeof input.checkOut === 'string' ? new Date(input.checkOut) : input.checkOut;
      const checkOutHours = checkOutDate.getHours();
      const checkOutMinutes = checkOutDate.getMinutes();
      const checkOutTotalMinutes = checkOutHours * 60 + checkOutMinutes;

      let diffEndMinutes = checkOutTotalMinutes - shiftEndTotalMinutes;
      if (diffEndMinutes < -720) {
        diffEndMinutes += 1440;
      } else if (diffEndMinutes > 720) {
        diffEndMinutes -= 1440;
      }

      if (diffEndMinutes < 0) {
        return 'PARTIAL_PRESENT';
      }
    }
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
import { AuthUserPayload } from '../lib/auth.js';

export interface RecordAttendanceInput {
  employeeId: number;
  date: string | Date;
  checkIn?: string | Date | null;
  checkOut?: string | Date | null;
  status?: AttendanceStatus | null;
}

export interface CheckoutAttendanceInput {
  employeeId?: number;
  date?: string | Date;
  checkOut?: string | Date | null;
}

export interface CorrectAttendanceInput {
  checkIn?: string | Date | null;
  checkOut?: string | Date | null;
  status?: AttendanceStatus | null;
}

export class AttendanceService {
  /**
   * POST /api/attendance (Check-In)
   * For STAFF: Only ever creates a new record. If one already exists for today, rejects with 409 Conflict.
   * For ADMIN/MANAGER: If record already exists, updates with audit logging.
   */
  static async recordAttendance(data: RecordAttendanceInput, actor?: AuthUserPayload) {
    // If actor is STAFF, server forces employeeId = req.user.employeeId, ignoring any client value
    let targetEmployeeId = data.employeeId;
    if (actor?.role === 'STAFF') {
      if (!actor.employeeId) {
        throw new AppError('No linked employee profile found for staff user', 400);
      }
      targetEmployeeId = actor.employeeId;
    }

    const normalizedDate = toDateOnly(data.date);

    // Safeguard 1: Reject creating Attendance for an inactive employee (400 error)
    const employee = await prisma.employee.findUnique({
      where: { id: targetEmployeeId },
      select: { id: true, status: true, firstName: true, lastName: true, departmentId: true },
    });

    if (!employee) {
      throw new AppError(`Employee with ID ${targetEmployeeId} not found`, 404);
    }

    if (actor?.role === 'MANAGER' && employee.departmentId !== actor.departmentId) {
      throw new AppError('Managers can only log attendance for employees in their own department', 403);
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

    // Check if an Attendance record already exists for (employeeId, normalizedDate)
    const existing = await prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId: targetEmployeeId,
          date: normalizedDate,
        },
      },
    });

    // Find shift assignment for this employee on this date if any
    const assignment = await prisma.shiftAssignment.findUnique({
      where: {
        employeeId_date: {
          employeeId: targetEmployeeId,
          date: normalizedDate,
        },
      },
      include: {
        shift: true,
      },
    });

    const shiftStartTime = assignment?.shift?.startTime ?? null;
    const shiftEndTime = assignment?.shift?.endTime ?? null;
    const finalStatus = deriveAttendanceStatus({
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      shiftStartTime,
      shiftEndTime,
      explicitStatus: data.status,
    });

    const checkInDate = data.checkIn ? new Date(data.checkIn) : null;
    const checkOutDate = data.checkOut ? new Date(data.checkOut) : null;

    if (existing) {
      // Strict single check-in verification ONLY for STAFF
      if (actor?.role === 'STAFF') {
        throw new AppError('Already checked in for today — use check-out to complete your attendance record.', 409);
      }

      // For ADMIN & MANAGER: Administrative update with audit
      const updated = await prisma.attendance.update({
        where: { id: existing.id },
        data: {
          status: finalStatus,
          checkIn: checkInDate !== null ? checkInDate : existing.checkIn,
          checkOut: checkOutDate !== null ? checkOutDate : existing.checkOut,
          shiftAssignmentId: assignment ? assignment.id : existing.shiftAssignmentId,
          correctedById: actor?.userId ?? null,
          correctedAt: new Date(),
        },
        include: {
          employee: {
            include: { department: true, role: true },
          },
          shiftAssignment: {
            include: { shift: true },
          },
          correctedBy: {
            select: { id: true, email: true, role: true },
          },
        },
      });
      return updated;
    }

    // Create new attendance record
    const attendance = await prisma.attendance.create({
      data: {
        employeeId: targetEmployeeId,
        date: normalizedDate,
        status: finalStatus,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        shiftAssignmentId: assignment ? assignment.id : null,
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
        correctedBy: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return attendance;
  }

  /**
   * PATCH /api/attendance/checkout
   * For STAFF: Strict check-in and single checkout verification of the day.
   * For ADMIN/MANAGER: Can check out or log check-out timestamp for any employee.
   */
  static async checkout(data: CheckoutAttendanceInput, actor?: AuthUserPayload) {
    let targetEmployeeId = data.employeeId;
    if (actor?.role === 'STAFF') {
      if (!actor.employeeId) {
        throw new AppError('No linked employee profile found for staff user', 400);
      }
      targetEmployeeId = actor.employeeId;
    }

    if (!targetEmployeeId) {
      throw new AppError('employeeId is required for check-out', 400);
    }

    const employee = await prisma.employee.findUnique({
      where: { id: targetEmployeeId },
      select: { id: true, status: true, departmentId: true },
    });

    if (!employee) {
      throw new AppError(`Employee with ID ${targetEmployeeId} not found`, 404);
    }

    if (actor?.role === 'MANAGER' && employee.departmentId !== actor.departmentId) {
      throw new AppError('Managers can only check out employees in their own department', 403);
    }

    const targetDate = data.date ? toDateOnly(data.date) : toDateOnly(new Date());

    const existing = await prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId: targetEmployeeId,
          date: targetDate,
        },
      },
      include: {
        shiftAssignment: {
          include: { shift: true },
        },
      },
    });

    // Strict verification of the day ONLY for STAFF
    if (actor?.role === 'STAFF') {
      if (!existing) {
        throw new AppError("No active check-in found for today — you must check in before checking out.", 400);
      }

      if (existing.checkOut) {
        throw new AppError("Already checked out for today — cannot check out twice.", 400);
      }
    }

    const checkOutDate = data.checkOut ? new Date(data.checkOut) : new Date();

    if (existing && existing.checkIn && checkOutDate.getTime() <= existing.checkIn.getTime()) {
      throw new AppError("Check-out time must be later than check-in time.", 400);
    }

    if (!existing) {
      // For ADMIN & MANAGER: If no record exists, create check-out record directly
      const assignment = await prisma.shiftAssignment.findUnique({
        where: {
          employeeId_date: {
            employeeId: targetEmployeeId,
            date: targetDate,
          },
        },
        include: { shift: true },
      });

      const shiftStartTime = assignment?.shift?.startTime ?? null;
      const shiftEndTime = assignment?.shift?.endTime ?? null;

      const finalStatus = deriveAttendanceStatus({
        checkOut: checkOutDate,
        shiftStartTime,
        shiftEndTime,
        explicitStatus: null,
      });

      const created = await prisma.attendance.create({
        data: {
          employeeId: targetEmployeeId,
          date: targetDate,
          status: finalStatus,
          checkOut: checkOutDate,
          shiftAssignmentId: assignment ? assignment.id : null,
          correctedById: actor?.userId ?? null,
          correctedAt: new Date(),
        },
        include: {
          employee: {
            include: { department: true, role: true },
          },
          shiftAssignment: {
            include: { shift: true },
          },
          correctedBy: {
            select: { id: true, email: true, role: true },
          },
        },
      });

      return created;
    }

    // Determine shiftEndTime and recalculate status (PARTIAL_PRESENT if clocking out under shift end time)
    const shiftStartTime = existing.shiftAssignment?.shift?.startTime ?? null;
    const shiftEndTime = existing.shiftAssignment?.shift?.endTime ?? null;

    const newStatus = deriveAttendanceStatus({
      checkIn: existing.checkIn,
      checkOut: checkOutDate,
      shiftStartTime,
      shiftEndTime,
      explicitStatus: existing.status === 'ON_LEAVE' ? 'ON_LEAVE' : null,
    });

    const updated = await prisma.attendance.update({
      where: { id: existing.id },
      data: {
        checkOut: checkOutDate,
        status: newStatus,
        correctedById: actor?.role !== 'STAFF' ? (actor?.userId ?? null) : undefined,
        correctedAt: actor?.role !== 'STAFF' ? new Date() : undefined,
      },
      include: {
        employee: {
          include: { department: true, role: true },
        },
        shiftAssignment: {
          include: { shift: true },
        },
        correctedBy: {
          select: { id: true, email: true, role: true },
        },
      },
    });

    return updated;
  }

  /**
   * PATCH /api/attendance/:id/correct
   * Administrative correction endpoint restricted to ADMIN and MANAGER.
   */
  static async correctAttendance(id: number, data: CorrectAttendanceInput, actor?: AuthUserPayload) {
    if (actor?.role === 'STAFF') {
      throw new AppError('Staff members are not permitted to correct attendance records', 403);
    }

    const existing = await prisma.attendance.findUnique({
      where: { id },
      include: { employee: true },
    });

    if (!existing) {
      throw new AppError(`Attendance record with ID ${id} not found`, 404);
    }

    if (actor?.role === 'MANAGER' && existing.employee.departmentId !== actor.departmentId) {
      throw new AppError('Managers can only correct attendance records in their own department', 403);
    }

    const effectiveCheckIn = data.checkIn !== undefined ? (data.checkIn ? new Date(data.checkIn) : null) : existing.checkIn;
    const effectiveCheckOut = data.checkOut !== undefined ? (data.checkOut ? new Date(data.checkOut) : null) : existing.checkOut;

    if (effectiveCheckIn && effectiveCheckOut) {
      if (effectiveCheckOut.getTime() <= effectiveCheckIn.getTime()) {
        throw new AppError('Check-out time must be later than check-in time.', 400);
      }
    }

    const updated = await prisma.attendance.update({
      where: { id },
      data: {
        checkIn: effectiveCheckIn,
        checkOut: effectiveCheckOut,
        status: data.status !== undefined && data.status !== null ? data.status : existing.status,
        correctedById: actor?.userId ?? null,
        correctedAt: new Date(),
      },
      include: {
        employee: {
          include: { department: true, role: true },
        },
        shiftAssignment: {
          include: { shift: true },
        },
        correctedBy: {
          select: { id: true, email: true, role: true },
        },
      },
    });

    return updated;
  }

  static async getAttendanceList(
    params: {
      search?: string;
      employeeId?: number;
      departmentId?: number;
      from?: string;
      to?: string;
      status?: AttendanceStatus;
      page?: number;
      pageSize?: number;
    },
    actor?: AuthUserPayload
  ) {
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));
    const skip = (page - 1) * pageSize;

    const where: Prisma.AttendanceWhereInput = {};

    if (actor?.role === 'STAFF') {
      // Force filter to own employee record
      where.employeeId = actor.employeeId || -1;
    } else if (actor?.role === 'MANAGER') {
      where.employee = {
        departmentId: actor.departmentId || -1,
      };
      if (params.employeeId) {
        where.employeeId = params.employeeId;
      }
    } else {
      if (params.employeeId) {
        where.employeeId = params.employeeId;
      }
      if (params.departmentId) {
        where.employee = {
          departmentId: params.departmentId,
        };
      }
    }

    if (params.search && params.search.trim()) {
      const query = params.search.trim();
      where.employee = {
        ...((where.employee as Prisma.EmployeeWhereInput) || {}),
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      };
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

  static async getAttendanceById(id: number, actor?: AuthUserPayload) {
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

    if (!record) {
      return null;
    }

    if (actor?.role === 'MANAGER' && record.employee.departmentId !== actor.departmentId) {
      throw new AppError('Access denied: attendance belongs to another department', 403);
    }

    if (actor?.role === 'STAFF' && record.employeeId !== actor.employeeId) {
      throw new AppError('Access denied: staff can only view their own attendance', 403);
    }

    return record;
  }

  static async deleteAttendance(id: number, actor?: AuthUserPayload) {
    const existing = await prisma.attendance.findUnique({
      where: { id },
      include: { employee: true },
    });

    if (!existing) {
      throw new AppError('Attendance record not found', 404);
    }

    if (actor?.role === 'STAFF') {
      throw new AppError('Staff members cannot delete attendance records', 403);
    }

    if (actor?.role === 'MANAGER' && existing.employee.departmentId !== actor.departmentId) {
      throw new AppError('Access denied: cannot delete attendance for another department', 403);
    }

    return prisma.attendance.delete({
      where: { id },
    });
  }
}
