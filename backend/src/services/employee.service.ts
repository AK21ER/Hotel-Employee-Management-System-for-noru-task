import { EmployeeStatus, Prisma } from '@prisma/client';
import prisma from '../lib/prisma.js';

export interface CreateEmployeeInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  hireDate: string | Date;
  status?: EmployeeStatus;
  departmentId: number;
  roleId: number;
}

export interface UpdateEmployeeInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string | null;
  hireDate?: string | Date;
  status?: EmployeeStatus;
  departmentId?: number;
  roleId?: number;
}

export class EmployeeService {
  static async create(data: CreateEmployeeInput) {
    return prisma.employee.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone ?? null,
        hireDate: new Date(data.hireDate),
        status: data.status || 'ACTIVE',
        departmentId: data.departmentId,
        roleId: data.roleId,
      },
      include: {
        department: true,
        role: true,
      },
    });
  }

  static async getAll(params: {
    search?: string;
    departmentId?: number;
    roleId?: number;
    status?: EmployeeStatus;
    page?: number;
    pageSize?: number;
  }) {
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));
    const skip = (page - 1) * pageSize;

    const where: Prisma.EmployeeWhereInput = {};

    if (params.status) {
      where.status = params.status;
    }

    if (params.departmentId) {
      where.departmentId = params.departmentId;
    }

    if (params.roleId) {
      where.roleId = params.roleId;
    }

    if (params.search) {
      where.OR = [
        { firstName: { contains: params.search, mode: 'insensitive' } },
        { lastName: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [total, data] = await Promise.all([
      prisma.employee.count({ where }),
      prisma.employee.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [{ status: 'asc' }, { lastName: 'asc' }, { firstName: 'asc' }],
        include: {
          department: true,
          role: true,
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
    return prisma.employee.findUnique({
      where: { id },
      include: {
        department: true,
        role: true,
        assignments: {
          take: 10,
          orderBy: { date: 'desc' },
          include: { shift: true },
        },
        attendance: {
          take: 10,
          orderBy: { date: 'desc' },
        },
      },
    });
  }

  static async update(id: number, data: UpdateEmployeeInput) {
    return prisma.employee.update({
      where: { id },
      data: {
        ...data,
        hireDate: data.hireDate ? new Date(data.hireDate) : undefined,
      },
      include: {
        department: true,
        role: true,
      },
    });
  }

  /**
   * Soft delete: mark status as INACTIVE to preserve historical shifts and attendance integrity.
   */
  static async delete(id: number) {
    return prisma.employee.update({
      where: { id },
      data: {
        status: 'INACTIVE',
      },
      include: {
        department: true,
        role: true,
      },
    });
  }
}
