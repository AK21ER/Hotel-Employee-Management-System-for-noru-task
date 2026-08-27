import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ShiftService } from '../services/shift.service.js';
import { AppError } from '../middleware/errorHandler.js';

export const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const createShiftSchema = z.object({
  name: z.string().min(1, 'Shift name is required'),
  startTime: z.string().regex(timeRegex, 'startTime must be in HH:mm 24-hour format (e.g. 07:00)'),
  endTime: z.string().regex(timeRegex, 'endTime must be in HH:mm 24-hour format (e.g. 15:00)'),
});

export const updateShiftSchema = z.object({
  name: z.string().min(1).optional(),
  startTime: z.string().regex(timeRegex, 'startTime must be in HH:mm 24-hour format').optional(),
  endTime: z.string().regex(timeRegex, 'endTime must be in HH:mm 24-hour format').optional(),
});

export class ShiftController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const shift = await ShiftService.create(req.body);
      res.status(201).json({
        message: 'Shift created successfully',
        data: shift,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, pageSize } = req.query;
      const result = await ShiftService.getAll({
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

      const shift = await ShiftService.getById(id);
      if (!shift) {
        throw new AppError('Shift not found', 404);
      }
      res.status(200).json({ data: shift });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) throw new AppError('Invalid ID format', 400);

      const updated = await ShiftService.update(id, req.body);
      res.status(200).json({
        message: 'Shift updated successfully',
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

      await ShiftService.delete(id);
      res.status(200).json({
        message: 'Shift deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
