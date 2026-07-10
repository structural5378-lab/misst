import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Permission constants — the single source of truth for the platform's permission framework.
// Modules reference these permission strings; this function resolves them for a given user.

const PLATFORM_PERMISSIONS = {
  platform_owner: [
    'platform:full_access',
    'platform:manage_communities',
    'platform:manage_users',
    'platform:assign_roles',
    'platform:view_audit_log',
    'platform:support',
    'platform:billing'
  ],
  platform_admin: [
    'platform:manage_communities',
    'platform:manage_users',
    'platform:view_audit_log',
    'platform:support'
  ],
  platform_support: [
    'platform:support'
  ]
};

const COMMUNITY_PERMISSIONS = {
  community_owner: [
    'community:admin',
    'community:moderate',
    'community:create_alert',
    'community:create_event',
    'community:create_net',
    'community:manage_members',
    'community:manage_settings',
    'community:delete',
    'community:transfer_ownership',
    'community:create_custom_roles',
    'community:override_permissions',
    'community:customize_branding',
    'community:invite_members',
    'community:upload_photos',
    'community:create_listings',
    'community:create_threads',
    'community:post_chat',
    'community:delete_own_message',
    'community:checkin_net',
    'community:view_content'
  ],
  community_admin: [
    'community:admin',
    'community:moderate',
    'community:create_alert',
    'community:create_event',
    'community:create_net',
    'community:manage_members',
    'community:manage_settings',
    'community:invite_members',
    'community:upload_photos',
    'community:create_listings',
    'community:create_threads',
    'community:post_chat',
    'community:delete_own_message',
    'community:checkin_net',
    'community:view_content'
  ],
  moderator: [
    'community:moderate',
    'community:create_net',
    'community:upload_photos',
    'community:create_listings',
    'community:create_threads',
    'community:post_chat',
    'community:delete_own_message',
    'community:checkin_net',
    'community:view_content'
  ],
  trusted_member: [
    'community:upload_photos',
    'community:create_listings',
    'community:create_threads',
    'community:post_chat',
    'community:delete_own_message',
    'community:checkin_net',
    'community:view_content'
  ],
  member: [
    'community:post_chat',
    'community:delete_own_message',
    'community:checkin_net',
    'community:view_content'
  ],
  guest: [
    'community:view_content'
  ]
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is platform-suspended
    if (user.is_platform_suspended) {
      return Response.json({
        error: 'Account suspended',
        user: { id: user.id, email: user.email, is_platform_suspended: true },
        platform_permissions: [],
        community_permissions: {},
        community_role: null,
        is_platform_owner: false,
        is_platform_admin: false,
        is_platform_support: false
      }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { community_id, community_slug } = body;

    // Resolve platform roles
    const platformRoles = await base44.asServiceRole.entities.PlatformRole.filter({
      user_id: user.id,
      is_active: true
    });

    const platformRoleStrings = (platformRoles || []).map(r => r.role);
    const platformPermissions = new Set();
    for (const role of platformRoleStrings) {
      const perms = PLATFORM_PERMISSIONS[role] || [];
      for (const p of perms) platformPermissions.add(p);
    }

    const result = {
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        callsign: user.callsign,
        avatar_url: user.avatar_url
      },
      platform_roles: platformRoleStrings,
      platform_permissions: Array.from(platformPermissions),
      is_platform_owner: platformRoleStrings.includes('platform_owner'),
      is_platform_admin: platformRoleStrings.includes('platform_admin'),
      is_platform_support: platformRoleStrings.includes('platform_support'),
      community_id: null,
      community_role: null,
      community_permissions: []
    };

    // Resolve community role if community_id or slug is provided
    let community = null;
    if (community_id) {
      community = await base44.asServiceRole.entities.Community.get(community_id);
    } else if (community_slug) {
      const communities = await base44.asServiceRole.entities.Community.filter({ slug: community_slug });
      community = (communities && communities[0]) || null;
    }

    if (community) {
      result.community_id = community.id;
      result.community = {
        id: community.id,
        name: community.name,
        slug: community.slug,
        logo_url: community.logo_url,
        primary_color: community.primary_color,
        visibility: community.visibility,
        status: community.status
      };

      // Find the user's membership in this community
      const memberships = await base44.asServiceRole.entities.CommunityMember.filter({
        user_id: user.id,
        community_id: community.id,
        is_active: true
      });

      const membership = (memberships && memberships[0]) || null;

      if (membership) {
        result.community_role = membership.role;
        result.community_status = membership.status;
        result.is_community_owner = membership.role === 'community_owner';
        result.is_community_admin = membership.role === 'community_admin';
        result.is_moderator = membership.role === 'moderator';
        result.is_trusted_member = membership.role === 'trusted_member';
        result.is_member = membership.role === 'member';
        result.is_guest = membership.role === 'guest';

        const communityPerms = COMMUNITY_PERMISSIONS[membership.role] || [];
        result.community_permissions = communityPerms;
      } else {
        // User is not a member — check if community is public
        result.community_role = null;
        result.is_guest = community.visibility === 'public';
        if (community.visibility === 'public') {
          result.community_permissions = COMMUNITY_PERMISSIONS['guest'] || [];
        } else {
          result.community_permissions = [];
          result.error = 'Not a member of this community';
        }
      }
    }

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});