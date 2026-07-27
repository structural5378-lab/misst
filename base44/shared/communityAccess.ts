// communityAccess.ts — shared community-membership enforcement for backend
// functions. Single source of truth for "is the caller allowed to touch this
// community's data?"
//
// resolveCommunityAccess returns the caller's membership row (or null) plus
// derived flags. Callers are responsible for returning HTTP 403 when neither
// isMember nor isPlatformAdmin is true.

export const COMMUNITY_ADMIN_ROLES = ['community_owner', 'community_admin'];

// Roles permitted to manage community nets (create / start / end / etc.).
export const NET_CONTROL_ROLES = ['community_owner', 'community_admin', 'net_control'];

export async function resolveCommunityAccess(base44, user, communityId) {
  const isPlatformAdmin = user?.role === 'admin';
  if (!communityId) {
    return { membership: null, isPlatformAdmin, isMember: false, isCommunityAdmin: false, missing: true };
  }
  const mine = await base44.asServiceRole.entities.CommunityMember
    .filter({ user_id: user.id, community_id: communityId, is_active: true })
    .catch(() => []);
  const membership = (mine && mine[0]) || null;
  const isMember = !!membership && membership.status === 'active';
  const isCommunityAdmin = !!membership && COMMUNITY_ADMIN_ROLES.includes(membership.role);
  return { membership, isPlatformAdmin, isMember, isCommunityAdmin, missing: false };
}

// Convenience: returns true if the caller may manage nets in the community.
export function canManageNets(access) {
  if (!access) return false;
  if (access.isPlatformAdmin) return true;
  if (!access.isMember) return false;
  return NET_CONTROL_ROLES.includes(access.membership?.role);
}