import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Platform-wide scheduled-net management for admins. Full CRUD over the Net
// entity via the service role. Mutations are logged to PlatformAuditLog
// (target_type: 'net').

async function isPlatformAdmin(base44, user) {
  if (user.role === 'admin') return true;
  const pr = await base44.asServiceRole.entities.PlatformRole.filter({ user_id: user.id, is_active: true });
  return (pr || []).some((r) => r.role === 'platform_owner' || r.role === 'platform_admin');
}

async function logAudit(base44, user, ip, action, extra = {}) {
  try {
    await base44.asServiceRole.entities.PlatformAuditLog.create({
      admin_id: user.id, admin_email: user.email || '',
      action, target_type: 'net', target_id: extra.id || '', target_name: extra.name || '',
      community_name: extra.community_name || '', notes: extra.notes || '', ip_address: ip || '',
    });
  } catch (e) { console.error('[adminManageNet] audit failed:', e.message); }
}

const ALLOWED = ['name', 'description', 'schedule', 'time', 'day_of_week', 'frequency', 'repeater_callsign', 'net_control', 'member_count', 'category', 'is_favorite', 'community_id', 'community_name'];
const NUMERIC = ['frequency', 'member_count'];

function sanitize(fields) {
  const out = {};
  for (const k of ALLOWED) if (fields && fields[k] !== undefined) {
    let v = fields[k];
    if (NUMERIC.includes(k)) {
      if (v === '' || v == null) v = null;
      else { const n = Number(v); v = Number.isNaN(n) ? null : n; }
    }
    out[k] = v;
  }
  return out;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!(await isPlatformAdmin(base44, user))) return Response.json({ error: 'Forbidden: platform admin required' }, { status: 403 });

    const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || req.headers.get('cf-connecting-ip') || '';
    const body = await req.json().catch(() => ({}));
    const { action, net_id, net_ids, fields, community_id } = body;

    if (action === 'list') {
      let nets = await base44.asServiceRole.entities.Net.list('-updated_date', 1000);
      if (community_id) nets = (nets || []).filter((n) => n.community_id === community_id);
      return Response.json({ success: true, nets: nets || [] });
    }
    if (action === 'create') {
      if (!fields?.name) return Response.json({ error: 'name is required' }, { status: 400 });
      const created = await base44.asServiceRole.entities.Net.create(sanitize(fields));
      await logAudit(base44, user, ip, 'net_create', { id: created.id, name: created.name, community_name: created.community_name });
      return Response.json({ success: true, net: created });
    }
    if (action === 'update') {
      if (!net_id) return Response.json({ error: 'net_id required' }, { status: 400 });
      const n = await base44.asServiceRole.entities.Net.get(net_id).catch(() => null);
      const updated = await base44.asServiceRole.entities.Net.update(net_id, sanitize(fields));
      await logAudit(base44, user, ip, 'net_update', { id: net_id, name: updated?.name || n?.name || '', community_name: updated?.community_name || n?.community_name || '' });
      return Response.json({ success: true, net: updated });
    }
    if (action === 'delete') {
      if (!net_id) return Response.json({ error: 'net_id required' }, { status: 400 });
      await base44.asServiceRole.entities.Net.delete(net_id).catch(() => {});
      await logAudit(base44, user, ip, 'net_delete', { id: net_id });
      return Response.json({ success: true });
    }
    if (action === 'bulk_delete') {
      const ids = net_ids || [];
      if (!ids.length) return Response.json({ error: 'net_ids required' }, { status: 400 });
      for (const id of ids) await base44.asServiceRole.entities.Net.delete(id).catch(() => {});
      await logAudit(base44, user, ip, 'net_delete', { id: ids.join(','), notes: `Bulk delete ${ids.length} nets` });
      return Response.json({ success: true, deleted: ids.length });
    }
    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('[adminManageNet] error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});