/**
 * RBAC Middleware — Permission-based access control for Express routes.
 *
 * Usage:
 *   router.post('/admin/users', authMiddleware, requirePermission('users.manage'), handler);
 *
 * Behavior:
 *   - Requires an authenticated user (authMiddleware must run first).
 *   - Resolves the caller's effective permissions from the RBAC service
 *     (database-backed, never trusts client-supplied permission values).
 *   - 401 when unauthenticated, 403 when the permission is missing.
 *   - On denial, the RBAC service writes a permission_denied audit record.
 *
 * This is distinct from the legacy role-check middleware at
 * src/backend/api/middleware/rbac.middleware.ts (which checks req.user.role
 * against a static allowlist). That middleware remains for routes that gate on
 * the built-in role only; this one gates on the full RBAC permission catalog.
 */
import { Request, Response, NextFunction } from 'express';
import { requirePermission as resolvePermission } from '../services/rbac.service';
import { sendError } from '../utils/response';

/** Express Request augmented with the authenticated user set by authMiddleware. */
interface AuthedRequest extends Request {
  user?: { id: string; email: string; role: string };
}

export function requirePermission(permission: string) {
  return async (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
        status: 401,
      });
    }

    try {
      const endpoint = `${req.method} ${req.path}`;
      const { ok } = await resolvePermission(req.user, permission, endpoint);
      if (!ok) {
        return sendError(res, {
          code: 'FORBIDDEN',
          message: `Forbidden: "${permission}" permission required`,
          status: 403,
        });
      }
      next();
    } catch (e) {
      return sendError(res, {
        code: 'INTERNAL_ERROR',
        message: 'Permission resolution failed',
        status: 500,
      });
    }
  };
}

export default requirePermission;