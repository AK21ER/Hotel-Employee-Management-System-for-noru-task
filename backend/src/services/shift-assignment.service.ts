import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma.js';
import { toDateOnly } from '../lib/date.js';
import { AppError } from '../middleware/errorHandler.js';
import { AuthUserPayload } from '../lib/auth.js';

export interface CreateShiftAssignmentInput {
  employeeId: number;
  shiftId: number;
  date: string | Date;
}

export class ShiftAssignmentService {
  static async create(data: CreateShiftAssignmentInput, actor?: AuthUserPayload) {
    const normalizedDate = toDateOnly(data.date);

    if (actor?.role === 'STAFF') {
      throw new AppError('Staff members cannot create shift assignments', 403);
    }

    // Safeguard 1: Check employee exists and reject if INACTIVE
    const employee = await prisma.employee.findUnique({
      where: { id: data.employeeId },
      select: { id: true, status: true, firstName: true, lastName: true, departmentId: true },
    });

    if (!employee) {
      throw new AppError(`Employee with ID ${data.employeeId} not found`, 404);
    }

    if (actor?.role === 'MANAGER' && employee.departmentId !== actor.departmentId) {
      throw new AppError('Managers can only assign shifts to employees in their own department', 403);
    }

    if (employee.status === 'INACTIVE') {
      throw new AppError(`Cannot assign a shift to inactive employee ${employee.firstName} ${employee.lastName}.`, 400);
    }

    // Check if assignment already exists for (employeeId, normalizedDate)
    const existing = await prisma.shiftAssignment.findUnique({
      where: {
        employeeId_date: {
          employeeId: data.employeeId,
          date: normalizedDate,
        },
      },
    });

    if (existing) {
      throw new AppError('A shift assignment already exists for this employee on this date', 409);
    }

    return prisma.shiftAssignment.create({
      data: {
        employeeId: data.employeeId,
        shiftId: data.shiftId,
        date: normalizedDate,
      },
      include: {
        employee: {
          include: {
            department: true,
            role: true,
          },
        },
        shift: true,
        attendance: true,
      },
    });
  }

  static async getAll(
    params: {
      search?: string;
      date?: string;
      employeeId?: number;
      departmentId?: number;
      page?: number;
      pageSize?: number;
    },
    actor?: AuthUserPayload
  ) {
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));
    const skip = (page - 1) * pageSize;

    const where: Prisma.ShiftAssignmentWhereInput = {};

    if (params.date) {
      where.date = toDateOnly(params.date);
    }

    if (actor?.role === 'STAFF') {
      // Force filter to own employee ID, ignoring any client query params
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

    const [total, data] = await Promise.all([
      prisma.shiftAssignment.count({ where }),
      prisma.shiftAssignment.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [{ date: 'desc' }, { shift: { startTime: 'asc' } }],
        include: {
          employee: {
            include: {
              department: true,
              role: true,
            },
          },
          shift: true,
          attendance: true,
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

  static async getById(id: number, actor?: AuthUserPayload) {
    const assignment = await prisma.shiftAssignment.findUnique({
      where: { id },
      include: {
        employee: {
          include: {
            department: true,
            role: true,
          },
        },
        shift: true,
        attendance: true,
      },
    });

    if (!assignment) {
      return null;
    }

    if (actor?.role === 'MANAGER' && assignment.employee.departmentId !== actor.departmentId) {
      throw new AppError('Access denied: shift assignment belongs to another department', 403);
    }

    if (actor?.role === 'STAFF' && assignment.employeeId !== actor.employeeId) {
      throw new AppError('Access denied: staff can only view their own shift assignments', 403);
    }

    return assignment;
  }

  static async delete(id: number, actor?: AuthUserPayload) {
    const existing = await prisma.shiftAssignment.findUnique({
      where: { id },
      include: { employee: true },
    });

    if (!existing) {
      throw new AppError('Shift assignment not found', 404);
    }

    if (actor?.role === 'STAFF') {
      throw new AppError('Staff members cannot delete shift assignments', 403);
    }

    if (actor?.role === 'MANAGER' && existing.employee.departmentId !== actor.departmentId) {
      throw new AppError('Access denied: cannot delete assignments for another department', 403);
    }

    return prisma.shiftAssignment.delete({
      where: { id },
    });
  }
}
