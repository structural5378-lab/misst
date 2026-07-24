import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Community Creation & Onboarding Function
 *
 * Creates a complete community with all default sections:
 *   - Community entity (metadata, branding, visibility)
 *   - CommunitySettings (default feature toggles, nav config, dashboard widgets)
 *   - CommunityMember record (creator as community_owner)
 *   - CommunityRole record (community_owner role assignment)
 *
 * Default sections generated: Home, Chat, Forum, Members, Events, Repeaters,
 * Gallery, Files, Admin (all toggleable via CommunitySettings.features_enabled).
 *
 * Architecture note: This function contains portable business logic that maps
 * directly to a PostgreSQL + Node.js implementation. The entity operations
 * here (create community, create settings, create member, create role) are
 * standard CRUD operations on four related tables. No Base44-specific
 * business logic — only auth context (base44.auth.me()) which maps to a
 * standard JWT user context in a self-hosted deployment.
 *
 * @param {Request} req - HTTP request with JSON body:
 *   { name, slug, category, description, logo_url, banner_url,
 *     visibility_mode ('public'|'private'|'invite'),
 *     timezone, location, primary_color, accent_color }
 * @returns {Response} JSON with { success, community: { id, name, slug } }
 */
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
      category,
      description,
      logo_url,
      banner_url,
      visibility_mode = 'private',
      timezone = 'America/New_York',
      location,
      primary_color = '#8B5CF6',
      accent_color = '#06B6D4'
    } = body;

    // --- Validation ---
    if (!name || !slug) {
      return Response.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    const slugRegex = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/;
    if (!slugRegex.test(slug)) {
      return Response.json({
        error: 'Slug must be 2-40 chars, lowercase letters, numbers, and hyphens only'
      }, { status: 400 });
    }

    // --- Slug uniqueness check ---
    const existing = await base44.asServiceRole.entities.Community.filter({ slug });
    if (existing && existing.length > 0) {
      return Response.json({ error: 'A community with this slug already exists' }, { status: 409 });
    }

    // --- Map visibility mode to entity fields ---
    // "public"    → visible in directory, anyone can join (open)
    // "private"   → hidden from directory, join by request (request)
    // "invite"    → hidden from directory, join by invite only (invite)
    let visibility = 'private';
    let join_mode = 'invite';
    let is_listed = false;

    if (visibility_mode === 'public') {
      visibility = 'public';
      join_mode = 'open';
      is_listed = true;
    } else if (visibility_mode === 'private') {
      visibility = 'private';
      join_mode = 'request';
      is_listed = false;
    } else if (visibility_mode === 'invite') {
      visibility = 'private';
      join_mode = 'invite';
      is_listed = false;
    }

    // --- Create the Community record ---
    const community = await base44.asServiceRole.entities.Community.create({
      name,
      slug,
      category: category || 'other',
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
      primary_color,
      accent_color,
      plan: 'free',
      max_members: 1000,
      is_listed,
      is_active: true,
      member_count: 1
    });

    // --- Generate default CommunitySettings ---
    // All sections enabled by default. Admins can toggle via Community Admin panel.
    const defaultFeatures = {
      home: true,
      chat: true,
      forum: true,
      members: true,
      events: true,
      repeaters: true,
      gallery: true,
      files: true,
      admin: true,
      nets: true,
      weather: true,
      maps: true,
      marketplace: true
    };

    // Dashboard widget order for community home page
    const defaultWidgets = [
      { widget: 'banner', order: 1, visible: true },
      { widget: 'alerts', order: 2, visible: true },
      { widget: 'events', order: 3, visible: true },
      { widget: 'online_members', order: 4, visible: true },
      { widget: 'quick_access', order: 5, visible: true }
    ];

    // Community-scoped navigation — all paths relative to /c/:slug/
    // This is portable: in a self-hosted deployment, these become
    // /community/:slug/home, /community/:slug/chat, etc.
    const defaultNav = [
      { icon: 'Home',          label: 'Home',      path: `/c/${slug}`,           order: 1, roles: ['all'] },
      { icon: 'MessageCircle', label: 'Chat',      path: `/c/${slug}/chat`,      order: 2, roles: ['all'] },
      { icon: 'Users',         label: 'Members',   path: `/c/${slug}/members`,   order: 3, roles: ['all'] },
      { icon: 'Menu',          label: 'More',      path: `/c/${slug}/more`,       order: 4, roles: ['all'] }
    ];

    // Extended nav (shown in "More" page) — all generated sections
    const extendedNav = [
      { icon: 'MessageSquare', label: 'Forum',     path: `/c/${slug}/forum`,     roles: ['all'] },
      { icon: 'Calendar',      label: 'Events',     path: `/c/${slug}/events`,    roles: ['all'] },
      { icon: 'Radio',         label: 'Repeaters', path: `/c/${slug}/repeaters`, roles: ['all'] },
      { icon: 'Image',          label: 'Gallery',   path: `/c/${slug}/gallery`,   roles: ['all'] },
      { icon: 'Folder',        label: 'Files',     path: `/c/${slug}/files`,     roles: ['all'] },
      { icon: 'Shield',        label: 'Admin',     path: `/c/${slug}/admin`,     roles: ['community_owner', 'community_admin'] }
    ];

    // Generate a default invite code so the owner can onboard members instantly.
    const inviteCode = `${slug}-${Math.random().toString(36).slice(2, 8)}`;

    await base44.asServiceRole.entities.CommunitySettings.create({
      community_id: community.id,
      features_enabled: JSON.stringify(defaultFeatures),
      dashboard_widgets: JSON.stringify(defaultWidgets),
      nav_config: JSON.stringify({ primary: defaultNav, extended: extendedNav }),
      join_mode,
      auto_approve: visibility_mode === 'public',
      invite_code: inviteCode,
      invite_max_uses: 0,
      invite_uses: 0,
      marketplace_public: false,
      forum_type: 'none',
      email_enabled: true
    });

    // --- Create owner membership ---
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

    // --- Create owner community role ---
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
        owner_id: community.owner_id,
        invite_code: inviteCode
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});