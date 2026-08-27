import prisma from '../lib/prisma.js';
import { hashPassword, comparePassword, signToken, AuthUserPayload } from '../lib/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { UserRole } from '@prisma/client';

export class AuthService {
  static async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        employee: {
          include: {
            department: true,
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401);
    }

    const departmentId = user.employee?.departmentId ?? null;

    const payload: AuthUserPayload = {
      userId: user.id,
      email: user.email,
      role: user.role as any,
      employeeId: user.employeeId,
      departmentId,
      mustChangePassword: user.mustChangePassword,
    };

    const token = signToken(payload);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
        departmentId,
        mustChangePassword: user.mustChangePassword,
        employee: user.employee,
      },
    };
  }

  static async register(data: {
    email: string;
    password: string;
    role: 'ADMIN' | 'MANAGER';
    employeeId?: number;
  }) {
    const email = data.email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      throw new AppError('A user with this email address already exists', 409);
    }

    if (data.employeeId) {
      const existingEmpUser = await prisma.user.findUnique({
        where: { employeeId: data.employeeId },
      });
      if (existingEmpUser) {
        throw new AppError('This employee already has a linked user account', 409);
      }
    }

    const passwordHash = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: data.role as UserRole,
        mustChangePassword: false, // Accounts created with chosen password do not require immediate reset
        employeeId: data.employeeId || null,
      },
      include: {
        employee: {
          include: {
            department: true,
            role: true,
          },
        },
      },
    });

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      employeeId: user.employeeId,
      departmentId: user.employee?.departmentId ?? null,
      mustChangePassword: user.mustChangePassword,
      createdAt: user.createdAt,
    };
  }

  static async changePassword(userId: number, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        employee: {
          include: {
            department: true,
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const isMatch = await comparePassword(currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Incorrect current password', 400);
    }

    if (currentPassword === newPassword) {
      throw new AppError('New password must be different from current password', 400);
    }

    const newPasswordHash = await hashPassword(newPassword);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newPasswordHash,
        mustChangePassword: false,
      },
      include: {
        employee: {
          include: {
            department: true,
            role: true,
          },
        },
      },
    });

    const departmentId = updatedUser.employee?.departmentId ?? null;

    const payload: AuthUserPayload = {
      userId: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role as any,
      employeeId: updatedUser.employeeId,
      departmentId,
      mustChangePassword: false,
    };

    const token = signToken(payload);

    return {
      token,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
        employeeId: updatedUser.employeeId,
        departmentId,
        mustChangePassword: false,
        employee: updatedUser.employee,
      },
    };
  }

  static async getCurrentUser(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        employee: {
          include: {
            department: true,
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      employeeId: user.employeeId,
      departmentId: user.employee?.departmentId ?? null,
      mustChangePassword: user.mustChangePassword,
      employee: user.employee,
      createdAt: user.createdAt,
    };
  }
}
