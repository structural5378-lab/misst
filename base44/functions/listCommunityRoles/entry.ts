import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { DEFAULT_COMMUNITY_ROLES, PERMISSION_CATALOG, ROLE_TEMPLATES, safeParseArr } from '../../shared/communityRbac.ts';
import { resolveCommunityAuth } from '../../shared/communityAuth.ts';

// listCommunityRoles — returns a community's role catalog (seeding the six
// protected default roles on first access), the full permission catalog, and
// templates for the Role Editor. When target_user_id is supplied, also returns
// that member's current role assignments for the Member Role Manager.
// Community-scoped: requires community admin/owner or platform admin.

const ADMIN_ROLES = ['community_owner', 'community_admin'];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const community_id = String(body.community_id || '');
    if (!community_id) return Response.json({ error: 'community_id is required' }, { status: 400 });

    const { ok } = await resolveCommunityAuth(base44, user, community_id, { requireAdmin: true });
    if (!ok) {
      return Response.json({ error: 'Access denied: community admin role required' }, { status: 403 });
    }

    // Seed the six protected default roles if none exist yet.
    let roles = await base44.asServiceRole.entities.CommunityRoleDefinition.filter({ community_id }, 'position', 200).catch(() => []);
    if (!roles || roles.length === 0) {
      const community = await base44.asServiceRole.entities.Community.get(community_id).catch(() => null);
      const created = await base44.asServiceRole.entities.CommunityRoleDefinition.bulkCreate(
        DEFAULT_COMMUNITY_ROLES.map((r) => ({
          community_id,
          slug: r.slug, name: r.name, description: r.description || '',
          color: r.color, icon: r.icon, position: r.position,
          permissions: JSON.stringify(r.permissions),
          is_system: true, is_protected: !!r.is_protected,
          mentionable: !!r.mentionable, hoisted: !!r.hoisted, is_active: true,
          member_count: 0, created_by: user.id, created_by_name: user.full_name || user.email,
        }))
      ).catch(() => null);
      roles = created || [];
      if (created && community?.owner_id) {
        // Assign the Owner role to the community owner.
        const ownerMember = await base44.asServiceRole.entities.CommunityMember.filter({ user_id: community.owner_id, community_id }).catch(() => []);
        if (ownerMember && ownerMember[0]) {
          const ownerRole = (created || []).find((r: any) => r.slug === 'owner');
          if (ownerRole) {
            await base44.asServiceRole.entities.CommunityMemberRole.create({
              community_id, user_id: community.owner_id, user_name: ownerMember[0].user_name || '',
              role_id: ownerRole.id, role_slug: 'owner', role_name: ownerRole.name, role_color: ownerRole.color, role_icon: ownerRole.icon,
              role_position: ownerRole.position, is_primary: true, assigned_by: user.id, assigned_by_email: user.email, assigned_at: new Date().toISOString(),
            }).catch(() => {});
          }
        }
      }
    }

    // Member counts per role.
    const counts: Record<string, number> = {};
    if (roles && roles.length) {
      const assignments = await base44.asServiceRole.entities.CommunityMemberRole.filter({ community_id }, '-role_position', 500).catch(() => []);
      (assignments || []).forEach((a: any) => { if (a.role_id) counts[a.role_id] = (counts[a.role_id] || 0) + 1; });
    }

    const rolesOut = (roles || []).map((r: any) => ({
      id: r.id, slug: r.slug, name: r.name, description: r.description || '',
      color: r.color, icon: r.icon, position: r.position,
      permissions: safeParseArr(r.permissions),
      is_system: !!r.is_system, is_protected: !!r.is_protected,
      mentionable: !!r.mentionable, hoisted: !!r.hoisted, is_active: r.is_active !== false,
      member_count: counts[r.id] || 0,
    }));

    let assignments: any[] = [];
    if (body.target_user_id) {
      const a = await base44.asServiceRole.entities.CommunityMemberRole.filter({ community_id, user_id: body.target_user_id }, 'role_position', 50).catch(() => []);
      assignments = (a || []).map((x: any) => ({
        id: x.id, role_id: x.role_id, role_slug: x.role_slug, role_name: x.role_name,
        role_color: x.role_color, role_icon: x.role_icon, role_position: x.role_position, is_primary: !!x.is_primary,
      }));
    }

    return Response.json({ roles: rolesOut, catalog: PERMISSION_CATALOG, templates: ROLE_TEMPLATES, assignments });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});