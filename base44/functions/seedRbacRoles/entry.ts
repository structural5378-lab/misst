import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { DEFAULT_ROLES, invalidateRbacCache } from '../../shared/rbac.ts';

/**
 * seedRbacRoles — idempotently upserts the centralized DEFAULT_ROLES catalog
 * into the Role table so every spec-defined role (Owner, Administrator, Net
 * Control, Moderator, Member, Guest, …) exists and is editable. Safe to run
 * repeatedly: existing roles are updated in place, new roles are created.
 * Parent-role links are resolved in a second pass (parents are seeded first
 * by priority). Requires roles.manage / Owner / platform admin.
 */
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let can = user.role === 'admin';
    if (!can) {
      try {
        const r: any = await base44.functions.invoke('resolveRbac', {});
        can = !!r?.data?.is_admin || (r?.data?.permissions || []).includes('roles.manage') || (r?.data?.permissions || []).includes('*');
      } catch { /* fall back to admin flag */ }
    }
    if (!can) return Response.json({ error: 'Forbidden: roles.manage required' }, { status: 403 });

    const sr = base44.asServiceRole;
    const existing = await sr.entities.Role.list('-priority', 500);
    const bySlug: Record<string, any> = {};
    for (const r of existing || []) bySlug[r.slug] = r;

    let created = 0, updated = 0;

    // Pass 1: create/update every role (without parent links).
    for (const def of DEFAULT_ROLES) {
      const payload: any = {
        name: def.name,
        slug: def.slug,
        description: def.description,
        icon: def.icon,
        color: def.color,
        priority: def.priority,
        is_system: def.is_system,
        parent_role_id: null,
        permissions: JSON.stringify(def.permissions),
        denied_permissions: JSON.stringify(def.denied_permissions),
        badge_config: JSON.stringify(def.badge_config),
      };
      if (bySlug[def.slug]) {
        await sr.entities.Role.update(bySlug[def.slug].id, payload);
        updated++;
      } else {
        const r = await sr.entities.Role.create({ ...payload, member_count: 0 });
        bySlug[def.slug] = r;
        created++;
      }
    }

    // Pass 2: wire parent_role_id now that all roles exist.
    for (const def of DEFAULT_ROLES) {
      if (def.parent_slug && bySlug[def.parent_slug] && bySlug[def.slug]) {
        await sr.entities.Role.update(bySlug[def.slug].id, { parent_role_id: bySlug[def.parent_slug].id });
      }
    }

    invalidateRbacCache();
    return Response.json({ success: true, created, updated, total: DEFAULT_ROLES.length });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
}