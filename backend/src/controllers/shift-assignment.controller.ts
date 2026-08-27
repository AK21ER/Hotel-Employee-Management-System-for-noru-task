import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ShiftAssignmentService } from '../services/shift-assignment.service.js';
import { AppError } from '../middleware/errorHandler.js';

export const createShiftAssignmentSchema = z.object({
  employeeId: z.number().int().positive('employeeId is required'),
  shiftId: z.number().int().positive('shiftId is required'),
  date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD or ISO datetime')),
});

export class ShiftAssignmentController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const assignment = await ShiftAssignmentService.create(req.body);
      res.status(201).json({
        message: 'Shift assignment created successfully',
        data: assignment,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { date, employeeId, departmentId, page, pageSize } = req.query;
      const result = await ShiftAssignmentService.getAll({
        date: date ? String(date) : undefined,
        employeeId: employeeId ? Number(employeeId) : undefined,
        departmentId: departmentId ? Number(departmentId) : undefined,
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

      const assignment = await ShiftAssignmentService.getById(id);
      if (!assignment) {
        throw new AppError('Shift assignment not found', 404);
      }
      res.status(200).json({ data: assignment });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) throw new AppError('Invalid ID format', 400);

      await ShiftAssignmentService.delete(id);
      res.status(200).json({
        message: 'Shift assignment deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
