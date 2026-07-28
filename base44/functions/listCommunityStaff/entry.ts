import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// listCommunityStaff — public staff directory for a community.
//
// Any ACTIVE member of the community (or a platform admin) may view the
// staff directory. Returns staff grouped by role, enriched with public
// profile fields. No cross-community data is returned — the roster is
// sourced exclusively from CommunityMember rows scoped to community_id.

const STAFF_ROLES = [
  'community_owner', 'community_admin', 'moderator', 'net_control', 'trusted_member',
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const community_id = String(body.community_id || '').trim();
    if (!community_id) return Response.json({ error: 'community_id required' }, { status: 400 });

    // Any active member may view the staff directory.
    const mine = await base44.asServiceRole.entities.CommunityMember.filter({
      user_id: user.id, community_id, is_active: true,
    });
    const membership = (mine && mine[0]) || null;
    const isPlatformAdmin = user.role === 'admin';
    if (!membership && !isPlatformAdmin) {
      return Response.json({ error: 'Access denied: not a member' }, { status: 403 });
    }

    const all = await base44.asServiceRole.entities.CommunityMember.filter(
      { community_id, is_active: true, status: 'active' }, '-joined_date', 1000
    );
    const staff = (all || []).filter((m) => STAFF_ROLES.includes(m.role));

    // Enrich with public profile fields for member user_ids only.
    const userIds = staff.map((m) => m.user_id).filter(Boolean);
    const userById = new Map();
    const CHUNK = 500;
    for (let i = 0; i < userIds.length; i += CHUNK) {
      const slice = userIds.slice(i, i + CHUNK);
      if (!slice.length) continue;
      try {
        const users = await base44.asServiceRole.entities.User.filter({ id: { $in: slice } });
        (users || []).forEach((u) => userById.set(u.id, u));
      } catch (e) {
        console.error('[listCommunityStaff] enrich:', e.message);
      }
    }

    const enriched = staff.map((m) => {
      const u = userById.get(m.user_id) || {};
      return {
        user_id: m.user_id,
        role: m.role,
        user_name: m.user_name || u.display_name || u.full_name || 'Member',
        user_avatar: m.user_avatar || u.avatar_url || null,
        user_callsign: m.user_callsign || u.callsign || '',
        bio: u.bio || '',
        last_active: u.last_active || null,
        joined_date: m.joined_date || null,
      };
    });

    const grouped = {
      community_owner: enriched.filter((s) => s.role === 'community_owner'),
      community_admin: enriched.filter((s) => s.role === 'community_admin'),
      moderator: enriched.filter((s) => s.role === 'moderator'),
      net_control: enriched.filter((s) => s.role === 'net_control'),
      trusted_member: enriched.filter((s) => s.role === 'trusted_member'),
    };

    return Response.json({ grouped, total: enriched.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});