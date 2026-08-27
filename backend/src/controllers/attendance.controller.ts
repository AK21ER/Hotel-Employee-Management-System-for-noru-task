import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AttendanceService } from '../services/attendance.service.js';
import { AppError } from '../middleware/errorHandler.js';

import { toDateOnly, isAfterToday } from '../lib/date.js';

export const recordAttendanceSchema = z
  .object({
    employeeId: z.number().int().positive('employeeId is required'),
    date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD or ISO datetime')),
    checkIn: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?/)).optional().nullable(),
    checkOut: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?/)).optional().nullable(),
    status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'ON_LEAVE']).optional().nullable(),
  })
  .refine(
    (data) => {
      // Validate checkOut > checkIn if both provided
      if (data.checkIn && data.checkOut) {
        const inTime = new Date(data.checkIn).getTime();
        const outTime = new Date(data.checkOut).getTime();
        return outTime > inTime;
      }
      return true;
    },
    {
      message: 'checkOut time must be later than checkIn time',
      path: ['checkOut'],
    }
  )
  .refine(
    (data) => {
      // Reject attendance records dated after today, unless status is ON_LEAVE
      if (isAfterToday(data.date)) {
        return data.status === 'ON_LEAVE';
      }
      return true;
    },
    {
      message: 'Attendance records dated after today are not permitted unless status is ON_LEAVE',
      path: ['date'],
    }
  );

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
      const { search, employeeId, departmentId, from, to, status, page, pageSize } = req.query;
      const result = await AttendanceService.getAttendanceList({
        search: search ? String(search) : undefined,
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
