import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Platform-wide repeater management for Global Admins only.
// Gated on PlatformRole (platform_owner / platform_admin). Every mutating
// action is written to PlatformAuditLog (target_type: 'repeater').

async function isPlatformAdmin(base44, user) {
  if (user.role === 'admin') return true;
  const pr = await base44.asServiceRole.entities.PlatformRole.filter({ user_id: user.id, is_active: true });
  return (pr || []).some((r) => r.role === 'platform_owner' || r.role === 'platform_admin');
}

async function audit(base44, user, ip, action, extra = {}) {
  try {
    await base44.asServiceRole.entities.PlatformAuditLog.create({
      admin_id: user.id,
      admin_email: user.email || '',
      action,
      target_type: 'repeater',
      target_id: extra.id || '',
      target_name: extra.name || '',
      notes: extra.notes || '',
      ip_address: ip || '',
    });
  } catch (e) {
    console.error('[adminManageRepeater] audit write failed:', e.message);
  }
}

const ALLOWED = [
  'callsign', 'frequency', 'offset', 'tone', 'band', 'location', 'latitude', 'longitude',
  'status', 'owner_callsign', 'description', 'image_url', 'is_favorite',
  'community_id', 'community_name',
  'coverage_radius', 'coverage_color', 'coverage_opacity', 'coverage_visible',
  'height_m', 'erp_watts', 'antenna_type',
];
const NUMERIC = ['frequency', 'latitude', 'longitude', 'coverage_radius', 'coverage_opacity', 'height_m', 'erp_watts'];

function sanitize(fields) {
  const out = {};
  for (const k of ALLOWED) {
    if (fields && fields[k] !== undefined) {
      let v = fields[k];
      if (NUMERIC.includes(k)) {
        if (v === '' || v === null || v === undefined) v = null;
        else { const n = Number(v); v = Number.isNaN(n) ? null : n; }
      }
      out[k] = v;
    }
  }
  return out;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = await isPlatformAdmin(base44, user);
    if (!admin) return Response.json({ error: 'Forbidden: platform admin required' }, { status: 403 });

    const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim()
      || req.headers.get('cf-connecting-ip') || '';
    const body = await req.json().catch(() => ({}));
    const { action, repeater_id, fields, repeater_ids } = body;

    if (action === 'list') {
      const repeaters = await base44.asServiceRole.entities.Repeater.list('-updated_date', 1000);
      return Response.json({ success: true, repeaters: repeaters || [] });
    }

    if (action === 'create') {
      if (!fields?.callsign || fields?.frequency === undefined || fields?.frequency === null || fields?.frequency === '') {
        return Response.json({ error: 'callsign and frequency are required' }, { status: 400 });
      }
      const payload = sanitize(fields);
      if (payload.coverage_visible === undefined) payload.coverage_visible = true;
      const created = await base44.asServiceRole.entities.Repeater.create(payload);
      await audit(base44, user, ip, 'repeater_create', { id: created.id, name: created.callsign });
      return Response.json({ success: true, repeater: created });
    }

    if (action === 'update') {
      if (!repeater_id) return Response.json({ error: 'repeater_id is required' }, { status: 400 });
      const updated = await base44.asServiceRole.entities.Repeater.update(repeater_id, sanitize(fields));
      await audit(base44, user, ip, 'repeater_update', { id: repeater_id, name: updated?.callsign || '' });
      return Response.json({ success: true, repeater: updated });
    }

    if (action === 'delete') {
      if (!repeater_id) return Response.json({ error: 'repeater_id is required' }, { status: 400 });
      await base44.asServiceRole.entities.Repeater.delete(repeater_id).catch(() => {});
      await audit(base44, user, ip, 'repeater_delete', { id: repeater_id });
      return Response.json({ success: true });
    }

    if (action === 'bulk_delete') {
      const ids = repeater_ids || [];
      if (!ids.length) return Response.json({ error: 'repeater_ids is required' }, { status: 400 });
      for (const id of ids) await base44.asServiceRole.entities.Repeater.delete(id).catch(() => {});
      await audit(base44, user, ip, 'repeater_delete', { id: ids.join(','), notes: `Bulk delete ${ids.length} repeaters` });
      return Response.json({ success: true, deleted: ids.length });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('[adminManageRepeater] error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});