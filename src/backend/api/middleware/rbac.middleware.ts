/**
 * RBAC Middleware — Role-based access control.
 * Usage: router.get('/admin', authMiddleware, rbacMiddleware('admin'), handler);
 */

import { Request, Response, NextFunction } from 'express';
import { sendError } from '../../utils/response';

export function rbacMiddleware(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, { code: 'UNAUTHORIZED', message: 'Authentication required', status: 401 });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(res, { code: 'FORBIDDEN', message: 'Insufficient permissions', status: 403 });
    }

    next();
  };
}