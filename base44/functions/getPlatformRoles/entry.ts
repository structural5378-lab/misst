import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { resolveCallerPerms } from '../../shared/rbac.ts';

/**
 * getPlatformRoles — backward-compat shim. Delegates to the unified RBAC engine
 * so existing admin gating (PlatformAdminRoute, useAdminAccess) reads from the
 * single source of truth while keeping its original response shape.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { perms, slugs, legacy } = await resolveCallerPerms(base44, user);

    return Response.json({
      user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
      platform_roles: legacy,
      platform_role_details: slugs,
      rbac_roles: slugs,
      rbac_permissions: perms
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});