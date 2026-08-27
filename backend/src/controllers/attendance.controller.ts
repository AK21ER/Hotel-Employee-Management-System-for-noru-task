import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AttendanceService } from '../services/attendance.service.js';
import { AppError } from '../middleware/errorHandler.js';

export const recordAttendanceSchema = z.object({
  employeeId: z.number().int().positive('employeeId is required'),
  date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD or ISO datetime')),
  checkIn: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?/)).optional().nullable(),
  checkOut: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?/)).optional().nullable(),
  status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'ON_LEAVE']).optional().nullable(),
});

export class AttendanceController {
  static async recordAttendance(req: Request, res: Response, next: NextFunction) {
    try {
      const attendance = await AttendanceService.recordAttendance(req.body);
      res.status(201).json({
        message: 'Attendance recorded successfully',
        data: attendance,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { employeeId, departmentId, from, to, status, page, pageSize } = req.query;
      const result = await AttendanceService.getAttendanceList({
        employeeId: employeeId ? Number(employeeId) : undefined,
        departmentId: departmentId ? Number(departmentId) : undefined,
        from: from ? String(from) : undefined,
        to: to ? String(to) : undefined,
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

      const record = await AttendanceService.getAttendanceById(id);
      if (!record) {
        throw new AppError('Attendance record not found', 404);
      }
      res.status(200).json({ data: record });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) throw new AppError('Invalid ID format', 400);

      await AttendanceService.deleteAttendance(id);
      res.status(200).json({
        message: 'Attendance record deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
