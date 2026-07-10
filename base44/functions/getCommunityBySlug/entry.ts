import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Fetches a community by its slug. Public communities are visible to all authenticated users.
// Private communities require membership.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { slug } = body;

    if (!slug) {
      return Response.json({ error: 'slug is required' }, { status: 400 });
    }

    const communities = await base44.asServiceRole.entities.Community.filter({ slug });
    const community = (communities && communities[0]) || null;

    if (!community) {
      return Response.json({ error: 'Community not found' }, { status: 404 });
    }

    if (community.status !== 'active') {
      // Only platform admins can view non-active communities
      const platformRoles = await base44.asServiceRole.entities.PlatformRole.filter({
        user_id: user.id,
        is_active: true
      });
      const isPlatformAdmin = (platformRoles || []).some(r =>
        r.role === 'platform_owner' || r.role === 'platform_admin'
      );
      if (!isPlatformAdmin) {
        return Response.json({ error: 'Community is not available' }, { status: 403 });
      }
    }

    // Check membership for private communities
    if (community.visibility === 'private') {
      const memberships = await base44.asServiceRole.entities.CommunityMember.filter({
        user_id: user.id,
        community_id: community.id,
        is_active: true
      });

      const platformRoles = await base44.asServiceRole.entities.PlatformRole.filter({
        user_id: user.id,
        is_active: true
      });
      const isPlatformAdmin = (platformRoles || []).some(r =>
        r.role === 'platform_owner' || r.role === 'platform_admin'
      );

      if ((!memberships || memberships.length === 0) && !isPlatformAdmin) {
        return Response.json({ error: 'This community is private' }, { status: 403 });
      }
    }

    // Fetch settings
    const settingsList = await base44.asServiceRole.entities.CommunitySettings.filter({
      community_id: community.id
    });
    const settings = (settingsList && settingsList[0]) || null;

    return Response.json({
      community: {
        id: community.id,
        name: community.name,
        slug: community.slug,
        callsign: community.callsign,
        description: community.description,
        logo_url: community.logo_url,
        banner_url: community.banner_url,
        owner_id: community.owner_id,
        owner_name: community.owner_name,
        visibility: community.visibility,
        status: community.status,
        timezone: community.timezone,
        location: community.location,
        location_lat: community.location_lat,
        location_lon: community.location_lon,
        primary_color: community.primary_color,
        accent_color: community.accent_color,
        plan: community.plan,
        max_members: community.max_members,
        member_count: community.member_count,
        created_date: community.created_date
      },
      settings: settings ? {
        features_enabled: settings.features_enabled,
        dashboard_widgets: settings.dashboard_widgets,
        nav_config: settings.nav_config,
        join_mode: settings.join_mode,
        forum_type: settings.forum_type
      } : null
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});