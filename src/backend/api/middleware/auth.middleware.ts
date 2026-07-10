/**
 * Auth Middleware — Verifies JWT token on protected routes.
 * Attaches the decoded user to req.user.
 */

import { Request, Response, NextFunction } from 'express';
import { jwtService } from '../../auth/jwt.service';
import { sendError } from '../../utils/response';

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, { code: 'UNAUTHORIZED', message: 'Missing or invalid auth token', status: 401 });
  }

  const token = authHeader.substring(7);

  try {
    const payload = await jwtService.verify(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
    next();
  } catch {
    return sendError(res, { code: 'UNAUTHORIZED', message: 'Invalid or expired token', status: 401 });
  }
}