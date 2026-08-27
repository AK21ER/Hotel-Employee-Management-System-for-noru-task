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
      const target = (err.meta?.target as string[])?.join(', ') || 'fields';
      return res.status(409).json({
        error: 'Conflict',
        message: `A record with this ${target} already exists.`,
        code: err.code,
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

    // Foreign key constraint failed
    if (err.code === 'P2003') {
      const field = (err.meta?.field_name as string) || 'foreign key';
      return res.status(400).json({
        error: 'Bad Request',
        message: `Foreign key constraint failed on ${field}. Related record does not exist.`,
        code: err.code,
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
