import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Platform-wide club (sub-group) management for admins.

async function isPlatformAdmin(base44, user) {
  if (user.role === 'admin') return true;
  const pr = await base44.asServiceRole.entities.PlatformRole.filter({ user_id: user.id, is_active: true });
  return (pr || []).some((r) => r.role === 'platform_owner' || r.role === 'platform_admin');
}

async function logAudit(base44, user, ip, action, extra = {}) {
  try {
    await base44.asServiceRole.entities.PlatformAuditLog.create({
      admin_id: user.id, admin_email: user.email || '',
      action, target_type: 'club', target_id: extra.id || '', target_name: extra.name || '', notes: extra.notes || '', ip_address: ip || '',
    });
  } catch (e) { console.error('[adminManageClub] audit failed:', e.message); }
}

const ALLOWED = ['name', 'description', 'category', 'community_id', 'community_name', 'owner_id', 'owner_name', 'status', 'is_public', 'member_count', 'logo_url'];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!(await isPlatformAdmin(base44, user))) return Response.json({ error: 'Forbidden: platform admin required' }, { status: 403 });

    const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || '';
    const body = await req.json().catch(() => ({}));
    const { action, club_id, club_ids, fields, status } = body;

    if (action === 'list') {
      const clubs = await base44.asServiceRole.entities.Club.list('-updated_date', 1000);
      return Response.json({ success: true, clubs: clubs || [] });
    }
    if (action === 'create') {
      if (!fields?.name) return Response.json({ error: 'name is required' }, { status: 400 });
      const created = await base44.asServiceRole.entities.Club.create(fields);
      await logAudit(base44, user, ip, 'club_create', { id: created.id, name: created.name });
      return Response.json({ success: true, club: created });
    }
    if (action === 'update') {
      if (!club_id) return Response.json({ error: 'club_id required' }, { status: 400 });
      const patch = {};
      for (const k of ALLOWED) if (fields && fields[k] !== undefined) patch[k] = fields[k];
      const updated = await base44.asServiceRole.entities.Club.update(club_id, patch);
      await logAudit(base44, user, ip, 'club_update', { id: club_id, name: updated?.name || '' });
      return Response.json({ success: true, club: updated });
    }
    if (action === 'set_status') {
      if (!club_id || !status) return Response.json({ error: 'club_id and status required' }, { status: 400 });
      const updated = await base44.asServiceRole.entities.Club.update(club_id, { status });
      await logAudit(base44, user, ip, status === 'active' ? 'club_activate' : 'club_suspend', { id: club_id, name: updated?.name || '' });
      return Response.json({ success: true, club: updated });
    }
    if (action === 'delete' || action === 'bulk_delete') {
      const ids = action === 'bulk_delete' ? (club_ids || []) : [club_id];
      if (!ids[0]) return Response.json({ error: 'club_id required' }, { status: 400 });
      for (const id of ids) await base44.asServiceRole.entities.Club.delete(id).catch(() => {});
      await logAudit(base44, user, ip, 'club_delete', { id: ids.join(','), notes: `Deleted ${ids.length} clubs` });
      return Response.json({ success: true, deleted: ids.length });
    }
    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('[adminManageClub] error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});