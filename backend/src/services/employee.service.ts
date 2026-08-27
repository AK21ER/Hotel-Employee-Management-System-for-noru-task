import { EmployeeStatus, Prisma } from '@prisma/client';
import prisma from '../lib/prisma.js';
import { generateTempPassword, hashPassword, AuthUserPayload } from '../lib/auth.js';
import { AppError } from '../middleware/errorHandler.js';

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
  /**
   * Creates an Employee and auto-provisions a linked User account with role STAFF and a temporary password.
   * Scoped so MANAGER can only create staff in their own department.
   */
  static async create(data: CreateEmployeeInput, actor?: AuthUserPayload) {
    if (actor?.role === 'MANAGER') {
      if (Number(data.departmentId) !== actor.departmentId) {
        throw new AppError('Managers can only create employees in their own department', 403);
      }
    }

    const email = data.email.toLowerCase().trim();
    const tempPassword = generateTempPassword();
    const passwordHash = await hashPassword(tempPassword);

    const result = await prisma.$transaction(async (tx) => {
      const employee = await tx.employee.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          email,
          phone: data.phone ?? null,
          hireDate: new Date(data.hireDate),
          status: data.status || 'ACTIVE',
          departmentId: Number(data.departmentId),
          roleId: Number(data.roleId),
        },
        include: {
          department: true,
          role: true,
        },
      });

      await tx.user.create({
        data: {
          email,
          passwordHash,
          role: 'STAFF',
          mustChangePassword: true, // Forces password change upon first login
          employeeId: employee.id,
        },
      });

      return employee;
    });

    return {
      employee: result,
      tempPassword,
    };
  }

  static async getAll(
    params: {
      search?: string;
      departmentId?: number;
      roleId?: number;
      status?: EmployeeStatus;
      page?: number;
      pageSize?: number;
    },
    actor?: AuthUserPayload
  ) {
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));
    const skip = (page - 1) * pageSize;

    const where: Prisma.EmployeeWhereInput = {};

    if (actor?.role === 'MANAGER') {
      where.departmentId = actor.departmentId || -1;
    } else if (actor?.role === 'STAFF') {
      where.id = actor.employeeId || -1;
    } else if (params.departmentId) {
      where.departmentId = params.departmentId;
    }

    if (params.status) {
      where.status = params.status;
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

  static async getById(id: number, actor?: AuthUserPayload) {
    const employee = await prisma.employee.findUnique({
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

    if (!employee) {
      return null;
    }

    if (actor?.role === 'MANAGER' && employee.departmentId !== actor.departmentId) {
      throw new AppError('Access denied: employee belongs to another department', 403);
    }

    if (actor?.role === 'STAFF' && employee.id !== actor.employeeId) {
      throw new AppError('Access denied: staff can only view their own profile', 403);
    }

    return employee;
  }

  static async update(id: number, data: UpdateEmployeeInput, actor?: AuthUserPayload) {
    const existing = await prisma.employee.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError('Employee not found', 404);
    }

    if (actor?.role === 'MANAGER') {
      if (existing.departmentId !== actor.departmentId) {
        throw new AppError('Access denied: employee belongs to another department', 403);
      }
      if (data.departmentId && Number(data.departmentId) !== actor.departmentId) {
        throw new AppError('Managers cannot transfer employees to another department', 403);
      }
    }

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
  static async delete(id: number, actor?: AuthUserPayload) {
    const existing = await prisma.employee.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError('Employee not found', 404);
    }

    if (actor?.role === 'MANAGER' && existing.departmentId !== actor.departmentId) {
      throw new AppError('Access denied: cannot deactivate employees outside your department', 403);
    }

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
