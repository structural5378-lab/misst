/**
 * API Router — Mounts route modules under /api.
 *
 * Phase 1: only auth + user routes are implemented. Additional route
 * modules (profiles, chat, groups, notifications, weather, etc.) will be
 * mounted here as their Core implementations land in later phases.
 */

import { Router } from 'express';
import { authRoutes } from './routes/auth.routes';
import { userRoutes } from './routes/user.routes';
import { entityRoutes } from './routes/entity.routes';

export const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/entities', entityRoutes);