import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Platform-wide geofence (polygon / circle / line) management for the GIS console.

async function isPlatformAdmin(base44, user) {
  if (user.role === 'admin') return true;
  const pr = await base44.asServiceRole.entities.PlatformRole.filter({ user_id: user.id, is_active: true });
  return (pr || []).some((r) => r.role === 'platform_owner' || r.role === 'platform_admin');
}

async function logAudit(base44, user, ip, action, extra = {}) {
  try {
    await base44.asServiceRole.entities.PlatformAuditLog.create({
      admin_id: user.id, admin_email: user.email || '',
      action, target_type: 'geofence', target_id: extra.id || '', target_name: extra.name || '',
      notes: extra.notes || '', ip_address: ip || '',
    });
  } catch (e) { console.error('[adminManageGeofence] audit failed:', e.message); }
}

const ALLOWED = ['name', 'description', 'community_id', 'community_name', 'shape', 'geo', 'color'];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!(await isPlatformAdmin(base44, user))) return Response.json({ error: 'Forbidden: platform admin required' }, { status: 403 });

    const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || '';
    const body = await req.json().catch(() => ({}));
    const { action, geofence_id, geofence_ids, fields } = body;

    if (action === 'list') {
      const fences = await base44.asServiceRole.entities.Geofence.list('-updated_date', 1000);
      return Response.json({ success: true, geofences: fences || [] });
    }
    if (action === 'create') {
      if (!fields?.name || !fields?.shape || !fields?.geo) return Response.json({ error: 'name, shape, geo required' }, { status: 400 });
      const created = await base44.asServiceRole.entities.Geofence.create({ ...fields, created_by: user.id, created_by_email: user.email || '' });
      await logAudit(base44, user, ip, 'geofence_create', { id: created.id, name: created.name });
      return Response.json({ success: true, geofence: created });
    }
    if (action === 'update') {
      if (!geofence_id) return Response.json({ error: 'geofence_id required' }, { status: 400 });
      const patch = {};
      for (const k of ALLOWED) if (fields && fields[k] !== undefined) patch[k] = fields[k];
      const updated = await base44.asServiceRole.entities.Geofence.update(geofence_id, patch);
      await logAudit(base44, user, ip, 'geofence_update', { id: geofence_id, name: updated?.name || '' });
      return Response.json({ success: true, geofence: updated });
    }
    if (action === 'delete' || action === 'bulk_delete') {
      const ids = action === 'bulk_delete' ? (geofence_ids || []) : [geofence_id];
      if (!ids[0]) return Response.json({ error: 'geofence_id required' }, { status: 400 });
      for (const id of ids) await base44.asServiceRole.entities.Geofence.delete(id).catch(() => {});
      await logAudit(base44, user, ip, 'geofence_delete', { id: ids.join(','), notes: `Deleted ${ids.length} geofences` });
      return Response.json({ success: true, deleted: ids.length });
    }
    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('[adminManageGeofence] error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});