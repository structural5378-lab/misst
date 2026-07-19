import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { resolveCallerPerms, getCached, setCached } from '../../shared/rbac.ts';

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

    const { perms, slugs, legacy, assignments } = await resolveCallerPerms(base44, user);
    const result = {
      user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
      roles: slugs,
      role_details: (assignments || []).map((ur) => ({ role_id: ur.role_id, role_name: ur.role_name, role_slug: ur.role_slug })),
      permissions: perms,
      effective_permissions: perms,
      is_admin: perms.includes('admin.access') || legacy.includes('platform_owner') || legacy.includes('platform_admin'),
      legacy_platform_roles: legacy
    };
    setCached(user.id, result);
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});