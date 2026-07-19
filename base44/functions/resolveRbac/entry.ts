import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { resolveUserPermissions, mapToLegacyPlatformRoles, legacyFallback, ownerFallback, getCached, setCached } from '../../shared/rbac.ts';

/**
 * resolveRbac — the centralized RBAC resolver. Returns the current user's
 * active roles, effective permissions (union across multiple roles with
 * inheritance + overrides), and a legacy platform-role mapping for backward
 * compatibility. Results are cached per isolate with a short TTL.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const cached = getCached(user.id);
    if (cached) return Response.json(cached);

    const [userRoles, roles] = await Promise.all([
      base44.asServiceRole.entities.UserRole.filter({ user_id: user.id }),
      base44.asServiceRole.entities.Role.list('-priority', 500)
    ]);
    const rolesById = {};
    for (const r of roles || []) rolesById[r.id] = r;

    const active = (userRoles || []).filter((ur) => ur.is_active !== false);
    let slugs = active.map((ur) => ur.role_slug).filter(Boolean);
    let permissions = resolveUserPermissions(active, rolesById);
    let legacy = mapToLegacyPlatformRoles(slugs, permissions);

    if (active.length === 0) {
      const plat = await base44.asServiceRole.entities.PlatformRole.filter({ user_id: user.id, is_active: true });
      const fb = legacyFallback((plat || []).map((p) => p.role));
      if (fb) { slugs = fb.slugs; permissions = fb.permissions; legacy = fb.legacy; }
      else if (user.role === 'admin') { const o = ownerFallback(); slugs = o.slugs; permissions = o.permissions; legacy = o.legacy; }
    }

    const result = {
      user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
      roles: slugs,
      role_details: active.map((ur) => ({ role_id: ur.role_id, role_name: ur.role_name, role_slug: ur.role_slug })),
      permissions,
      effective_permissions: permissions,
      is_admin: permissions.includes('admin.access') || legacy.includes('platform_owner') || legacy.includes('platform_admin'),
      legacy_platform_roles: legacy
    };
    setCached(user.id, result);
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});