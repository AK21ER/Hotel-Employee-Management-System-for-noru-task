import prisma from '../lib/prisma.js';

export interface CreateShiftInput {
  name: string;
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
}

export interface UpdateShiftInput {
  name?: string;
  startTime?: string;
  endTime?: string;
}

export class ShiftService {
  static async create(data: CreateShiftInput) {
    return prisma.shift.create({
      data: {
        name: data.name,
        startTime: data.startTime,
        endTime: data.endTime,
      },
      include: {
        _count: {
          select: { assignments: true },
        },
      },
    });
  }

  static async getAll(params?: { page?: number; pageSize?: number }) {
    const page = Math.max(1, params?.page || 1);
    const pageSize = Math.min(100, Math.max(1, params?.pageSize || 50));
    const skip = (page - 1) * pageSize;

    const [total, data] = await Promise.all([
      prisma.shift.count(),
      prisma.shift.findMany({
        skip,
        take: pageSize,
        orderBy: { startTime: 'asc' },
        include: {
          _count: {
            select: { assignments: true },
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
    return prisma.shift.findUnique({
      where: { id },
      include: {
        _count: {
          select: { assignments: true },
        },
      },
    });
  }

  static async update(id: number, data: UpdateShiftInput) {
    return prisma.shift.update({
      where: { id },
      data,
      include: {
        _count: {
          select: { assignments: true },
        },
      },
    });
  }

  static async delete(id: number) {
    return prisma.shift.delete({
      where: { id },
    });
  }
}
