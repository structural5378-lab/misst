// Shared community-scoped auth + audit helpers for backend functions.
// Plain module — no Deno.serve. Imported by functions that gate on community
// moderator/admin roles. Eliminates duplicated membership-resolution and
// audit-logging blocks across the moderation + RBAC functions.

const ADMIN_ROLES = ['community_owner', 'community_admin'];
const MOD_ROLES = ['community_owner', 'community_admin', 'moderator'];

// Resolve the caller's community membership + platform-admin status.
// requireAdmin=true → only community_owner/community_admin (or platform admin)
// pass; requireAdmin=false → moderators also pass.
export async function resolveCommunityAuth(base44: any, user: any, community_id: string, { requireAdmin = true } = {}) {
  const mine = await base44.asServiceRole.entities.CommunityMember.filter({ user_id: user.id, community_id, is_active: true });
  const membership = (mine && mine[0]) || null;
  const isPlatformAdmin = user.role === 'admin';
  let platformMod = false;
  try {
    const pr = await base44.asServiceRole.entities.PlatformRole.filter({ user_id: user.id, is_active: true });
    platformMod = (pr || []).some((r: any) => r.role === 'platform_owner' || r.role === 'platform_admin');
  } catch {}
  const roles = requireAdmin ? ADMIN_ROLES : MOD_ROLES;
  const allowed = membership && roles.includes(membership.role);
  return {
    membership,
    isPlatformAdmin,
    platformMod,
    isOwner: !!(membership && membership.role === 'community_owner'),
    ok: !!(allowed || isPlatformAdmin || platformMod),
  };
}

// Write a community audit-log entry (best-effort, never blocks the operation).
export async function logCommunityAudit(base44: any, entry: any) {
  try {
    await base44.asServiceRole.entities.CommunityAuditLog.create({
      community_id: entry.community_id,
      community_name: entry.community_name || '',
      admin_id: entry.admin_id || '',
      admin_name: entry.admin_name || '',
      action: entry.action,
      action_category: entry.action_category || 'moderation',
      target_user_id: entry.target_user_id || '',
      target_user_name: entry.target_user_name || '',
      target_message_id: entry.target_message_id || '',
      room_id: entry.room_id || '',
      room_name: entry.room_name || '',
      reason: entry.reason || '',
      duration: entry.duration || '',
      previous_state: entry.previous_state || '',
      new_state: entry.new_state || '',
    });
  } catch (e) {
    console.error('[communityAuth][audit]', e.message);
  }
}