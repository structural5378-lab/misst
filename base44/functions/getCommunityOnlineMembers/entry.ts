import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// getCommunityOnlineMembers — community-scoped online presence.
//
// Returns the members of the given community who are currently online
// (UserPresence.status === 'online' INTERSECT active CommunityMember).
//
// Security / isolation:
//   1. Requires community_id (an unscooped presence query is rejected + logged).
//   2. Validates the caller is an active member of the community, OR a
//      platform admin. Otherwise 403 — no presence data leaves the boundary.
//   3. The candidate set comes from CommunityMember (this community only).
//      UserPresence is then queried with { user_id: { $in: memberIds } } —
//      it is NEVER listed globally. Users from other communities can never
//      appear here even if they are online.
//   4. Each returned member carries their community role so callers can
//      highlight community staff (owner/admin/moderator).
//
// Returns: { online: [...], total }

const STAFF_ROLES = ['community_owner', 'community_admin', 'moderator', 'net_control'];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const community_id = String(body.community_id || '').trim();

    if (!community_id) {
      console.error('[getCommunityOnlineMembers] REJECTED: missing community_id (unscooped presence query blocked)');
      return Response.json(
        { error: 'A community_id is required to list online members' },
        { status: 400 }
      );
    }

    // Validate the caller's membership in THIS community.
    const mine = await base44.asServiceRole.entities.CommunityMember.filter({
      user_id: user.id,
      community_id,
      is_active: true,
    });
    const myMembership = (mine && mine[0]) || null;
    const isMember = !!myMembership && myMembership.status === 'active';
    const isPlatformAdmin = user.role === 'admin';

    if (!isMember && !isPlatformAdmin) {
      console.error(`[getCommunityOnlineMembers] REJECTED: user ${user.id} is not a member of community ${community_id}`);
      return Response.json(
        { error: 'Access Denied: you are not a member of this community' },
        { status: 403 }
      );
    }

    // Active members of THIS community only.
    const members = await base44.asServiceRole.entities.CommunityMember.filter({
      community_id,
      is_active: true,
      status: 'active',
    }, '-joined_date', 1000);
    const memberByUid = new Map((members || []).map((m) => [m.user_id, m]));
    const memberUserIds = Array.from(memberByUid.keys()).filter(Boolean);

    if (!memberUserIds.length) return Response.json({ online: [], total: 0 });

    // Online presence for those member user_ids only (scoped $in read).
    const online = [];
    const CHUNK = 500;
    for (let i = 0; i < memberUserIds.length; i += CHUNK) {
      const slice = memberUserIds.slice(i, i + CHUNK);
      if (!slice.length) continue;
      try {
        const chunk = await base44.asServiceRole.entities.UserPresence.filter({
          user_id: { $in: slice },
          status: 'online',
        });
        (chunk || []).forEach((p) => online.push(p));
      } catch (e) {
        console.error('[getCommunityOnlineMembers] presence fetch failed:', e.message);
      }
    }

    const result = online.map((p) => {
      const m = memberByUid.get(p.user_id) || {};
      return {
        id: p.id,
        user_id: p.user_id,
        user_name: p.user_name || m.user_name || 'Member',
        user_avatar: p.user_avatar || m.user_avatar || null,
        status: p.status || 'online',
        last_active: p.last_active || null,
        role: m.role || 'member',
        is_staff: STAFF_ROLES.includes(m.role),
      };
    });

    return Response.json({ online: result, total: result.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});