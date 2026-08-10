/**
 * Community Membership Routes — REST endpoints for the membership module.
 *
 * All routes require JWT authentication (authMiddleware). The authenticated
 * user (req.user) is the sole source of actor identity — community_id is taken
 * from the path parameter, never trusted from the body for authorization.
 *
 * Endpoints:
 *   POST /api/communities/:communityId/membership   — manage membership lifecycle
 *   GET  /api/communities/:communityId/members       — list members (+ counts)
 *   GET  /api/communities/:communityId/staff         — staff directory (grouped)
 *   GET  /api/communities/:communityId/admin-stats    — admin overview metrics
 */
import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { communityMembershipService } from '../../services/community-membership.service';
import { sendSuccess, sendError } from '../../utils/response';

/** Express Request augmented with the authenticated user set by authMiddleware. */
interface AuthedRequest extends Request {
  user: { id: string; email: string; role: string };
}

export const communityMembershipRoutes = Router();
communityMembershipRoutes.use(authMiddleware);

// POST /api/communities/:communityId/membership
communityMembershipRoutes.post('/:communityId/membership', async (req, res) => {
  try {
    const result = await communityMembershipService.manageMembership(
      (req as unknown as AuthedRequest).user,
      String(req.params.communityId),
      req.body || {},
    );
    return sendSuccess(res, 200, result);
  } catch (e) {
    return sendError(res, e as Error);
  }
});

// GET /api/communities/:communityId/members
communityMembershipRoutes.get('/:communityId/members', async (req, res) => {
  try {
    const result = await communityMembershipService.listMembers(
      (req as unknown as AuthedRequest).user,
      String(req.params.communityId),
      (req.query.query as string) || '',
      req.query.admin_view === 'true' || req.query.admin_view === '1',
    );
    return sendSuccess(res, 200, result);
  } catch (e) {
    return sendError(res, e as Error);
  }
});

// GET /api/communities/:communityId/staff
communityMembershipRoutes.get('/:communityId/staff', async (req, res) => {
  try {
    const result = await communityMembershipService.listStaff(
      (req as unknown as AuthedRequest).user,
      String(req.params.communityId),
    );
    return sendSuccess(res, 200, result);
  } catch (e) {
    return sendError(res, e as Error);
  }
});

// GET /api/communities/:communityId/admin-stats
communityMembershipRoutes.get('/:communityId/admin-stats', async (req, res) => {
  try {
    const result = await communityMembershipService.getAdminStats(
      (req as unknown as AuthedRequest).user,
      String(req.params.communityId),
    );
    return sendSuccess(res, 200, result);
  } catch (e) {
    return sendError(res, e as Error);
  }
});