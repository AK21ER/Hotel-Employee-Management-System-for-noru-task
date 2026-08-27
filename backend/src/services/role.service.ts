import prisma from '../lib/prisma.js';

export interface CreateRoleInput {
  title: string;
  description?: string | null;
}

export interface UpdateRoleInput {
  title?: string;
  description?: string | null;
}

export class RoleService {
  static async create(data: CreateRoleInput) {
    return prisma.role.create({
      data: {
        title: data.title,
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
      prisma.role.count(),
      prisma.role.findMany({
        skip,
        take: pageSize,
        orderBy: { title: 'asc' },
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
    return prisma.role.findUnique({
      where: { id },
      include: {
        employees: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            status: true,
            department: true,
          },
        },
        _count: {
          select: { employees: true },
        },
      },
    });
  }

  static async update(id: number, data: UpdateRoleInput) {
    return prisma.role.update({
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
    return prisma.role.delete({
      where: { id },
    });
  }
}
