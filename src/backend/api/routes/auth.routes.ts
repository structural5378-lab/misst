/**
 * Auth Routes — Thin route definitions, delegates to controller.
 */

import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { rateLimitMiddleware } from '../middleware/rate-limit.middleware';
import { validate } from '../middleware/validate.middleware';
import { registerSchema, loginSchema, otpSchema, resetPasswordSchema } from '../../config/schemas/auth.schema';

export const authRoutes = Router();

authRoutes.post('/register', rateLimitMiddleware('register'), validate(registerSchema), authController.register);
authRoutes.post('/verify-otp', rateLimitMiddleware('verifyOtp'), validate(otpSchema), authController.verifyOtp);
authRoutes.post('/resend-otp', rateLimitMiddleware('resendOtp'), authController.resendOtp);
authRoutes.post('/login', rateLimitMiddleware('login'), validate(loginSchema), authController.login);
authRoutes.post('/refresh', rateLimitMiddleware('refresh'), authController.refresh);
authRoutes.post('/logout', authController.logout);
authRoutes.post('/password/reset-request', rateLimitMiddleware('resetRequest'), authController.resetRequest);
authRoutes.post('/password/reset', rateLimitMiddleware('reset'), validate(resetPasswordSchema), authController.reset);
authRoutes.get('/oauth/:provider', authController.oauthRedirect);
authRoutes.get('/oauth/:provider/callback', authController.oauthCallback);
authRoutes.get('/me', authController.me);