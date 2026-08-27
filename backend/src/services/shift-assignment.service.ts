import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma.js';

export interface CreateShiftAssignmentInput {
  employeeId: number;
  shiftId: number;
  date: string | Date;
}

export class ShiftAssignmentService {
  static async create(data: CreateShiftAssignmentInput) {
    const calendarDate = new Date(data.date);
    const normalizedDate = new Date(
      Date.UTC(calendarDate.getUTCFullYear(), calendarDate.getUTCMonth(), calendarDate.getUTCDate())
    );

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
      const parts = params.date.split('-');
      const targetDate = new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])));
      where.date = targetDate;
    }

    if (params.employeeId) {
      where.employeeId = params.employeeId;
    }

    if (params.departmentId) {
      where.employee = {
        departmentId: params.departmentId,
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
