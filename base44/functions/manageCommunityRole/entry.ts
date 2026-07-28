import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { DEFAULT_COMMUNITY_ROLES, ALL_COMMUNITY_PERMISSIONS, safeParseArr } from '../../shared/communityRbac.ts';
import { resolveCommunityAuth } from '../../shared/communityAuth.ts';

// manageCommunityRole — CRUD for community custom roles. Actions: create,
// update, duplicate, delete, reorder, restore_defaults, import, export,
// apply_template. Owner/admin gated. Owner role permissions are locked to '*';
// Owner and Member cannot be deleted. Every change is audit-logged (category
// 'roles'). Platform Super Admins bypass community gating.

const ADMIN_ROLES = ['community_owner', 'community_admin'];

function slugify(s: string): string {
  return String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'role';
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || '');
    const community_id = String(body.community_id || '');
    if (!action || !community_id) return Response.json({ error: 'action and community_id are required' }, { status: 400 });

    const { ok } = await resolveCommunityAuth(base44, user, community_id, { requireAdmin: true });
    if (!ok) {
      return Response.json({ error: 'Access denied: community admin role required' }, { status: 403 });
    }

    const community = await base44.asServiceRole.entities.Community.get(community_id).catch(() => null);

    const logAudit = async (auditAction: string, roleName: string, extra = '') => {
      try {
        await base44.asServiceRole.entities.CommunityAuditLog.create({
          community_id, community_name: community?.name || '',
          admin_id: user.id, admin_name: user.full_name || user.email,
          action: auditAction, action_category: 'roles',
          reason: extra, new_state: roleName,
        });
      } catch (e) { console.error('[manageCommunityRole][audit]', e.message); }
    };

    const roles = await base44.asServiceRole.entities.CommunityRoleDefinition.filter({ community_id }, 'position', 200).catch(() => []);

    // --- export ---
    if (action === 'export') {
      const out = (roles || []).map((r: any) => ({
        slug: r.slug, name: r.name, description: r.description || '', color: r.color, icon: r.icon,
        permissions: safeParseArr(r.permissions), mentionable: !!r.mentionable, hoisted: !!r.hoisted,
        is_system: !!r.is_system,
      }));
      return Response.json({ roles: out });
    }

    // --- restore_defaults ---
    if (action === 'restore_defaults') {
      const existingSlugs = new Set((roles || []).map((r: any) => r.slug));
      const missing = DEFAULT_COMMUNITY_ROLES.filter((r) => !existingSlugs.has(r.slug));
      if (missing.length) {
        await base44.asServiceRole.entities.CommunityRoleDefinition.bulkCreate(
          missing.map((r) => ({
            community_id, slug: r.slug, name: r.name, description: r.description || '',
            color: r.color, icon: r.icon, position: r.position, permissions: JSON.stringify(r.permissions),
            is_system: true, is_protected: !!r.is_protected, mentionable: !!r.mentionable, hoisted: !!r.hoisted,
            is_active: true, member_count: 0, created_by: user.id, created_by_name: user.full_name || user.email,
          }))
        ).catch(() => null);
      }
      await logAudit('role_restored', 'default roles');
      return Response.json({ success: true, restored: missing.length });
    }

    // --- import ---
    if (action === 'import') {
      const incoming = Array.isArray(body.roles) ? body.roles : [];
      if (!incoming.length) return Response.json({ error: 'roles array is required' }, { status: 400 });
      const existingSlugs = new Set((roles || []).map((r: any) => r.slug));
      let maxPos = (roles || []).reduce((m: number, r: any) => Math.max(m, r.position || 0), 0);
      const toCreate: any[] = [];
      for (const r of incoming) {
        if (!r || !r.name) continue;
        let slug = slugify(r.slug || r.name);
        let i = 1;
        while (existingSlugs.has(slug)) { slug = `${slugify(r.slug || r.name)}_${i++}`; }
        existingSlugs.add(slug);
        const perms = Array.isArray(r.permissions) ? r.permissions.filter((p) => p === '*' || ALL_COMMUNITY_PERMISSIONS.includes(p)) : [];
        toCreate.push({
          community_id, slug, name: String(r.name).slice(0, 60), description: String(r.description || '').slice(0, 200),
          color: r.color || '#94a3b8', icon: r.icon || 'Shield', position: r.position != null ? Number(r.position) : ++maxPos,
          permissions: JSON.stringify(perms), is_system: false, is_protected: false,
          mentionable: !!r.mentionable, hoisted: !!r.hoisted, is_active: true, member_count: 0,
          created_by: user.id, created_by_name: user.full_name || user.email,
        });
      }
      const created = toCreate.length ? await base44.asServiceRole.entities.CommunityRoleDefinition.bulkCreate(toCreate).catch(() => null) : [];
      await logAudit('role_imported', `${toCreate.length} role(s)`);
      return Response.json({ success: true, created: (created || []).length });
    }

    // --- apply_template ---
    if (action === 'apply_template') {
      const tplRoles = Array.isArray(body.roles) ? body.roles : [];
      if (!tplRoles.length) return Response.json({ error: 'roles array is required' }, { status: 400 });
      const existingSlugs = new Set((roles || []).map((r: any) => r.slug));
      let maxPos = (roles || []).reduce((m: number, r: any) => Math.max(m, r.position || 0), 0);
      const toCreate: any[] = [];
      for (const r of tplRoles) {
        let slug = slugify(r.slug || r.name);
        let i = 1;
        while (existingSlugs.has(slug)) { slug = `${slugify(r.slug || r.name)}_${i++}`; }
        existingSlugs.add(slug);
        const perms = Array.isArray(r.permissions) ? r.permissions.filter((p) => p === '*' || ALL_COMMUNITY_PERMISSIONS.includes(p)) : [];
        toCreate.push({
          community_id, slug, name: String(r.name).slice(0, 60), description: String(r.description || '').slice(0, 200),
          color: r.color || '#94a3b8', icon: r.icon || 'Shield', position: ++maxPos,
          permissions: JSON.stringify(perms), is_system: false, is_protected: false,
          mentionable: true, hoisted: false, is_active: true, member_count: 0,
          created_by: user.id, created_by_name: user.full_name || user.email,
        });
      }
      const created = toCreate.length ? await base44.asServiceRole.entities.CommunityRoleDefinition.bulkCreate(toCreate).catch(() => null) : [];
      await logAudit('role_template_applied', `${toCreate.length} role(s)`);
      return Response.json({ success: true, created: (created || []).length });
    }

    // --- reorder ---
    if (action === 'reorder') {
      const order = Array.isArray(body.order) ? body.order : [];
      if (!order.length) return Response.json({ error: 'order array is required' }, { status: 400 });
      const byId: Record<string, any> = {};
      (roles || []).forEach((r: any) => { byId[r.id] = r; });
      const updates = order.map((id: string, idx: number) => ({ id, position: idx }))
        .filter((u) => byId[u.id]);
      if (updates.length) await base44.asServiceRole.entities.CommunityRoleDefinition.bulkUpdate(updates).catch(() => null);
      await logAudit('role_reordered', `${order.length} role(s)`);
      return Response.json({ success: true });
    }

    // --- create ---
    if (action === 'create') {
      const name = String(body.name || '').trim();
      if (!name) return Response.json({ error: 'name is required' }, { status: 400 });
      let slug = slugify(body.slug || name);
      let i = 1;
      while ((roles || []).some((r: any) => r.slug === slug)) slug = `${slugify(body.slug || name)}_${i++}`;
      const perms = Array.isArray(body.permissions) ? body.permissions.filter((p) => p === '*' || ALL_COMMUNITY_PERMISSIONS.includes(p)) : [];
      let maxPos = (roles || []).reduce((m: number, r: any) => Math.max(m, r.position || 0), 0);
      const role = await base44.asServiceRole.entities.CommunityRoleDefinition.create({
        community_id, slug, name: name.slice(0, 60), description: String(body.description || '').slice(0, 200),
        color: body.color || '#94a3b8', icon: body.icon || 'Shield', position: body.position != null ? Number(body.position) : maxPos + 10,
        permissions: JSON.stringify(perms), is_system: false, is_protected: false,
        mentionable: !!body.mentionable, hoisted: !!body.hoisted, is_active: true, member_count: 0,
        created_by: user.id, created_by_name: user.full_name || user.email,
      });
      await logAudit('role_created', role.name);
      return Response.json({ success: true, role });
    }

    // --- duplicate ---
    if (action === 'duplicate') {
      const src = (roles || []).find((r: any) => r.id === body.role_id);
      if (!src) return Response.json({ error: 'Role not found' }, { status: 404 });
      let slug = slugify(`${src.slug}_copy`);
      let i = 1;
      while ((roles || []).some((r: any) => r.slug === slug)) slug = `${slugify(src.slug)}_copy_${i++}`;
      let maxPos = (roles || []).reduce((m: number, r: any) => Math.max(m, r.position || 0), 0);
      const role = await base44.asServiceRole.entities.CommunityRoleDefinition.create({
        community_id, slug, name: `${src.name} (Copy)`.slice(0, 60), description: src.description || '',
        color: src.color, icon: src.icon, position: maxPos + 10,
        permissions: src.permissions, is_system: false, is_protected: false,
        mentionable: !!src.mentionable, hoisted: !!src.hoisted, is_active: true, member_count: 0,
        created_by: user.id, created_by_name: user.full_name || user.email,
      });
      await logAudit('role_duplicated', `${role.name} (from ${src.name})`);
      return Response.json({ success: true, role });
    }

    // --- update ---
    if (action === 'update') {
      const role = (roles || []).find((r: any) => r.id === body.role_id);
      if (!role) return Response.json({ error: 'Role not found' }, { status: 404 });
      // Owner permissions are locked to '*'.
      if (role.slug === 'owner' && body.permissions && !safeParseArr(body.permissions).includes('*')) {
        return Response.json({ error: 'Owner role must retain all permissions' }, { status: 403 });
      }
      const update: any = {};
      if (body.name != null) update.name = String(body.name).slice(0, 60);
      if (body.description != null) update.description = String(body.description).slice(0, 200);
      if (body.color != null) update.color = body.color;
      if (body.icon != null) update.icon = body.icon;
      if (body.mentionable != null) update.mentionable = !!body.mentionable;
      if (body.hoisted != null) update.hoisted = !!body.hoisted;
      if (body.is_active != null) update.is_active = !!body.is_active;
      if (body.permissions != null) {
        const perms = Array.isArray(body.permissions) ? body.permissions.filter((p) => p === '*' || ALL_COMMUNITY_PERMISSIONS.includes(p)) : [];
        update.permissions = JSON.stringify(role.slug === 'owner' ? ['*'] : perms);
      }
      await base44.asServiceRole.entities.CommunityRoleDefinition.update(role.id, update);
      const renamed = body.name && body.name !== role.name ? `renamed: ${role.name} → ${body.name}` : '';
      await logAudit('role_edited', role.name, renamed || 'permissions updated');
      return Response.json({ success: true });
    }

    // --- delete ---
    if (action === 'delete') {
      const role = (roles || []).find((r: any) => r.id === body.role_id);
      if (!role) return Response.json({ error: 'Role not found' }, { status: 404 });
      if (role.is_protected || role.slug === 'owner' || role.slug === 'member') {
        return Response.json({ error: 'This role is protected and cannot be deleted' }, { status: 403 });
      }
      await base44.asServiceRole.entities.CommunityRoleDefinition.delete(role.id);
      // Remove assignments referencing the deleted role.
      try {
        const a = await base44.asServiceRole.entities.CommunityMemberRole.filter({ community_id, role_id: role.id });
        await Promise.all((a || []).map((x: any) => base44.asServiceRole.entities.CommunityMemberRole.delete(x.id)));
      } catch {}
      await logAudit('role_deleted', role.name);
      return Response.json({ success: true });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});