/**
 * User Routes — Current-user read/update (all auth-protected).
 */
import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authMiddleware } from '../middleware/auth.middleware';

export const userRoutes = Router();

userRoutes.get('/me', authMiddleware, userController.getMe);
userRoutes.patch('/me', authMiddleware, userController.updateMe);