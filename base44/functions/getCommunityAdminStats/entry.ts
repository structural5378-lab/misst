import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// getCommunityAdminStats — overview metrics for the Community Admin dashboard.
//
// SECURITY: Membership-validated. Only the community owner/admin (or a platform
// admin) may call this. Every query below is scoped to community_id — no
// cross-community data is ever returned. Community admins get ONLY their own
// community's metrics; global platform stats live in a separate, platform-
// admin-only function (getPlatformStats).

const ADMIN_ROLES = ['community_owner', 'community_admin'];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const community_id = String(body.community_id || '').trim();
    if (!community_id) return Response.json({ error: 'community_id required' }, { status: 400 });

    const community = await base44.asServiceRole.entities.Community.get(community_id).catch(() => null);
    if (!community) return Response.json({ error: 'Community not found' }, { status: 404 });

    // Authorization: community admin/owner or platform admin.
    const mine = await base44.asServiceRole.entities.CommunityMember.filter({
      user_id: user.id,
      community_id,
      is_active: true,
    });
    const membership = (mine && mine[0]) || null;
    const isPlatformAdmin = user.role === 'admin';
    const isCommunityAdmin = !!membership && ADMIN_ROLES.includes(membership.role);
    if (!isPlatformAdmin && !isCommunityAdmin) {
      return Response.json({ error: 'Access denied: community admin role required' }, { status: 403 });
    }

    // Member counts (all scoped to this community).
    const all = await base44.asServiceRole.entities.CommunityMember.filter({ community_id }, '-joined_date', 1000);
    const members = all || [];
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 3600 * 1000;
    const monthAgo = now - 30 * 24 * 3600 * 1000;

    const counts = {
      total: members.length,
      active: members.filter((m) => m.status === 'active').length,
      pending: members.filter((m) => m.status === 'pending').length,
      suspended: members.filter((m) => m.status === 'suspended').length,
      banned: members.filter((m) => m.status === 'banned').length,
      admins: members.filter((m) => ADMIN_ROLES.includes(m.role)).length,
      moderators: members.filter((m) => m.role === 'moderator').length,
      net_control: members.filter((m) => m.role === 'net_control').length,
      joined_this_week: members.filter((m) => m.joined_date && new Date(m.joined_date).getTime() >= weekAgo).length,
      joined_this_month: members.filter((m) => m.joined_date && new Date(m.joined_date).getTime() >= monthAgo).length,
    };

    // Active nets (scoped to community).
    let active_nets = [];
    try {
      active_nets = await base44.asServiceRole.entities.Net.filter({ community_id, status: 'active' }, '-created_date', 10);
    } catch (e) {
      console.error('[getCommunityAdminStats] nets:', e.message);
    }

    // Upcoming events (scoped to community).
    let upcoming_events = [];
    try {
      const ev = await base44.asServiceRole.entities.Event.filter({ community_id }, '-event_time', 50);
      upcoming_events = (ev || [])
        .filter((e) => e.status === 'upcoming' && e.event_time && new Date(e.event_time).getTime() >= now)
        .slice(0, 5);
    } catch (e) {
      console.error('[getCommunityAdminStats] events:', e.message);
    }

    // Recent community admin activity (scoped to community).
    let recent_activity = [];
    try {
      recent_activity = await base44.asServiceRole.entities.CommunityAuditLog.filter({ community_id }, '-created_date', 20);
    } catch (e) {
      console.error('[getCommunityAdminStats] audit:', e.message);
    }

    return Response.json({
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
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});