/**
 * Entity Routes — Generic CRUD for all entities under /api/entities/:name.
 *
 * All routes are auth-protected. The entity name is validated against the
 * registry inside the service. Authorization (RLS) is enforced by the service.
 *
 * Route order matters: specific paths (schema, filter, bulk, update-many,
 * delete-many) are declared before the `:id` catch-all.
 */
import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { entityService } from '../../services/entity.service';
import { sendSuccess, sendError } from '../../utils/response';

export const entityRoutes = Router();
entityRoutes.use(authMiddleware);

// List
entityRoutes.get('/:name', async (req: Request, res: Response) => {
  try {
    const { sort, limit, offset } = req.query;
    const rows = await entityService.list(
      req.params.name,
      req.user,
      sort as string | undefined,
      limit ? Number(limit) : undefined,
      offset ? Number(offset) : undefined,
    );
    return sendSuccess(res, 200, rows);
  } catch (e) {
    return sendError(res, e);
  }
});

// Public schema (no RLS internals)
entityRoutes.get('/:name/schema', async (req: Request, res: Response) => {
  try {
    return sendSuccess(res, 200, entityService.schema(req.params.name));
  } catch (e) {
    return sendError(res, e);
  }
});

// Filter (Mongo-style query in body)
entityRoutes.post('/:name/filter', async (req: Request, res: Response) => {
  try {
    const { query, sort, limit } = req.body || {};
    const rows = await entityService.filter(req.params.name, req.user, query, sort, limit);
    return sendSuccess(res, 200, rows);
  } catch (e) {
    return sendError(res, e);
  }
});

// Bulk create
entityRoutes.post('/:name/bulk', async (req: Request, res: Response) => {
  try {
    const items = req.body?.items || [];
    return sendSuccess(res, 201, await entityService.bulkCreate(req.params.name, req.user, items));
  } catch (e) {
    return sendError(res, e);
  }
});

// Bulk update (per-record different changes)
entityRoutes.patch('/:name/bulk', async (req: Request, res: Response) => {
  try {
    const items = req.body?.items || [];
    return sendSuccess(res, 200, await entityService.bulkUpdate(req.params.name, req.user, items));
  } catch (e) {
    return sendError(res, e);
  }
});

// Update many (same change to all matches)
entityRoutes.patch('/:name/update-many', async (req: Request, res: Response) => {
  try {
    const { query, update } = req.body || {};
    return sendSuccess(res, 200, await entityService.updateMany(req.params.name, req.user, query || {}, update || {}));
  } catch (e) {
    return sendError(res, e);
  }
});

// Delete many (POST body to avoid DELETE-with-body proxy issues)
entityRoutes.post('/:name/delete-many', async (req: Request, res: Response) => {
  try {
    const { query } = req.body || {};
    return sendSuccess(res, 200, await entityService.deleteMany(req.params.name, req.user, query || {}));
  } catch (e) {
    return sendError(res, e);
  }
});

// Single-record operations (after specific routes)
entityRoutes.get('/:name/:id', async (req: Request, res: Response) => {
  try {
    return sendSuccess(res, 200, await entityService.get(req.params.name, req.user, req.params.id));
  } catch (e) {
    return sendError(res, e);
  }
});

entityRoutes.post('/:name', async (req: Request, res: Response) => {
  try {
    return sendSuccess(res, 201, await entityService.create(req.params.name, req.user, req.body));
  } catch (e) {
    return sendError(res, e);
  }
});

entityRoutes.patch('/:name/:id', async (req: Request, res: Response) => {
  try {
    return sendSuccess(res, 200, await entityService.update(req.params.name, req.user, req.params.id, req.body));
  } catch (e) {
    return sendError(res, e);
  }
});

entityRoutes.delete('/:name/:id', async (req: Request, res: Response) => {
  try {
    await entityService.delete(req.params.name, req.user, req.params.id);
    return sendSuccess(res, 200, { success: true });
  } catch (e) {
    return sendError(res, e);
  }
});