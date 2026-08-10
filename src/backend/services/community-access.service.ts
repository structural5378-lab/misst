/**
 * Community Access Service — Server-side community-membership enforcement.
 *
 * Ports the behavior of base44/shared/communityAccess.ts to the Core
 * PostgreSQL community_member table. Single source of truth for "is the caller
 * allowed to touch this community's data?"
 *
 * Callers are responsible for returning HTTP 403 when neither isMember nor
 * isPlatformAdmin is true. This module never throws on access denial — it
 * returns the resolved access object and lets the caller decide.
 */
import { getPool } from '../db';
import type { AuthUser } from '../entities/authorization';

export const COMMUNITY_ADMIN_ROLES = ['community_owner', 'community_admin'] as const;

// Roles permitted to manage community nets (create / start / end / etc.).
export const NET_CONTROL_ROLES = ['community_owner', 'community_admin', 'net_control'] as const;

export interface CommunityAccess {
  membership: CommunityMembershipRow | null;
  isPlatformAdmin: boolean;
  isMember: boolean;
  isCommunityAdmin: boolean;
  canManageNets: boolean;
  missing: boolean;
}

interface CommunityMembershipRow {
  id: string;
  user_id: string;
  community_id: string;
  role: string;
  status: string;
  is_active: boolean;
  muted: boolean;
  muted_until: string | null;
}

/**
 * Resolve the caller's membership + derived flags for a community.
 * Returns { membership, isPlatformAdmin, isMember, isCommunityAdmin,
 * canManageNets, missing }.
 */
export async function resolveCommunityAccess(
  user: AuthUser,
  communityId: string,
): Promise<CommunityAccess> {
  const isPlatformAdmin = user?.role === 'admin';

  if (!communityId) {
    return {
      membership: null,
      isPlatformAdmin,
      isMember: false,
      isCommunityAdmin: false,
      canManageNets: false,
      missing: true,
    };
  }

  const pool = getPool();
  const res = await pool.query<CommunityMembershipRow>(
    `SELECT id, user_id, community_id, role, status, is_active, muted, muted_until
     FROM community_member
     WHERE user_id = $1 AND community_id = $2 AND is_active = true
     LIMIT 1`,
    [user.id, communityId],
  );
  const membership = res.rows[0] || null;

  const isMember = !!membership && membership.status === 'active';
  const isCommunityAdmin =
    !!membership && (COMMUNITY_ADMIN_ROLES as readonly string[]).includes(membership.role);
  const canManageNets =
    isPlatformAdmin ||
    (!!membership &&
      (NET_CONTROL_ROLES as readonly string[]).includes(membership.role) &&
      isMember);

  return {
    membership,
    isPlatformAdmin,
    isMember,
    isCommunityAdmin,
    canManageNets,
    missing: false,
  };
}

export const communityAccessService = {
  resolveCommunityAccess,
  COMMUNITY_ADMIN_ROLES,
  NET_CONTROL_ROLES,
};

export default communityAccessService;