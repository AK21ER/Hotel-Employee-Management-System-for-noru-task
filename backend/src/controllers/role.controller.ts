import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { RoleService } from '../services/role.service.js';
import { AppError } from '../middleware/errorHandler.js';

export const createRoleSchema = z.object({
  title: z.string().min(1, 'Role title is required'),
  description: z.string().optional().nullable(),
});

export const updateRoleSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
});

export class RoleController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const role = await RoleService.create(req.body);
      res.status(201).json({
        message: 'Role created successfully',
        data: role,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, pageSize } = req.query;
      const result = await RoleService.getAll({
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

      const role = await RoleService.getById(id);
      if (!role) {
        throw new AppError('Role not found', 404);
      }
      res.status(200).json({ data: role });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) throw new AppError('Invalid ID format', 400);

      const updated = await RoleService.update(id, req.body);
      res.status(200).json({
        message: 'Role updated successfully',
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

      await RoleService.delete(id);
      res.status(200).json({
        message: 'Role deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
