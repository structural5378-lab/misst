import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Full community creation: creates Community + CommunitySettings + CommunityMember (owner) + CommunityRole (owner).
// The calling user becomes the community_owner.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.is_platform_suspended) {
      return Response.json({ error: 'Account suspended' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const {
      name,
      slug,
      callsign,
      description,
      logo_url,
      banner_url,
      visibility = 'private',
      timezone = 'America/New_York',
      location,
      location_lat,
      location_lon,
      primary_color = '#8B5CF6',
      accent_color = '#06B6D4'
    } = body;

    if (!name || !slug) {
      return Response.json({ error: 'name and slug are required' }, { status: 400 });
    }

    // Validate slug format
    const slugRegex = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/;
    if (!slugRegex.test(slug)) {
      return Response.json({
        error: 'Slug must be 2-40 chars, lowercase letters, numbers, and hyphens only'
      }, { status: 400 });
    }

    // Check slug uniqueness
    const existing = await base44.asServiceRole.entities.Community.filter({ slug });
    if (existing && existing.length > 0) {
      return Response.json({ error: 'A community with this slug already exists' }, { status: 409 });
    }

    // Create the community
    const community = await base44.asServiceRole.entities.Community.create({
      name,
      slug,
      callsign: callsign || '',
      description: description || '',
      logo_url: logo_url || '',
      banner_url: banner_url || '',
      owner_id: user.id,
      owner_name: user.full_name || user.email,
      founder_uid: user.id,
      founder_name: user.full_name || user.email,
      visibility,
      status: 'active',
      timezone,
      location: location || '',
      location_lat: location_lat || null,
      location_lon: location_lon || null,
      primary_color,
      accent_color,
      plan: 'free',
      max_members: 1000,
      is_listed: false,
      is_active: true,
      member_count: 1
    });

    // Create default community settings
    const defaultFeatures = {
      chat: true,
      forum: true,
      weather: true,
      repeaters: true,
      maps: true,
      gallery: true,
      cams: true,
      events: true,
      shopping: true,
      ai: true,
      files: true,
      nets: true
    };

    const defaultWidgets = [
      { widget: 'alerts', order: 1, visible: true },
      { widget: 'events', order: 2, visible: true },
      { widget: 'online_members', order: 3, visible: true },
      { widget: 'weather', order: 4, visible: true }
    ];

    const defaultNav = [
      { icon: 'Home', label: 'Home', path: '/', order: 1, roles: ['all'] },
      { icon: 'MessageSquare', label: 'Forum', path: '/community-forum', order: 2, roles: ['all'] },
      { icon: 'MessageCircle', label: 'Chat', path: '/live-chat', order: 3, roles: ['all'] },
      { icon: 'Mail', label: 'Messages', path: '/messages', order: 4, roles: ['all'] }
    ];

    await base44.asServiceRole.entities.CommunitySettings.create({
      community_id: community.id,
      features_enabled: JSON.stringify(defaultFeatures),
      dashboard_widgets: JSON.stringify(defaultWidgets),
      nav_config: JSON.stringify(defaultNav),
      join_mode: 'invite',
      marketplace_public: false,
      forum_type: 'none',
      email_enabled: true
    });

    // Create owner membership
    await base44.asServiceRole.entities.CommunityMember.create({
      user_id: user.id,
      user_name: user.full_name || user.email,
      user_email: user.email,
      user_callsign: user.callsign || '',
      user_avatar: user.avatar_url || '',
      community_id: community.id,
      community_name: community.name,
      community_slug: community.slug,
      role: 'community_owner',
      status: 'active',
      joined_date: new Date().toISOString(),
      is_active: true
    });

    // Create owner community role
    await base44.asServiceRole.entities.CommunityRole.create({
      user_id: user.id,
      user_email: user.email,
      community_id: community.id,
      community_name: community.name,
      role: 'community_owner',
      assigned_by: user.id,
      assigned_by_email: user.email,
      is_active: true
    });

    return Response.json({
      success: true,
      community: {
        id: community.id,
        name: community.name,
        slug: community.slug,
        owner_id: community.owner_id
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});