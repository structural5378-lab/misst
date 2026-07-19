import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { resolveUserPermissions, mapToLegacyPlatformRoles, legacyFallback, ownerFallback, invalidateRbacCache } from '../../shared/rbac.ts';

/**
 * rbacManage — admin-only Role Manager. Single endpoint for all RBAC mutations.
 * Every change is written to RbacAuditLog and the per-isolate cache is invalidated.
 * Access is itself RBAC-enforced: the caller must hold the `roles.manage`
 * permission or the Owner role (never trusts the client).
 *
 * Actions: list, create_role, clone_role, update_role, delete_role,
 *          assign_user, unassign_user, bulk_assign.
 */
async function resolveCallerPerms(base44, user) {
  const userRoles = await base44.asServiceRole.entities.UserRole.filter({ user_id: user.id });
  const roles = await base44.asServiceRole.entities.Role.list('-priority', 500);
  const rolesById = {};
  for (const r of roles || []) rolesById[r.id] = r;
  const active = (userRoles || []).filter((ur) => ur.is_active !== false);
  let slugs = active.map((ur) => ur.role_slug).filter(Boolean);
  let perms = resolveUserPermissions(active, rolesById);
  let legacy = mapToLegacyPlatformRoles(slugs, perms);
  if (active.length === 0) {
    const plat = await base44.asServiceRole.entities.PlatformRole.filter({ user_id: user.id, is_active: true });
    const fb = legacyFallback((plat || []).map((p) => p.role));
    if (fb) { perms = fb.permissions; slugs = fb.slugs; legacy = fb.legacy; }
    else if (user.role === 'admin') { const o = ownerFallback(); perms = o.permissions; slugs = o.slugs; legacy = o.legacy; }
  }
  return { perms, slugs, legacy };
}

async function logAudit(base44, admin, action, f) {
  try {
    await base44.asServiceRole.entities.RbacAuditLog.create({
      admin_id: admin.id,
      admin_email: admin.email || '',
      action,
      target_user_id: f.target_user_id || '',
      target_user_email: f.target_user_email || '',
      role_id: f.role_id || '',
      role_name: f.role_name || '',
      old_value: f.old_value || '',
      new_value: f.new_value || '',
      changed_permissions: f.changed_permissions || '',
      reason: f.reason || ''
    });
  } catch {
    /* audit is best-effort; never block the operation */
  }
}

function slugify(name) {
  return String(name).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'role';
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { perms, slugs, legacy } = await resolveCallerPerms(base44, user);
    const canManage = perms.includes('roles.manage') || slugs.includes('owner') || legacy.includes('platform_owner');
    if (!canManage) return Response.json({ error: 'Forbidden: roles.manage required' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const action = body.action;

    if (action === 'list') {
      const [roles, assignments, audit] = await Promise.all([
        base44.asServiceRole.entities.Role.list('-priority', 500),
        base44.asServiceRole.entities.UserRole.list('-assigned_at', 1000),
        base44.asServiceRole.entities.RbacAuditLog.list('-created_date', 100)
      ]);
      return Response.json({ success: true, roles: roles || [], assignments: assignments || [], audit: audit || [] });
    }

    if (action === 'create_role' || action === 'clone_role') {
      const { name, description, icon, color, priority, parent_role_id, permissions, denied_permissions, badge_config, reason } = body;
      if (!name) return Response.json({ error: 'name required' }, { status: 400 });
      let slug = slugify(name);
      const existing = await base44.asServiceRole.entities.Role.filter({ slug });
      if (existing && existing.length) slug = `${slug}_${Date.now().toString(36)}`;
      const role = await base44.asServiceRole.entities.Role.create({
        name, slug,
        description: description || '',
        icon: icon || 'Shield',
        color: color || '#8b5cf6',
        priority: typeof priority === 'number' ? priority : 100,
        is_system: false,
        parent_role_id: parent_role_id || null,
        permissions: JSON.stringify(permissions || []),
        denied_permissions: JSON.stringify(denied_permissions || []),
        badge_config: JSON.stringify(badge_config || {}),
        member_count: 0
      });
      await logAudit(base44, user, action, { role_id: role.id, role_name: role.name, new_value: JSON.stringify(role), reason: reason || '' });
      invalidateRbacCache();
      return Response.json({ success: true, role });
    }

    if (action === 'update_role') {
      const { role_id, patch, reason } = body;
      if (!role_id) return Response.json({ error: 'role_id required' }, { status: 400 });
      const role = await base44.asServiceRole.entities.Role.get(role_id);
      const oldSnap = JSON.stringify(role);
      const update = {};
      for (const k of ['name', 'description', 'icon', 'color', 'priority', 'parent_role_id', 'is_default']) {
        if (patch && k in patch) update[k] = patch[k];
      }
      if (patch?.permissions) update.permissions = JSON.stringify(patch.permissions);
      if (patch?.denied_permissions) update.denied_permissions = JSON.stringify(patch.denied_permissions);
      if (patch?.badge_config) update.badge_config = JSON.stringify(patch.badge_config);
      const updated = await base44.asServiceRole.entities.Role.update(role_id, update);
      const changed = Object.keys(update);
      await logAudit(base44, user, 'role_update', { role_id, role_name: role.name, old_value: oldSnap, new_value: JSON.stringify(updated), changed_permissions: JSON.stringify(changed), reason: reason || '' });
      invalidateRbacCache();
      return Response.json({ success: true, role: updated });
    }

    if (action === 'delete_role') {
      const { role_id, reason } = body;
      const role = await base44.asServiceRole.entities.Role.get(role_id);
      if (role.is_system) return Response.json({ error: 'System roles cannot be deleted' }, { status: 400 });
      await base44.asServiceRole.entities.UserRole.deleteMany({ role_id });
      await base44.asServiceRole.entities.Role.delete(role_id);
      await logAudit(base44, user, 'role_delete', { role_id, role_name: role.name, old_value: JSON.stringify(role), reason: reason || '' });
      invalidateRbacCache();
      return Response.json({ success: true });
    }

    if (action === 'assign_user') {
      const { target_user_id, target_user_email, role_id, reason } = body;
      if (!target_user_id || !role_id) return Response.json({ error: 'target_user_id and role_id required' }, { status: 400 });
      const role = await base44.asServiceRole.entities.Role.get(role_id);
      await base44.asServiceRole.entities.UserRole.deleteMany({ user_id: target_user_id, role_id });
      const ur = await base44.asServiceRole.entities.UserRole.create({
        user_id: target_user_id, user_email: target_user_email || '',
        role_id, role_name: role.name, role_slug: role.slug,
        assigned_by: user.id, assigned_by_email: user.email || '',
        assigned_at: new Date().toISOString(), is_active: true
      });
      await logAudit(base44, user, 'user_assign', { target_user_id, target_user_email, role_id, role_name: role.name, new_value: JSON.stringify(ur), reason: reason || '' });
      invalidateRbacCache();
      return Response.json({ success: true, assignment: ur });
    }

    if (action === 'unassign_user') {
      const { target_user_id, role_id, reason } = body;
      const existing = await base44.asServiceRole.entities.UserRole.filter({ user_id: target_user_id, role_id });
      await base44.asServiceRole.entities.UserRole.deleteMany({ user_id: target_user_id, role_id });
      await logAudit(base44, user, 'user_unassign', { target_user_id, role_id, old_value: JSON.stringify(existing), reason: reason || '' });
      invalidateRbacCache();
      return Response.json({ success: true });
    }

    if (action === 'bulk_assign') {
      const { target_user_ids, role_id, reason } = body;
      if (!Array.isArray(target_user_ids) || !role_id) return Response.json({ error: 'target_user_ids[] and role_id required' }, { status: 400 });
      const role = await base44.asServiceRole.entities.Role.get(role_id);
      for (const uid of target_user_ids) {
        await base44.asServiceRole.entities.UserRole.deleteMany({ user_id: uid, role_id });
      }
      const created = await base44.asServiceRole.entities.UserRole.bulkCreate(
        target_user_ids.map((uid) => ({
          user_id: uid, role_id, role_name: role.name, role_slug: role.slug,
          assigned_by: user.id, assigned_by_email: user.email || '',
          assigned_at: new Date().toISOString(), is_active: true
        }))
      );
      await logAudit(base44, user, 'user_bulk_assign', { role_id, role_name: role.name, new_value: JSON.stringify({ count: target_user_ids.length }), reason: reason || '' });
      invalidateRbacCache();
      return Response.json({ success: true, count: Array.isArray(created) ? created.length : 0 });
    }

    return Response.json({ error: 'Unknown action: ' + action }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});