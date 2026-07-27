import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { resolveCommunityAccess } from '../../shared/communityAccess.ts';

// getCommunityProfilePreview — membership-validated, co-member-verified
// profile preview launched from community pages.
//
// Security:
//   1. Requires community_id + user_id (target). 400 otherwise.
//   2. Caller must be an active member of the community (or platform admin),
//      otherwise 403.
//   3. The TARGET user must ALSO be an active member of the same community
//      (co-member). If not, no community activity is returned and only a
//      minimal public stub is provided — activity from other communities
//      never leaks.
//   4. The profile returned is a sanitized public-fields subset (never email,
//      bio, location, or last_active).
//   5. Recent activity is scoped to THIS community's ForumThread rows by the
//      target author only.
//
// Returns: { profile, stats, recent, co_member, role }

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const community_id = String(body.community_id || '').trim();
    const target_user_id = String(body.user_id || '').trim();
    if (!community_id || !target_user_id) {
      return Response.json({ error: 'community_id and user_id are required' }, { status: 400 });
    }

    const access = await resolveCommunityAccess(base44, user, community_id);
    if (!access.isMember && !access.isPlatformAdmin) {
      return Response.json(
        { error: 'Access Denied: you are not a member of this community' },
        { status: 403 }
      );
    }

    // Co-member check: target must also be an active member here.
    const targetRows = await base44.asServiceRole.entities.CommunityMember
      .filter({ user_id: target_user_id, community_id, is_active: true, status: 'active' })
      .catch(() => []);
    const targetMembership = (targetRows && targetRows[0]) || null;
    if (!targetMembership && !access.isPlatformAdmin) {
      // Not a co-member: minimal stub, NO community activity.
      return Response.json({ profile: null, stats: {}, recent: [], co_member: false, role: null });
    }

    // Sanitized public profile (public fields only).
    let profile = null;
    try {
      const u = await base44.asServiceRole.entities.User.get(target_user_id);
      let radios = null;
      try { radios = u.radios ? JSON.parse(u.radios) : null; } catch { radios = null; }
      profile = {
        id: u.id,
        full_name: u.full_name || u.display_name || '',
        callsign: u.callsign || '',
        avatar_url: u.avatar_url || null,
        radios,
      };
    } catch { profile = null; }

    let stats = {};
    try {
      const s = await base44.asServiceRole.entities.UserStats.filter({ user_id: target_user_id });
      if (s && s[0]) {
        stats = {
          level: s[0].level || 1,
          reputation: s[0].reputation || 0,
          forum_posts: s[0].forum_posts || 0,
          user_callsign: s[0].user_callsign || '',
        };
      }
    } catch { stats = {}; }

    // Community-scoped recent threads by this author (never cross-community).
    const recent = await base44.asServiceRole.entities.ForumThread
      .filter({ author_id: target_user_id, community_id, is_deleted: false }, '-created_date', 5)
      .catch(() => []);

    return Response.json({
      profile,
      stats,
      recent: recent || [],
      co_member: true,
      role: targetMembership?.role || 'member',
    });
  } catch (e) {
    return Response.json({ error: e?.message || String(e) }, { status: 500 });
  }
});