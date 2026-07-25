import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Generic read + delete moderation over allowed platform entities for admins.
// Used by moderation-style admin pages (chat, gallery, marketplace, alerts,
// achievements) that only need to list, search, and remove records. Mutations
// are logged to PlatformAuditLog (target_type: entity name).

async function isPlatformAdmin(base44, user) {
  if (user.role === 'admin') return true;
  const pr = await base44.asServiceRole.entities.PlatformRole.filter({ user_id: user.id, is_active: true });
  return (pr || []).some((r) => r.role === 'platform_owner' || r.role === 'platform_admin');
}

const ALLOWED_ENTITIES = ['ChatMessage', 'DMMessage', 'Event', 'MarketplaceItem', 'GatheringPhoto', 'Alert', 'UserAchievement'];

// Entities that admins may also CREATE through this generic endpoint.
const CREATE_FIELDS = {
  Alert: { fields: ['title', 'message', 'type', 'link', 'community_id', 'community_name'], required: ['title'] },
  UserAchievement: { fields: ['user_id', 'user_name', 'achievement_id', 'achievement_name', 'rarity', 'collection', 'is_pinned', 'unlocked_date'], required: ['user_id', 'achievement_id'] },
};

async function logAudit(base44, user, ip, action, extra = {}) {
  try {
    await base44.asServiceRole.entities.PlatformAuditLog.create({
      admin_id: user.id, admin_email: user.email || '',
      action, target_type: extra.entity || 'content', target_id: extra.id || '', target_name: extra.name || '',
      notes: extra.notes || '', ip_address: ip || '',
    });
  } catch (e) { console.error('[adminEntityAdmin] audit failed:', e.message); }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!(await isPlatformAdmin(base44, user))) return Response.json({ error: 'Forbidden: platform admin required' }, { status: 403 });

    const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || req.headers.get('cf-connecting-ip') || '';
    const body = await req.json().catch(() => ({}));
    const { action, entity, id, ids, community_id, limit, fields } = body;
    if (!entity || !ALLOWED_ENTITIES.includes(entity)) {
      return Response.json({ error: 'Unsupported entity' }, { status: 400 });
    }
    const E = base44.asServiceRole.entities[entity];

    if (action === 'list') {
      let rows;
      if (community_id) rows = await E.filter({ community_id }, '-created_date', limit || 1000).catch(() => []);
      else rows = await E.list('-created_date', limit || 1000);
      return Response.json({ success: true, rows: rows || [] });
    }
    if (action === 'create') {
      const spec = CREATE_FIELDS[entity];
      if (!spec) return Response.json({ error: `create not supported for ${entity}` }, { status: 400 });
      for (const req of spec.required) {
        if (!fields || fields[req] === undefined || fields[req] === '') return Response.json({ error: `${req} is required` }, { status: 400 });
      }
      const payload = {};
      for (const k of spec.fields) if (fields && fields[k] !== undefined) payload[k] = fields[k];
      const created = await E.create(payload);
      await logAudit(base44, user, ip, 'content_create', { entity, id: created.id, name: payload.title || payload.achievement_name || '' });
      return Response.json({ success: true, row: created });
    }
    if (action === 'delete') {
      if (!id) return Response.json({ error: 'id required' }, { status: 400 });
      await E.delete(id).catch(() => {});
      await logAudit(base44, user, ip, 'content_delete', { entity, id });
      return Response.json({ success: true });
    }
    if (action === 'bulk_delete') {
      const list = ids || [];
      if (!list.length) return Response.json({ error: 'ids required' }, { status: 400 });
      for (const rid of list) await E.delete(rid).catch(() => {});
      await logAudit(base44, user, ip, 'content_delete', { entity, id: list.join(','), notes: `Bulk delete ${list.length} ${entity}` });
      return Response.json({ success: true, deleted: list.length });
    }
    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('[adminEntityAdmin] error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});