import { Request, Response, NextFunction } from 'express';
import { verifyToken, AuthUserPayload } from '../lib/auth.js';
import { AppError } from './errorHandler.js';

// Extend Express Request type to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    let token = req.cookies?.token;

    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new AppError('Authentication required. Please log in.', 401);
    }

    const payload = verifyToken(token);
    req.user = payload;

    // Check forced password change requirement
    if (payload.mustChangePassword) {
      const allowedPaths = ['/api/auth/change-password', '/api/auth/logout', '/api/auth/me'];
      const currentPath = req.baseUrl ? `${req.baseUrl}${req.path}` : req.path;

      const isAllowed = allowedPaths.some(
        (p) => currentPath === p || req.originalUrl?.startsWith(p)
      );

      if (!isAllowed) {
        return res.status(403).json({
          status: 'error',
          error: 'PASSWORD_CHANGE_REQUIRED',
          message: 'Password change is required before accessing the system.',
        });
      }
    }

    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return next(new AppError('Invalid or expired authentication token. Please log in again.', 401));
    }
    next(error);
  }
};

export const requireRole = (...roles: ('ADMIN' | 'MANAGER' | 'STAFF')[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          `Forbidden: role '${req.user.role}' lacks permission for this operation. Permitted roles: ${roles.join(', ')}`,
          403
        )
      );
    }

    next();
  };
};
