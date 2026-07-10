import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Returns the current user's platform roles and community roles.
// Used by the frontend to determine permissions and show/hide admin features.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const platformRoles = await base44.asServiceRole.entities.PlatformRole.filter({
      user_id: user.id,
      is_active: true
    });

    const communityRoles = await base44.asServiceRole.entities.CommunityRole.filter({
      user_id: user.id,
      is_active: true
    });

    const communityMemberships = await base44.asServiceRole.entities.CommunityMember.filter({
      user_id: user.id,
      is_active: true
    });

    return Response.json({
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      },
      platform_roles: (platformRoles || []).map(r => r.role),
      platform_role_details: platformRoles || [],
      community_roles: communityRoles || [],
      community_memberships: communityMemberships || []
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});