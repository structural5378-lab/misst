import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// listCommunityMembers — community-scoped, membership-validated member roster.
//
// Enforces STRICT community isolation (security boundary):
//   1. Requires community_id.
//   2. Verifies the caller is an ACTIVE member of that community, OR a
//      platform admin. Otherwise returns 403 Access Denied — no member
//      data ever leaves the community boundary.
//   3. Reads ONLY CommunityMember rows for that community (NEVER the global
//      User table), so users from other communities can never appear here.
//   4. Returns role-scoped counts for the current community only
//      (total / admins / moderators).
//
// Modes:
//   default    — active members only (+ counts: total, admins, moderators).
//                Available to any active member.
//   admin_view — returns ALL members (all statuses) + counts by status
//                (pending, active, rejected, banned, total, admins, moderators).
//                Caller must be a community owner/admin or platform admin.
//
// Optional `query` performs a case-insensitive substring search over the
// member's denormalized name/email/callsign — scoped to THIS community only.

const ADMIN_ROLES = ['community_owner', 'community_admin'];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const community_id = String(body.community_id || '').trim();
    const query = String(body.query || '').toLowerCase().trim();
    const adminView = !!body.admin_view;

    if (!community_id) {
      return Response.json({ error: 'community_id is required' }, { status: 400 });
    }

    // Resolve the caller's membership in THIS community (service role).
    const mine = await base44.asServiceRole.entities.CommunityMember.filter({
      user_id: user.id,
      community_id,
      is_active: true,
    });
    const myMembership = (mine && mine[0]) || null;
    const isPlatformAdmin = user.role === 'admin';
    const isCommunityAdmin = !!myMembership && ADMIN_ROLES.includes(myMembership.role);
    const isMember = !!myMembership && myMembership.status === 'active';

    // Strict boundary: must be an active member to see ANY member data.
    if (!isMember && !isPlatformAdmin) {
      return Response.json(
        { error: 'Access Denied: you are not a member of this community' },
        { status: 403 }
      );
    }

    // admin_view requires community admin/owner or platform admin.
    if (adminView && !isCommunityAdmin && !isPlatformAdmin) {
      return Response.json(
        { error: 'Access Denied: community admin role required' },
        { status: 403 }
      );
    }

    // Fetch members of THIS community only (service role; scoped by community_id).
    const filter = adminView
      ? { community_id }
      : { community_id, is_active: true, status: 'active' };
    const all = await base44.asServiceRole.entities.CommunityMember.filter(
      filter,
      '-joined_date',
      1000
    );

    let rows = all || [];
    if (!adminView) {
      // Belt-and-suspenders: never surface non-active rows to regular members.
      rows = rows.filter((m) => m.status === 'active');
    }

    if (query) {
      rows = rows.filter((m) => {
        const haystack = [m.user_name, m.user_email, m.user_callsign, m.join_reason]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(query);
      });
    }

    const members = rows.map((m) => ({
      id: m.id,
      user_id: m.user_id,
      user_name: m.user_name || 'Member',
      user_email: m.user_email || '',
      user_avatar: m.user_avatar || null,
      user_callsign: m.user_callsign || '',
      community_id: m.community_id,
      role: m.role || 'member',
      status: m.status || 'active',
      joined_date: m.joined_date || null,
      join_reason: m.join_reason || '',
    }));

    const counts = adminView
      ? {
          total: members.length,
          active: members.filter((m) => m.status === 'active').length,
          pending: members.filter((m) => m.status === 'pending').length,
          rejected: members.filter((m) => m.status === 'rejected').length,
          banned: members.filter((m) => m.status === 'banned').length,
          admins: members.filter((m) => ADMIN_ROLES.includes(m.role)).length,
          moderators: members.filter((m) => m.role === 'moderator').length,
        }
      : {
          total: members.length,
          admins: members.filter((m) => ADMIN_ROLES.includes(m.role)).length,
          moderators: members.filter((m) => m.role === 'moderator').length,
        };

    return Response.json({ members, counts });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});