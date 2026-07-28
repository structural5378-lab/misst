import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// listMemberModerationHistory — unified, paginated moderation timeline for a
// single community member. Merges audit-log entries (mutes, suspensions, bans,
// kicks, deleted messages, announcements, notes, voice actions), reports filed
// by the member, reports filed against the member, and moderator notes into one
// chronological feed. Community-scoped + server-validated (moderator/admin or
// platform admin). Supports category filter, search, date range, pagination.

const MOD_ROLES = ['community_owner', 'community_admin', 'moderator'];

function categoryOf(action: string): string {
  if (!action) return 'other';
  if (action.startsWith('set_role')) return 'roles';
  if (action === 'update_settings') return 'settings';
  if (['approve', 'reject'].includes(action)) return 'membership';
  if (['ban', 'unban', 'suspend', 'unsuspend', 'mute', 'unmute', 'kick'].includes(action)) return 'moderation';
  if (action.startsWith('voice_')) return 'moderation';
  if (action.startsWith('note_')) return 'notes';
  if (action.startsWith('message_') || action.startsWith('messages_bulk_') || action.startsWith('room_') ||
      action === 'room_cleared' || action === 'slow_mode_enabled' || action === 'slow_mode_disabled') return 'chat';
  return 'other';
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const community_id = String(body.community_id || '');
    const target_user_id = String(body.target_user_id || '');
    if (!community_id || !target_user_id) {
      return Response.json({ error: 'community_id and target_user_id are required' }, { status: 400 });
    }

    const mine = await base44.asServiceRole.entities.CommunityMember.filter({ user_id: user.id, community_id, is_active: true });
    const membership = (mine && mine[0]) || null;
    const isPlatformAdmin = user.role === 'admin';
    let platformMod = false;
    try {
      const pr = await base44.asServiceRole.entities.PlatformRole.filter({ user_id: user.id, is_active: true });
      platformMod = (pr || []).some(r => r.role === 'platform_owner' || r.role === 'platform_admin');
    } catch {}
    const isMod = membership && MOD_ROLES.includes(membership.role);
    if (!isMod && !isPlatformAdmin && !platformMod) {
      return Response.json({ error: 'Access denied: moderator role required' }, { status: 403 });
    }

    const category = String(body.category || 'all');
    const search = String(body.search || '').toLowerCase().trim();
    const dateFrom = body.date_from ? new Date(body.date_from) : null;
    const dateTo = body.date_to ? new Date(body.date_to) : null;
    if (dateTo) dateTo.setHours(23, 59, 59, 999);
    const limit = Math.min(Number(body.limit) || 25, 100);
    const skip = Math.max(Number(body.skip) || 0, 0);

    const audit = await base44.asServiceRole.entities.CommunityAuditLog.filter({ community_id, target_user_id }, '-created_date', 500).catch(() => []);
    const reportsFiled = await base44.asServiceRole.entities.Report.filter({ reporter_id: target_user_id, community_id }, '-created_date', 200).catch(() => []);
    const reportsAgainst = await base44.asServiceRole.entities.Report.filter({ target_owner_id: target_user_id, community_id }, '-created_date', 200).catch(() => []);
    const notes = await base44.asServiceRole.entities.ModeratorNote.filter({ community_id, target_user_id }, '-created_date', 200).catch(() => []);

    const items: any[] = [];
    (audit || []).forEach(a => items.push({
      date: a.created_date, source: 'audit', id: a.id,
      admin_name: a.admin_name || '', action: a.action, action_label: a.action,
      reason: a.reason || '', duration: a.duration || '', category: a.action_category || categoryOf(a.action),
      room_name: a.room_name || '', message_preview: '', target_user_name: a.target_user_name || '', ip: a.ip_address || '',
    }));
    (reportsFiled || []).forEach(r => items.push({
      date: r.created_date, source: 'report_filed', id: r.id,
      admin_name: r.reporter_name || '', action: 'report_filed', action_label: 'Report Filed',
      reason: r.reason || '', duration: '', category: 'reports',
      room_name: '', message_preview: r.target_name || '', target_user_name: '', ip: '',
    }));
    (reportsAgainst || []).forEach(r => items.push({
      date: r.created_date, source: 'report_against', id: r.id,
      admin_name: r.reporter_name || '', action: 'report_against', action_label: 'Report Against',
      reason: r.reason || '', duration: '', category: 'reports',
      room_name: '', message_preview: r.target_name || '', target_user_name: '', ip: '',
    }));
    (notes || []).forEach(n => items.push({
      date: n.created_date, source: 'note', id: n.id,
      admin_name: n.author_name || '', action: 'note', action_label: 'Moderator Note',
      reason: n.content || '', duration: '', category: 'notes',
      room_name: '', message_preview: '', target_user_name: n.target_user_name || '', ip: '',
    }));

    items.sort((a, b) => (b.date ? new Date(b.date).getTime() : 0) - (a.date ? new Date(a.date).getTime() : 0));

    let filtered = items;
    if (category && category !== 'all') filtered = filtered.filter(i => i.category === category);
    if (search) {
      filtered = filtered.filter(i =>
        [i.admin_name, i.action_label, i.reason, i.target_user_name, i.message_preview]
          .filter(Boolean).join(' ').toLowerCase().includes(search)
      );
    }
    if (dateFrom) filtered = filtered.filter(i => i.date && new Date(i.date) >= dateFrom);
    if (dateTo) filtered = filtered.filter(i => i.date && new Date(i.date) <= dateTo);

    const total = filtered.length;
    const entries = filtered.slice(skip, skip + limit);
    return Response.json({ entries, total, has_more: skip + limit < total });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});