import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'noru-hotel-hrms-super-secret-jwt-key-2026';

export interface AuthUserPayload {
  userId: number;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'STAFF';
  employeeId: number | null;
  departmentId: number | null;
  mustChangePassword: boolean;
}

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 10);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateTempPassword = (): string => {
  // Generate an 8-character random alphanumeric string + special char
  const randomChars = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `Noru#${randomChars}`;
};

export const signToken = (payload: AuthUserPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

export const verifyToken = (token: string): AuthUserPayload => {
  return jwt.verify(token, JWT_SECRET) as AuthUserPayload;
};
