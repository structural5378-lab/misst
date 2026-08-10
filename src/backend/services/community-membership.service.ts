/**
 * Community Membership Service — Core implementation of the membership
 * lifecycle, member roster, staff directory, and admin stats.
 *
 * Migrates four Base44 backend functions to MISST Core:
 *   - manageCommunityMembership  → manageMembership
 *   - listCommunityMembers        → listMembers
 *   - listCommunityStaff          → listStaff
 *   - getCommunityAdminStats      → getAdminStats
 *
 * Security (Phase 2C.1 foundation):
 *   - Actor identity is ALWAYS the authenticated JWT user (req.user). No
 *     community_id / user_id / role / actor field from the request body is
 *     ever trusted for authorization.
 *   - Community-scoped access is resolved server-side via
 *     community-access.service (community_member table).
 *   - Platform-admin override is resolved via rbac.service.resolveCallerPerms
 *     (user_role + role tables) — never from a client-supplied role field.
 *   - Privileged DB writes go through the backend-only serviceContext (the
 *     Core equivalent of base44.asServiceRole), bypassing user RLS.
 *   - Every administrative membership change writes a community audit record
 *     via audit.service.logCommunityAudit (actor derived from the JWT).
 *
 * Behavior note: Base44 email side-effects on join-request/approve are NOT
 * reproduced here — the notification/email subsystem is explicitly out of scope
 * for this phase. The membership state transitions and audit records are
 * preserved, which is the observable contract the facade depends on.
 */
import serviceContext from './service-context';
import { communityAccessService } from './community-access.service';
import { auditService } from './audit.service';
import { resolveCallerPerms } from './rbac.service';
import { AppError } from '../utils/errors';
import type { AuthUser } from '../entities/authorization';

const ADMIN_ROLES = ['community_owner', 'community_admin'];
const STAFF_ROLES = ['community_owner', 'community_admin', 'moderator', 'net_control', 'trusted_member'];
const MOD_ROLES = ['community_owner', 'community_admin', 'moderator'];
const RANK: Record<string, number> = {
  guest: 0, member: 1, trusted_member: 2, net_control: 3, moderator: 4, community_admin: 5, community_owner: 6,
};
const VALID_SET_ROLES = ['community_admin', 'net_control', 'moderator', 'trusted_member', 'member', 'guest'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Platform-admin override, resolved through the RBAC foundation. */
async function isPlatformAdmin(user: AuthUser): Promise<boolean> {
  const { legacy } = await resolveCallerPerms(user);
  return legacy.includes('platform_owner') || legacy.includes('platform_admin');
}

/** Fetch a user's identity fields from the auth `users` table (for denormalized member fields). */
async function fetchUserPublic(userId: string): Promise<{ full_name?: string; email?: string; callsign?: string; avatar_url?: string }> {
  const pool = serviceContext.pool();
  const res = await pool.query(
    'SELECT id, email, full_name, callsign, avatar_url FROM users WHERE id::text = $1 LIMIT 1',
    [String(userId)],
  );
  return res.rows[0] || {};
}

/** Enrich community-scoped member rows with live profile fields from the `user` entity table. */
async function enrichMembers(members: any[]): Promise<any[]> {
  const userIds = [...new Set(members.map((m) => m.user_id).filter(Boolean))];
  if (!userIds.length) return members.map((m) => buildMember(m, {}));
  const pool = serviceContext.pool();
  const res = await pool.query(
    `SELECT id, display_name, username, mybb_username, callsign, avatar_url,
            license_status, last_active, bio, is_verified, location
       FROM "user" WHERE id::text = ANY($1::text[])`,
    [userIds],
  );
  const userById = new Map(res.rows.map((u: any) => [String(u.id), u]));
  return members.map((m) => buildMember(m, userById.get(String(m.user_id)) || {}));
}

/** Build the enriched member object the roster endpoints return. */
function buildMember(m: any, u: any): any {
  return {
    id: m.id,
    user_id: m.user_id,
    user_name: m.user_name || u.display_name || 'Member',
    display_name: u.display_name || m.user_name || 'Member',
    username: u.username || u.mybb_username || '',
    user_email: m.user_email || '',
    user_avatar: m.user_avatar || u.avatar_url || null,
    avatar_url: m.user_avatar || u.avatar_url || null,
    user_callsign: m.user_callsign || u.callsign || '',
    callsign: m.user_callsign || u.callsign || '',
    license_status: u.license_status || (u.callsign ? 'LICENSED' : 'UNLICENSED'),
    community_id: m.community_id,
    role: m.role || 'member',
    status: m.status || 'active',
    joined_date: m.joined_date || null,
    last_active: u.last_active || null,
    muted: !!m.muted,
    muted_until: m.muted_until || null,
    location: u.location || '',
    bio: u.bio || '',
    is_verified: !!u.is_verified,
  };
}

/** Resolve a community row or 404. */
async function getCommunity(communityId: string): Promise<any> {
  const community = await serviceContext.entities('Community').get(communityId).catch(() => null);
  if (!community) throw new AppError('COMMUNITY_NOT_FOUND', 'Community not found', 404);
  return community;
}

/** Resolve join_mode + invite settings for a community. */
async function getJoinSettings(communityId: string, community: any): Promise<{ settings: any; joinMode: string }> {
  const settingsList = await serviceContext.entities('CommunitySettings').filter({ community_id: communityId }).catch(() => []);
  const settings = (settingsList && settingsList[0]) || null;
  const joinMode = settings?.join_mode
    || (community.visibility === 'public' ? 'open' : community.visibility === 'private' ? 'request' : 'invite');
  return { settings, joinMode };
}

/** Validate an invite code against stored settings. */
function isInviteValid(inviteCode: string | undefined, settings: any): boolean {
  if (!inviteCode || !settings?.invite_code) return false;
  if (settings.invite_code !== inviteCode) return false;
  if (settings.invite_expires && new Date(settings.invite_expires) < new Date()) return false;
  if (settings.invite_max_uses > 0 && (settings.invite_uses || 0) >= settings.invite_max_uses) return false;
  return true;
}

// ─── manageMembership ────────────────────────────────────────────────────────
export interface ManageMembershipArgs {
  action: string;
  target_user_id?: string;
  reason?: string;
  invite_code?: string;
  role?: string;
  context?: string;
  mute_duration_hours?: number;
}

export async function manageMembership(user: AuthUser, communityId: string, args: ManageMembershipArgs): Promise<any> {
  const { action, target_user_id, reason, invite_code, role, context, mute_duration_hours } = args;
  if (!action) throw new AppError('VALIDATION_ERROR', 'action is required', 400);

  const community = await getCommunity(communityId);
  const { settings, joinMode } = await getJoinSettings(communityId, community);
  const inviteValid = isInviteValid(invite_code, settings);

  // Caller's own membership row in this community (privileged read).
  const existing = await serviceContext.entities('CommunityMember').filter({ user_id: user.id, community_id: communityId });
  const member = (existing && existing[0]) || null;

  const profile = await fetchUserPublic(user.id);
  const membershipPayload = (status: string) => ({
    user_id: user.id,
    user_name: profile.full_name || user.email,
    user_email: user.email,
    user_callsign: profile.callsign || '',
    user_avatar: profile.avatar_url || '',
    community_id: communityId,
    community_name: community.name,
    role: 'member',
    status,
    joined_date: new Date().toISOString(),
    is_active: status === 'active' || status === 'pending',
  });

  const grantActiveMembership = async () => {
    if (member) {
      await serviceContext.entities('CommunityMember').update(member.id, {
        status: 'active', is_active: true, role: 'member',
        joined_date: new Date().toISOString(),
      });
    } else {
      await serviceContext.entities('CommunityMember').create(membershipPayload('active'));
    }
    await serviceContext.entities('CommunityRole').create({
      user_id: user.id, user_email: user.email, community_id: communityId, community_name: community.name,
      role: 'member', assigned_by: user.id, assigned_by_email: user.email, is_active: true,
    }).catch(() => {});
    await serviceContext.entities('Community').update(community.id, {
      member_count: (community.member_count || 0) + 1,
    });
  };

  const consumeInvite = async () => {
    if (inviteValid && settings?.id) {
      await serviceContext.entities('CommunitySettings').update(settings.id, {
        invite_uses: (settings.invite_uses || 0) + 1,
      }).catch(() => {});
    }
  };

  const logAudit = (auditAction: string, targetId: string | undefined, targetName: string | undefined, reasonText?: string, extra: any = {}) => {
    return auditService.logCommunityAudit({
      actor: user,
      actor_name: profile.full_name || user.email,
      community_id: communityId,
      community_name: community.name,
      action: auditAction,
      action_category: extra.action_category || '',
      target_user_id: targetId || '',
      target_user_name: targetName || '',
      reason: reasonText || '',
      duration: extra.duration || '',
      previous_state: extra.previous_state || '',
      new_state: extra.new_state || '',
    });
  };

  // --- join ---
  if (action === 'join') {
    const isClosed = joinMode === 'closed';
    const instantAllowed = joinMode === 'open' || community.visibility === 'public' || inviteValid;
    if (member && member.is_active && member.status === 'active') {
      return { success: true, status: 'active', already_member: true };
    }
    if (isClosed && !inviteValid) {
      throw new AppError('CLOSED', 'This community is closed to new members', 403);
    }
    if (!instantAllowed) {
      throw new AppError('APPROVAL_REQUIRED', 'This community requires approval or an invitation to join', 403);
    }
    if (member && member.status === 'banned') {
      throw new AppError('BANNED', 'You are banned from this community', 403);
    }
    await grantActiveMembership();
    await consumeInvite();
    return { success: true, status: 'active' };
  }

  // --- request ---
  if (action === 'request') {
    if (joinMode === 'invite' && !inviteValid) {
      throw new AppError('INVITE_ONLY', 'This community is invite-only', 403);
    }
    if (member && member.is_active && (member.status === 'active' || member.status === 'pending')) {
      throw new AppError('CONFLICT', 'You already have a membership or pending request', 409);
    }
    if (inviteValid) {
      await grantActiveMembership();
      await consumeInvite();
      return { success: true, status: 'active' };
    }
    if (settings?.auto_approve) {
      await grantActiveMembership();
      return { success: true, status: 'active' };
    }
    if (member) {
      await serviceContext.entities('CommunityMember').update(member.id, {
        status: 'pending', is_active: true, role: 'member',
      });
    } else {
      await serviceContext.entities('CommunityMember').create(membershipPayload('pending'));
    }
    return { success: true, status: 'pending' };
  }

  // --- leave ---
  if (action === 'leave') {
    if (!member) throw new AppError('NOT_FOUND', 'Not a member', 404);
    await serviceContext.entities('CommunityMember').update(member.id, { status: 'left', is_active: false });
    try {
      const roles = await serviceContext.entities('CommunityRole').filter({ user_id: user.id, community_id: communityId });
      await Promise.all((roles || []).map((r: any) => serviceContext.entities('CommunityRole').update(r.id, { is_active: false })));
    } catch { /* mirror best-effort */ }
    if (member.status === 'active') {
      await serviceContext.entities('Community').update(community.id, {
        member_count: Math.max(0, (community.member_count || 1) - 1),
      });
    }
    return { success: true };
  }

  // --- admin actions: approve / reject / ban ---
  if (action === 'approve' || action === 'reject' || action === 'ban') {
    if (!target_user_id) throw new AppError('VALIDATION_ERROR', 'target_user_id is required', 400);

    const access = await communityAccessService.resolveCommunityAccess(user, communityId);
    const platAdmin = await isPlatformAdmin(user);
    if (!access.isCommunityAdmin && !platAdmin) {
      throw new AppError('FORBIDDEN', 'Not authorized', 403);
    }

    const targetMembers = await serviceContext.entities('CommunityMember').filter({ user_id: target_user_id, community_id: communityId });
    const target = (targetMembers && targetMembers[0]) || null;
    if (!target) throw new AppError('NOT_FOUND', 'Membership request not found', 404);

    const wasActive = target.status === 'active';

    if (action === 'approve') {
      await serviceContext.entities('CommunityMember').update(target.id, {
        status: 'active', is_active: true, role: 'member',
        assigned_by: user.id, assigned_by_email: user.email,
      });
      const targetProfile = await fetchUserPublic(target_user_id);
      await serviceContext.entities('CommunityRole').create({
        user_id: target_user_id,
        user_email: targetProfile.email || target.user_email || '',
        community_id: communityId, community_name: community.name,
        role: 'member', assigned_by: user.id, assigned_by_email: user.email, is_active: true,
      }).catch(() => {});
      if (!wasActive) {
        await serviceContext.entities('Community').update(community.id, {
          member_count: (community.member_count || 0) + 1,
        });
      }
    } else if (action === 'reject') {
      await serviceContext.entities('CommunityMember').update(target.id, { status: 'rejected', is_active: false });
      if (wasActive) {
        await serviceContext.entities('Community').update(community.id, {
          member_count: Math.max(0, (community.member_count || 1) - 1),
        });
      }
    } else if (action === 'ban') {
      await serviceContext.entities('CommunityMember').update(target.id, { status: 'banned', is_active: false });
      try {
        const roles = await serviceContext.entities('CommunityRole').filter({ user_id: target_user_id, community_id: communityId });
        await Promise.all((roles || []).map((r: any) => serviceContext.entities('CommunityRole').update(r.id, { is_active: false })));
      } catch { /* mirror best-effort */ }
      if (wasActive) {
        await serviceContext.entities('Community').update(community.id, {
          member_count: Math.max(0, (community.member_count || 1) - 1),
        });
      }
    }
    await logAudit(action, target_user_id, target.user_name, reason, { action_category: 'membership' });
    return { success: true };
  }

  // --- set_role ---
  if (action === 'set_role') {
    const newRole = String(role || '').trim();
    if (!target_user_id || !newRole) throw new AppError('VALIDATION_ERROR', 'target_user_id and role are required', 400);
    if (!VALID_SET_ROLES.includes(newRole)) throw new AppError('VALIDATION_ERROR', 'Invalid role', 400);

    const access = await communityAccessService.resolveCommunityAccess(user, communityId);
    const platAdmin = await isPlatformAdmin(user);
    if (!access.isCommunityAdmin && !platAdmin) {
      throw new AppError('FORBIDDEN', 'Not authorized', 403);
    }

    const targetMembers = await serviceContext.entities('CommunityMember').filter({ user_id: target_user_id, community_id: communityId });
    const target = (targetMembers && targetMembers[0]) || null;
    if (!target) throw new AppError('NOT_FOUND', 'Membership not found', 404);

    if (target.role === 'community_owner') {
      throw new AppError('FORBIDDEN', 'Cannot modify the community owner role', 403);
    }
    const isCallerOwner = access.membership?.role === 'community_owner';
    if (newRole === 'community_admin' && !isCallerOwner && !platAdmin) {
      throw new AppError('FORBIDDEN', 'Only the community owner can assign the admin role', 403);
    }

    await serviceContext.entities('CommunityMember').update(target.id, { role: newRole });
    try {
      const roles = await serviceContext.entities('CommunityRole').filter({ user_id: target_user_id, community_id: communityId });
      await Promise.all((roles || []).map((r: any) => serviceContext.entities('CommunityRole').update(r.id, { role: newRole, is_active: true })));
    } catch { /* mirror best-effort */ }
    await logAudit('set_role:' + newRole, target_user_id, target.user_name, reason, { action_category: 'roles' });
    return { success: true, role: newRole };
  }

  // --- moderation: suspend / unsuspend / mute / unmute / kick / unban ---
  if (['suspend', 'unsuspend', 'mute', 'unmute', 'kick', 'unban'].includes(action)) {
    if (!target_user_id) throw new AppError('VALIDATION_ERROR', 'target_user_id is required', 400);

    const access = await communityAccessService.resolveCommunityAccess(user, communityId);
    const platAdmin = await isPlatformAdmin(user);
    const isMod = access.membership && MOD_ROLES.includes(access.membership.role);
    if (!isMod && !platAdmin) {
      throw new AppError('FORBIDDEN', 'Not authorized', 403);
    }

    const targetMembers = await serviceContext.entities('CommunityMember').filter({ user_id: target_user_id, community_id: communityId });
    const target = (targetMembers && targetMembers[0]) || null;
    if (!target) throw new AppError('NOT_FOUND', 'Membership not found', 404);

    const targetRank = RANK[target.role] ?? 1;
    const callerRank = RANK[access.membership?.role ?? ''] ?? 0;
    if (target.role === 'community_owner' || (targetRank >= callerRank && !platAdmin)) {
      throw new AppError('FORBIDDEN', 'Cannot moderate a member with equal or higher role', 403);
    }

    const auditAction = context === 'voice' ? `voice_${action}` : action;
    const prevStatus = target.status;
    const prevMuted = !!target.muted;
    let newState: string = prevStatus;
    let duration = '';

    if (action === 'suspend') {
      newState = 'suspended';
      await serviceContext.entities('CommunityMember').update(target.id, { status: 'suspended', is_active: false });
    } else if (action === 'unsuspend') {
      newState = 'active';
      await serviceContext.entities('CommunityMember').update(target.id, { status: 'active', is_active: true });
    } else if (action === 'mute') {
      const hours = mute_duration_hours ? Number(mute_duration_hours) : 0;
      const mutedUntil = hours > 0 ? new Date(Date.now() + hours * 3600 * 1000).toISOString() : '';
      newState = hours > 0 ? `muted ${hours}h` : 'muted';
      duration = hours > 0 ? `${hours}h` : 'permanent';
      await serviceContext.entities('CommunityMember').update(target.id, { muted: true, muted_until: mutedUntil });
    } else if (action === 'unmute') {
      newState = 'unmuted';
      await serviceContext.entities('CommunityMember').update(target.id, { muted: false, muted_until: '' });
    } else if (action === 'kick') {
      newState = 'left';
      const wasActive = target.status === 'active';
      await serviceContext.entities('CommunityMember').update(target.id, { status: 'left', is_active: false });
      try {
        const roles = await serviceContext.entities('CommunityRole').filter({ user_id: target_user_id, community_id: communityId });
        await Promise.all((roles || []).map((r: any) => serviceContext.entities('CommunityRole').update(r.id, { is_active: false })));
      } catch { /* mirror best-effort */ }
      if (wasActive) {
        await serviceContext.entities('Community').update(community.id, {
          member_count: Math.max(0, (community.member_count || 1) - 1),
        });
      }
    } else if (action === 'unban') {
      newState = 'left';
      await serviceContext.entities('CommunityMember').update(target.id, { status: 'left', is_active: false });
    }

    await logAudit(auditAction, target_user_id, target.user_name, reason, {
      action_category: 'moderation',
      duration,
      previous_state: `${prevStatus}${prevMuted ? ' (muted)' : ''}`,
      new_state: newState,
    });
    return { success: true, action: auditAction };
  }

  throw new AppError('VALIDATION_ERROR', 'Unknown action', 400);
}

// ─── listMembers ─────────────────────────────────────────────────────────────
export async function listMembers(user: AuthUser, communityId: string, query: string, adminView: boolean): Promise<any> {
  if (!communityId) throw new AppError('VALIDATION_ERROR', 'A community_id is required to list members', 400);

  const access = await communityAccessService.resolveCommunityAccess(user, communityId);
  const platAdmin = await isPlatformAdmin(user);

  // Strict boundary: must be an active member to see ANY member data.
  if (!access.isMember && !platAdmin) {
    throw new AppError('FORBIDDEN', 'Access Denied: you are not a member of this community', 403);
  }
  // admin_view requires community admin/owner or platform admin.
  if (adminView && !access.isCommunityAdmin && !platAdmin) {
    throw new AppError('FORBIDDEN', 'Access Denied: community admin role required', 403);
  }

  const filter = adminView
    ? { community_id: communityId }
    : { community_id: communityId, is_active: true, status: 'active' };
  let rows = await serviceContext.entities('CommunityMember').filter(filter, '-joined_date', 1000);
  if (!adminView) rows = rows.filter((m: any) => m.status === 'active');

  const enriched = await enrichMembers(rows);
  const q = (query || '').toLowerCase().trim();
  let members = enriched;
  if (q) {
    members = enriched.filter((m) => {
      const haystack = [m.display_name, m.username, m.user_name, m.user_callsign, m.user_email]
        .filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }

  const counts = adminView
    ? {
        total: enriched.length,
        active: enriched.filter((m) => m.status === 'active').length,
        pending: enriched.filter((m) => m.status === 'pending').length,
        rejected: enriched.filter((m) => m.status === 'rejected').length,
        banned: enriched.filter((m) => m.status === 'banned').length,
        admins: enriched.filter((m) => ADMIN_ROLES.includes(m.role)).length,
        moderators: enriched.filter((m) => m.role === 'moderator').length,
      }
    : {
        total: enriched.length,
        admins: enriched.filter((m) => ADMIN_ROLES.includes(m.role)).length,
        moderators: enriched.filter((m) => m.role === 'moderator').length,
      };

  return { members, counts };
}

// ─── listStaff ────────────────────────────────────────────────────────────────
export async function listStaff(user: AuthUser, communityId: string): Promise<any> {
  if (!communityId) throw new AppError('VALIDATION_ERROR', 'community_id required', 400);

  const access = await communityAccessService.resolveCommunityAccess(user, communityId);
  const platAdmin = await isPlatformAdmin(user);
  if (!access.membership && !platAdmin) {
    throw new AppError('FORBIDDEN', 'Access denied: not a member', 403);
  }

  const all = await serviceContext.entities('CommunityMember').filter(
    { community_id: communityId, is_active: true, status: 'active' }, '-joined_date', 1000,
  );
  const staff = (all || []).filter((m: any) => STAFF_ROLES.includes(m.role));
  const enriched = await enrichMembers(staff);
  const slim = enriched.map((s) => ({
    user_id: s.user_id,
    role: s.role,
    user_name: s.user_name,
    user_avatar: s.user_avatar,
    user_callsign: s.user_callsign,
    bio: s.bio,
    last_active: s.last_active,
    joined_date: s.joined_date,
  }));

  const grouped = {
    community_owner: slim.filter((s) => s.role === 'community_owner'),
    community_admin: slim.filter((s) => s.role === 'community_admin'),
    moderator: slim.filter((s) => s.role === 'moderator'),
    net_control: slim.filter((s) => s.role === 'net_control'),
    trusted_member: slim.filter((s) => s.role === 'trusted_member'),
  };

  return { grouped, total: slim.length };
}

// ─── getAdminStats ────────────────────────────────────────────────────────────
export async function getAdminStats(user: AuthUser, communityId: string): Promise<any> {
  if (!communityId) throw new AppError('VALIDATION_ERROR', 'community_id required', 400);

  const community = await getCommunity(communityId);

  const access = await communityAccessService.resolveCommunityAccess(user, communityId);
  const platAdmin = await isPlatformAdmin(user);
  if (!platAdmin && !access.isCommunityAdmin) {
    throw new AppError('FORBIDDEN', 'Access denied: community admin role required', 403);
  }

  const members = await serviceContext.entities('CommunityMember').filter({ community_id: communityId }, '-joined_date', 1000);
  const now = Date.now();
  const weekAgo = now - 7 * 24 * 3600 * 1000;
  const monthAgo = now - 30 * 24 * 3600 * 1000;

  const counts = {
    total: members.length,
    active: members.filter((m: any) => m.status === 'active').length,
    pending: members.filter((m: any) => m.status === 'pending').length,
    suspended: members.filter((m: any) => m.status === 'suspended').length,
    banned: members.filter((m: any) => m.status === 'banned').length,
    admins: members.filter((m: any) => ADMIN_ROLES.includes(m.role)).length,
    moderators: members.filter((m: any) => m.role === 'moderator').length,
    net_control: members.filter((m: any) => m.role === 'net_control').length,
    joined_this_week: members.filter((m: any) => m.joined_date && new Date(m.joined_date).getTime() >= weekAgo).length,
    joined_this_month: members.filter((m: any) => m.joined_date && new Date(m.joined_date).getTime() >= monthAgo).length,
  };

  let active_nets: any[] = [];
  try {
    active_nets = await serviceContext.entities('Net').filter({ community_id: communityId, status: 'active' }, '-created_date', 10);
  } catch { /* nets module not required this phase */ }

  let upcoming_events: any[] = [];
  try {
    const ev = await serviceContext.entities('Event').filter({ community_id: communityId }, '-event_time', 50);
    upcoming_events = (ev || [])
      .filter((e: any) => e.status === 'upcoming' && e.event_time && new Date(e.event_time).getTime() >= now)
      .slice(0, 5);
  } catch { /* events module not required this phase */ }

  let recent_activity: any[] = [];
  try {
    recent_activity = await serviceContext.entities('CommunityAuditLog').filter({ community_id: communityId }, '-created_date', 20);
  } catch { /* audit table always present */ }

  return {
    community: {
      id: community.id,
      name: community.name,
      slug: community.slug,
      member_count: community.member_count,
      visibility: community.visibility,
      plan: community.plan,
    },
    counts,
    active_nets: active_nets || [],
    upcoming_events,
    recent_activity: recent_activity || [],
  };
}

// ─── Service export ───────────────────────────────────────────────────────────
export const communityMembershipService = {
  manageMembership,
  listMembers,
  listStaff,
  getAdminStats,
};

export default communityMembershipService;