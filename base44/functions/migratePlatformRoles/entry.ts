import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { requirePermission, logRbacAudit, invalidateRbacCache } from '../../shared/rbac.ts';

/**
 * migratePlatformRoles — migrates all legacy PlatformRole records into the
 * unified RBAC UserRole model. Preserves roles, moderation rights, admin
 * privileges, and developer access. Generates a report of migrated / skipped /
 * conflicting records for administrator review. Requires roles.manage.
 *
 * Mapping:
 *   platform_owner   → owner
 *   platform_admin   → administrator
 *   platform_support → senior_moderator
 */
const LEGACY_TO_RBAC = {
  platform_owner: 'owner',
  platform_admin: 'administrator',
  platform_support: 'senior_moderator'
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { ok } = await requirePermission(base44, user, 'roles.manage', 'migratePlatformRoles');
    if (!ok) return Response.json({ error: 'Forbidden: roles.manage required' }, { status: 403 });

    const [platRoles, roles, existingUserRoles] = await Promise.all([
      base44.asServiceRole.entities.PlatformRole.list('-created_date', 1000),
      base44.asServiceRole.entities.Role.list('-priority', 500),
      base44.asServiceRole.entities.UserRole.list('-assigned_at', 2000)
    ]);

    const roleBySlug = {};
    for (const r of roles || []) roleBySlug[r.slug] = r;
    const hasUserRole = new Set((existingUserRoles || []).map((ur) => `${ur.user_id}:${ur.role_id}`));

    const report = { migrated: [], skipped: [], conflicts: [] };

    for (const pr of platRoles || []) {
      if (!pr.is_active) {
        report.skipped.push({ platform_role_id: pr.id, user_id: pr.user_id, role: pr.role, reason: 'inactive' });
        continue;
      }
      const slug = LEGACY_TO_RBAC[pr.role];
      if (!slug) {
        report.conflicts.push({ platform_role_id: pr.id, user_id: pr.user_id, role: pr.role, reason: 'unmapped legacy role' });
        continue;
      }
      const role = roleBySlug[slug];
      if (!role) {
        report.conflicts.push({ platform_role_id: pr.id, user_id: pr.user_id, role: pr.role, reason: `RBAC role "${slug}" not found` });
        continue;
      }
      const key = `${pr.user_id}:${role.id}`;
      if (hasUserRole.has(key)) {
        report.skipped.push({ platform_role_id: pr.id, user_id: pr.user_id, role: pr.role, reason: 'already has RBAC role' });
        continue;
      }
      try {
        await base44.asServiceRole.entities.UserRole.create({
          user_id: pr.user_id,
          user_email: pr.user_email || '',
          role_id: role.id,
          role_name: role.name,
          role_slug: role.slug,
          assigned_by: user.id,
          assigned_by_email: user.email || '',
          assigned_at: new Date().toISOString(),
          is_active: true
        });
        hasUserRole.add(key);
        report.migrated.push({ platform_role_id: pr.id, user_id: pr.user_id, user_email: pr.user_email, legacy_role: pr.role, mapped_to: slug });
      } catch (e) {
        report.conflicts.push({ platform_role_id: pr.id, user_id: pr.user_id, role: pr.role, reason: e.message });
      }
    }

    await logRbacAudit(base44, {
      admin_id: user.id,
      admin_email: user.email || '',
      action: 'role_migration',
      new_value: JSON.stringify({
        migrated: report.migrated.length,
        skipped: report.skipped.length,
        conflicts: report.conflicts.length
      }),
      reason: 'PlatformRole → UserRole migration'
    });
    invalidateRbacCache();

    return Response.json({
      success: true,
      summary: {
        total_legacy: (platRoles || []).length,
        migrated: report.migrated.length,
        skipped: report.skipped.length,
        conflicts: report.conflicts.length
      },
      report
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});