import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { DepartmentService } from '../services/department.service.js';
import { AppError } from '../middleware/errorHandler.js';

export const createDepartmentSchema = z.object({
  name: z.string().min(1, 'Department name is required'),
  description: z.string().optional().nullable(),
});

export const updateDepartmentSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
});

export class DepartmentController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const department = await DepartmentService.create(req.body);
      res.status(201).json({
        message: 'Department created successfully',
        data: department,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, pageSize } = req.query;
      const result = await DepartmentService.getAll({
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

      const department = await DepartmentService.getById(id);
      if (!department) {
        throw new AppError('Department not found', 404);
      }
      res.status(200).json({ data: department });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) throw new AppError('Invalid ID format', 400);

      const updated = await DepartmentService.update(id, req.body);
      res.status(200).json({
        message: 'Department updated successfully',
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

      await DepartmentService.delete(id);
      res.status(200).json({
        message: 'Department deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
