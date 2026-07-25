import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Platform-wide forum content moderation for admins. Lists ForumThreads
// (including soft-deleted) via the service role and supports pin / lock /
// feature / delete / restore with single and bulk variants. Every action is
// logged to PlatformAuditLog (target_type: 'content').

async function isPlatformAdmin(base44, user) {
  if (user.role === 'admin') return true;
  const pr = await base44.asServiceRole.entities.PlatformRole.filter({ user_id: user.id, is_active: true });
  return (pr || []).some((r) => r.role === 'platform_owner' || r.role === 'platform_admin');
}

async function logAudit(base44, user, ip, action, extra = {}) {
  try {
    await base44.asServiceRole.entities.PlatformAuditLog.create({
      admin_id: user.id,
      admin_email: user.email || '',
      action,
      target_type: 'content',
      target_id: extra.id || '',
      target_name: extra.name || '',
      community_name: extra.community_name || '',
      notes: extra.notes || '',
      ip_address: ip || '',
    });
  } catch (e) { console.error('[adminModerateContent] audit failed:', e.message); }
}

const FIELD_MAP = {
  pin: { is_pinned: true }, unpin: { is_pinned: false },
  lock: { is_locked: true }, unlock: { is_locked: false },
  feature: { is_featured: true }, unfeature: { is_featured: false },
  delete: { is_deleted: true }, restore: { is_deleted: false },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!(await isPlatformAdmin(base44, user))) return Response.json({ error: 'Forbidden: platform admin required' }, { status: 403 });

    const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || req.headers.get('cf-connecting-ip') || '';
    const body = await req.json().catch(() => ({}));
    const { action, thread_id, thread_ids, community_id } = body;

    if (action === 'list') {
      let threads = await base44.asServiceRole.entities.ForumThread.list('-updated_date', 500);
      if (community_id) threads = (threads || []).filter((t) => t.community_id === community_id);
      return Response.json({ success: true, threads: threads || [] });
    }

    // single actions
    if (FIELD_MAP[action]) {
      if (!thread_id) return Response.json({ error: 'thread_id required' }, { status: 400 });
      const t = await base44.asServiceRole.entities.ForumThread.get(thread_id).catch(() => null);
      const updated = await base44.asServiceRole.entities.ForumThread.update(thread_id, FIELD_MAP[action]);
      await logAudit(base44, user, ip, `content_${action}`, { id: thread_id, name: t?.title || '', community_name: t?.community_name || '' });
      return Response.json({ success: true, thread: updated });
    }

    // bulk actions
    const bulk = { bulk_pin: 'pin', bulk_unpin: 'unpin', bulk_lock: 'lock', bulk_unlock: 'unlock', bulk_feature: 'feature', bulk_unfeature: 'unfeature', bulk_delete: 'delete', bulk_restore: 'restore' };
    if (bulk[action]) {
      const ids = thread_ids || [];
      if (!ids.length) return Response.json({ error: 'thread_ids required' }, { status: 400 });
      const patch = FIELD_MAP[bulk[action]];
      for (const id of ids) await base44.asServiceRole.entities.ForumThread.update(id, patch).catch(() => {});
      await logAudit(base44, user, ip, `content_${bulk[action]}`, { id: ids.join(','), notes: `Bulk ${ids.length} threads` });
      return Response.json({ success: true, updated: ids.length });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('[adminModerateContent] error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});