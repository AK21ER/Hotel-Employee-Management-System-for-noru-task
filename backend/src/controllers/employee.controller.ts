import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { EmployeeService } from '../services/employee.service.js';
import { AppError } from '../middleware/errorHandler.js';

export const createEmployeeSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional().nullable(),
  hireDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional().default('ACTIVE'),
  departmentId: z.number().int().positive('Department ID must be a positive integer'),
  roleId: z.number().int().positive('Role ID must be a positive integer'),
});

export const updateEmployeeSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional().nullable(),
  hireDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  departmentId: z.number().int().positive().optional(),
  roleId: z.number().int().positive().optional(),
});

export class EmployeeController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const employee = await EmployeeService.create(req.body);
      res.status(201).json({
        message: 'Employee created successfully',
        data: employee,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, departmentId, roleId, status, page, pageSize } = req.query;
      const result = await EmployeeService.getAll({
        search: search ? String(search) : undefined,
        departmentId: departmentId ? Number(departmentId) : undefined,
        roleId: roleId ? Number(roleId) : undefined,
        status: status as any,
        page: page ? Number(page) : undefined,
        pageSize: pageSize ? Number(pageSize) : undefined,
      });
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) throw new AppError('Invalid ID format', 400);

      const employee = await EmployeeService.getById(id);
      if (!employee) {
        throw new AppError('Employee not found', 404);
      }
      res.status(200).json({ data: employee });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) throw new AppError('Invalid ID format', 400);

      const updated = await EmployeeService.update(id, req.body);
      res.status(200).json({
        message: 'Employee updated successfully',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) throw new AppError('Invalid ID format', 400);

      const deleted = await EmployeeService.delete(id);
      res.status(200).json({
        message: 'Employee deactivated successfully (soft-deleted)',
        data: deleted,
      });
    } catch (error) {
      next(error);
    }
  }
}
