import prisma from '../lib/prisma.js';

export interface CreateDepartmentInput {
  name: string;
  description?: string | null;
}

export interface UpdateDepartmentInput {
  name?: string;
  description?: string | null;
}

export class DepartmentService {
  static async create(data: CreateDepartmentInput) {
    return prisma.department.create({
      data: {
        name: data.name,
        description: data.description ?? null,
      },
      include: {
        _count: {
          select: { employees: true },
        },
      },
    });
  }

  static async getAll(params?: { page?: number; pageSize?: number }) {
    const page = Math.max(1, params?.page || 1);
    const pageSize = Math.min(100, Math.max(1, params?.pageSize || 50));
    const skip = (page - 1) * pageSize;

    const [total, data] = await Promise.all([
      prisma.department.count(),
      prisma.department.findMany({
        skip,
        take: pageSize,
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { employees: true },
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

  static async getById(id: number) {
    return prisma.department.findUnique({
      where: { id },
      include: {
        employees: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            status: true,
            role: true,
          },
        },
        _count: {
          select: { employees: true },
        },
      },
    });
  }

  static async update(id: number, data: UpdateDepartmentInput) {
    return prisma.department.update({
      where: { id },
      data,
      include: {
        _count: {
          select: { employees: true },
        },
      },
    });
  }

  static async delete(id: number) {
    return prisma.department.delete({
      where: { id },
    });
  }
}
