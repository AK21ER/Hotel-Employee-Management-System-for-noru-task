import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './docs/swagger.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/auth.routes.js';
import employeeRoutes from './routes/employee.routes.js';
import departmentRoutes from './routes/department.routes.js';
import roleRoutes from './routes/role.routes.js';
import shiftRoutes from './routes/shift.routes.js';
import shiftAssignmentRoutes from './routes/shift-assignment.routes.js';
import attendanceRoutes from './routes/attendance.routes.js';
import reportRoutes from './routes/report.routes.js';

export const createApp = () => {
  const app = express();

  // Global Middleware
  app.use(
    cors({
      origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173'],
      credentials: true,
    })
  );
  app.use(cookieParser());
  app.use(express.json());

  // API Documentation (Swagger)
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/employees', employeeRoutes);
  app.use('/api/departments', departmentRoutes);
  app.use('/api/roles', roleRoutes);
  app.use('/api/shifts', shiftRoutes);
  app.use('/api/shift-assignments', shiftAssignmentRoutes);
  app.use('/api/attendance', attendanceRoutes);
  app.use('/api/reports', reportRoutes);

  // Centralized Error Handling Middleware
  app.use(errorHandler);

  return app;
};

export default createApp;
