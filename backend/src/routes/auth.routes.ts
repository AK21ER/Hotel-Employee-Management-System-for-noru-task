import { Router } from 'express';
import {
  AuthController,
  loginSchema,
  registerSchema,
  changePasswordSchema,
} from '../controllers/auth.controller.js';
import { validateRequest } from '../middleware/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// Public auth routes
router.post('/login', validateRequest({ body: loginSchema }), AuthController.login);
router.post('/logout', AuthController.logout);

// Authenticated session state
router.get('/me', requireAuth, AuthController.me);
router.patch('/change-password', requireAuth, validateRequest({ body: changePasswordSchema }), AuthController.changePassword);

// Admin-only user provisioning
router.post('/register', requireAuth, requireRole('ADMIN'), validateRequest({ body: registerSchema }), AuthController.register);

export default router;
