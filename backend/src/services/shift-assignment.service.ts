import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma.js';
import { toDateOnly } from '../lib/date.js';
import { AppError } from '../middleware/errorHandler.js';

export interface CreateShiftAssignmentInput {
  employeeId: number;
  shiftId: number;
  date: string | Date;
}

export class ShiftAssignmentService {
  static async create(data: CreateShiftAssignmentInput) {
    const normalizedDate = toDateOnly(data.date);

    // Safeguard 1: Check employee exists and reject if INACTIVE
    const employee = await prisma.employee.findUnique({
      where: { id: data.employeeId },
      select: { id: true, status: true, firstName: true, lastName: true },
    });

    if (!employee) {
      throw new AppError(`Employee with ID ${data.employeeId} not found`, 404);
    }

    if (employee.status === 'INACTIVE') {
      throw new AppError(`Cannot assign a shift to inactive employee ${employee.firstName} ${employee.lastName}.`, 400);
    }

    // Check shift exists
    const shift = await prisma.shift.findUnique({
      where: { id: data.shiftId },
      select: { id: true },
    });

    if (!shift) {
      throw new AppError(`Shift with ID ${data.shiftId} not found`, 404);
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

  static async getAll(params: {
    search?: string;
    date?: string;
    employeeId?: number;
    departmentId?: number;
    page?: number;
    pageSize?: number;
  }) {
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));
    const skip = (page - 1) * pageSize;

    const where: Prisma.ShiftAssignmentWhereInput = {};

    if (params.date) {
      where.date = toDateOnly(params.date);
    }

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

  static async getById(id: number) {
    return prisma.shiftAssignment.findUnique({
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
  }

  static async delete(id: number) {
    return prisma.shiftAssignment.delete({
      where: { id },
    });
  }
}
