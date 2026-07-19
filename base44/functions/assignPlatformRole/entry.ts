import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { requirePermission, logRbacAudit, invalidateRbacCache } from '../../shared/rbac.ts';

// Assigns a platform role to a user and mirrors it into the unified RBAC model
// (UserRole) so MIST remains the single source of truth. Requires roles.manage.
const ROLE_TO_RBAC = {
  platform_owner: 'owner',
  platform_admin: 'administrator',
  platform_support: 'senior_moderator'
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { ok } = await requirePermission(base44, user, 'roles.manage', 'assignPlatformRole');
    if (!ok) return Response.json({ error: 'Forbidden: roles.manage required' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { action, role_id, target_user_id, target_user_email, role } = body;

    if (action === 'revoke') {
      if (!role_id) return Response.json({ error: 'role_id is required' }, { status: 400 });
      const revoked = await base44.asServiceRole.entities.PlatformRole.update(role_id, { is_active: false });
      invalidateRbacCache();
      return Response.json({ success: true, role: revoked });
    }

    if (!target_user_id || !role) {
      return Response.json({ error: 'target_user_id and role are required' }, { status: 400 });
    }

    const validRoles = ['platform_owner', 'platform_admin', 'platform_support'];
    if (!validRoles.includes(role)) {
      return Response.json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` }, { status: 400 });
    }

    // Legacy PlatformRole record (kept for backward compat during migration)
    const existing = await base44.asServiceRole.entities.PlatformRole.filter({
      user_id: target_user_id,
      role: role,
      is_active: true
    });
    if (existing && existing.length > 0) {
      return Response.json({ error: 'User already has this role', existing: existing[0] }, { status: 409 });
    }
    const newRole = await base44.asServiceRole.entities.PlatformRole.create({
      user_id: target_user_id,
      user_email: target_user_email || '',
      role: role,
      assigned_by: user.id,
      assigned_by_email: user.email,
      is_active: true
    });

    // Mirror into RBAC UserRole (single source of truth going forward)
    const rbacSlug = ROLE_TO_RBAC[role];
    if (rbacSlug) {
      const roles = await base44.asServiceRole.entities.Role.filter({ slug: rbacSlug });
      const r = roles && roles[0];
      if (r) {
        await base44.asServiceRole.entities.UserRole.deleteMany({ user_id: target_user_id, role_id: r.id });
        await base44.asServiceRole.entities.UserRole.create({
          user_id: target_user_id, user_email: target_user_email || '',
          role_id: r.id, role_name: r.name, role_slug: r.slug,
          assigned_by: user.id, assigned_by_email: user.email || '',
          assigned_at: new Date().toISOString(), is_active: true
        });
        await logRbacAudit(base44, {
          admin_id: user.id, admin_email: user.email || '', action: 'user_assign',
          target_user_id, target_user_email, role_id: r.id, role_name: r.name,
          new_value: JSON.stringify({ mirrored_from: role }), reason: 'assignPlatformRole mirror'
        });
        invalidateRbacCache();
      }
    }

    return Response.json({ success: true, role: newRole });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});