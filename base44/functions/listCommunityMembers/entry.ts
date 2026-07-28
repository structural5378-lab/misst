import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// listCommunityMembers — community-scoped, membership-validated member roster.
//
// ENFORCES STRICT COMMUNITY ISOLATION (security boundary):
//   1. Requires community_id. WITHOUT ONE, the request is REJECTED and an
//      error is logged — a members query with no community scope is a bug.
//   2. Verifies the caller is an ACTIVE member of that community, OR a
//      platform admin. Otherwise returns 403 Access Denied — no member
//      data ever leaves the community boundary.
//   3. The MEMBERSHIP LIST is sourced ONLY from CommunityMember rows for
//      that community_id (status==active unless admin_view). The global
//      User table is NEVER listed; we only fetch profile fields for the
//      exact user_ids that are already verified members of this community.
//   4. Search is applied to the enriched, community-scoped set only —
//      a search can never return a user from another community.
//
// Modes:
//   default    — active members only (+ counts: total, admins, moderators).
//                Available to any active member.
//   admin_view — returns ALL members (all statuses) + counts by status
//                (pending, active, rejected, banned, total, admins, moderators).
//                Caller must be a community owner/admin or platform admin.
//
// `query` performs a case-insensitive substring search over display_name,
// username, mybb_username, callsign, email, and the denormalized member
// name — scoped to THIS community only.

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

    // Safeguard: a members query MUST be scoped to a community. Refuse and
    // log any attempt to load members without a communityId filter.
    if (!community_id) {
      console.error('[listCommunityMembers] REJECTED: missing community_id (unscooped members query blocked)');
      return Response.json(
        { error: 'A community_id is required to list members' },
        { status: 400 }
      );
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
      console.error(`[listCommunityMembers] REJECTED: user ${user.id} is not a member of community ${community_id}`);
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

    // Fetch members of THIS community only — the membership set comes from
    // CommunityMember, scoped by community_id (never a global user list).
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
      rows = rows.filter((m) => m.status === 'active');
    }

    // Enrich with profile fields for ONLY the member user_ids (scoped $in
    // read — never a global User.list). The membership set already
    // authorized which users may appear here.
    const userIds = rows.map((m) => m.user_id).filter(Boolean);
    const userById = new Map();
    const CHUNK = 500;
    for (let i = 0; i < userIds.length; i += CHUNK) {
      const slice = userIds.slice(i, i + CHUNK);
      if (!slice.length) continue;
      try {
        const users = await base44.asServiceRole.entities.User.filter({ id: { $in: slice } });
        (users || []).forEach((u) => userById.set(u.id, u));
      } catch (e) {
        console.error('[listCommunityMembers] profile enrichment failed:', e.message);
      }
    }

    // Build the enriched member objects.
    const enriched = rows.map((m) => {
      const u = userById.get(m.user_id) || {};
      return {
        id: m.id,
        user_id: m.user_id,
        user_name: m.user_name || u.display_name || u.full_name || 'Member',
        display_name: u.display_name || u.full_name || m.user_name || 'Member',
        username: u.username || u.mybb_username || '',
        user_email: m.user_email || u.email || '',
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
    });

    // Counts reflect the full community membership (not the search-filtered
    // subset) and are always scoped to THIS community.
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

    // Apply community-scoped search over the enriched fields.
    let members = enriched;
    if (query) {
      members = enriched.filter((m) => {
        const haystack = [
          m.display_name, m.username, m.user_name, m.user_callsign, m.user_email,
        ].filter(Boolean).join(' ').toLowerCase();
        return haystack.includes(query);
      });
    }

    return Response.json({ members, counts });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});