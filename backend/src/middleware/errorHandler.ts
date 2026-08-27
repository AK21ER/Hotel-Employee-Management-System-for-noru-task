import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Check if custom AppError
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: 'Client Error',
      message: err.message,
    });
  }

  // Prisma unique constraint violation
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = err.meta?.target;
      let targetStr = Array.isArray(target) ? target.join(', ') : String(target || '');
      let specificMessage = `A unique constraint failed on (${targetStr || 'fields'}).`;

      if (targetStr.includes('email')) {
        specificMessage = 'An employee with this email address already exists.';
      } else if (targetStr.includes('employeeId') && targetStr.includes('date')) {
        specificMessage = 'A duplicate record already exists for this employee on this date (only one shift assignment and one attendance record allowed per employee per day).';
      } else if (targetStr.includes('name')) {
        specificMessage = 'A department with this name already exists.';
      } else if (targetStr.includes('title')) {
        specificMessage = 'A role with this title already exists.';
      }

      return res.status(409).json({
        error: 'Conflict',
        message: specificMessage,
        code: err.code,
        target: targetStr,
      });
    }

    // Record not found
    if (err.code === 'P2025') {
      return res.status(404).json({
        error: 'Not Found',
        message: (err.meta?.cause as string) || 'The requested resource was not found.',
        code: err.code,
      });
    }

    // Foreign key constraint failed (e.g. deleting department or role with active staff)
    if (err.code === 'P2003') {
      const field = (err.meta?.field_name as string) || 'foreign key';
      return res.status(409).json({
        error: 'Conflict',
        message: 'Cannot delete: one or more employees or records still reference this resource.',
        code: err.code,
        details: { field },
      });
    }
  }

  // Fallback 500 error
  console.error('Unhandled Server Error:', err);
  return res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred.' : err.message,
  });
};
