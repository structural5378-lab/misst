import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { resolveCommunityAccess } from '../../shared/communityAccess.ts';

// searchUsers — member search for starting conversations.
//
// Two modes:
//   1. Community-scoped (community_id provided): caller must be an active
//      member; results are intersected with CommunityMember(community_id,
//      active) so a user from another community can NEVER appear.
//   2. Platform-wide (no community_id): the intentional global DM directory.
//
// PII protection (both modes):
//   - email is ONLY returned to platform admins.
//   - bio / location / last_active are never returned to non-admins.
//   - Non-admin callers receive only: id, full_name, callsign, mybb_username,
//     avatar_url. These are the minimum fields needed to start a DM.
//
// Suspended / banned / deactivated accounts are always excluded.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const q = String(body.query || '').toLowerCase().trim();
    const community_id = String(body.community_id || '').trim();
    const isAdmin = user.role === 'admin';

    if (!q) return Response.json({ users: [] });

    // Community-scoped mode: enforce membership + build the allowed user-id set.
    let allowedIds = null;
    if (community_id) {
      const access = await resolveCommunityAccess(base44, user, community_id);
      if (!access.isMember && !access.isPlatformAdmin) {
        return Response.json(
          { error: 'Access Denied: you are not a member of this community' },
          { status: 403 }
        );
      }
      const members = await base44.asServiceRole.entities.CommunityMember
        .filter({ community_id, is_active: true, status: 'active' })
        .catch(() => []);
      allowedIds = new Set((members || []).map((m) => m.user_id).filter(Boolean));
      if (!allowedIds.size) return Response.json({ users: [] });
    }

    const all = await base44.asServiceRole.entities.User.list();

    let results = (all || [])
      .filter((u) => u.id !== user.id)
      .filter((u) =>
        !u.is_platform_suspended &&
        !u.is_banned &&
        u.account_status !== 'deactivated'
      )
      .filter((u) =>
        u.full_name?.toLowerCase().includes(q) ||
        u.callsign?.toLowerCase().includes(q) ||
        u.mybb_username?.toLowerCase().includes(q) ||
        u.username?.toLowerCase().includes(q) ||
        (isAdmin && u.email?.toLowerCase().includes(q))
      );

    if (allowedIds) {
      results = results.filter((u) => allowedIds.has(u.id));
    }

    const out = results.map((u) => {
      const base = {
        id: u.id,
        full_name: u.full_name,
        callsign: u.callsign,
        mybb_username: u.mybb_username,
        avatar_url: u.avatar_url,
      };
      // Admins may see email; everyone else gets only the public subset above.
      return isAdmin
        ? { ...base, email: u.email, bio: u.bio, location: u.location }
        : base;
    });

    return Response.json({ users: out });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});