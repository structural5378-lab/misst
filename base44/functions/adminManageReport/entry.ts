import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Moderation queue for user-submitted reports. Platform admins can resolve,
// dismiss, or remove the reported content. Every action is logged to
// PlatformAuditLog (target_type: 'report').

async function isPlatformAdmin(base44, user) {
  if (user.role === 'admin') return true;
  const pr = await base44.asServiceRole.entities.PlatformRole.filter({ user_id: user.id, is_active: true });
  return (pr || []).some((r) => r.role === 'platform_owner' || r.role === 'platform_admin');
}

const TARGET_ENTITY = {
  thread: 'ForumThread',
  post: 'ForumPost',
  chat_message: 'ChatMessage',
  dm: 'DMMessage',
  marketplace: 'MarketplaceItem',
  gallery: 'GatheringPhoto',
  repeater: 'Repeater',
};

async function logAudit(base44, user, ip, action, extra = {}) {
  try {
    await base44.asServiceRole.entities.PlatformAuditLog.create({
      admin_id: user.id,
      admin_email: user.email || '',
      action,
      target_type: 'report',
      target_id: extra.id || '',
      target_name: extra.name || '',
      notes: extra.notes || '',
      ip_address: ip || '',
    });
  } catch (e) { console.error('[adminManageReport] audit failed:', e.message); }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!(await isPlatformAdmin(base44, user))) return Response.json({ error: 'Forbidden: platform admin required' }, { status: 403 });

    const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || req.headers.get('cf-connecting-ip') || '';
    const body = await req.json().catch(() => ({}));
    const { action, report_id, report_ids, status, target_type, resolution, admin_notes } = body;

    if (action === 'list') {
      let reports;
      if (status) reports = await base44.asServiceRole.entities.Report.filter({ status }, '-created_date', 1000).catch(() => []);
      else reports = await base44.asServiceRole.entities.Report.list('-created_date', 1000);
      return Response.json({ success: true, reports: reports || [] });
    }

    if (action === 'resolve') {
      if (!report_id) return Response.json({ error: 'report_id required' }, { status: 400 });
      const updated = await base44.asServiceRole.entities.Report.update(report_id, {
        status: 'resolved', resolution: resolution || 'no_action', admin_notes: admin_notes || '',
        resolved_by: user.id, resolved_by_email: user.email || '', resolved_at: new Date().toISOString(),
      });
      await logAudit(base44, user, ip, 'report_warn', { id: report_id, notes: resolution || 'no_action' });
      return Response.json({ success: true, report: updated });
    }

    if (action === 'dismiss') {
      if (!report_id) return Response.json({ error: 'report_id required' }, { status: 400 });
      const updated = await base44.asServiceRole.entities.Report.update(report_id, {
        status: 'dismissed', resolution: 'no_action', admin_notes: admin_notes || '',
        resolved_by: user.id, resolved_by_email: user.email || '', resolved_at: new Date().toISOString(),
      });
      await logAudit(base44, user, ip, 'report_dismiss', { id: report_id });
      return Response.json({ success: true, report: updated });
    }

    if (action === 'delete_target') {
      if (!report_id) return Response.json({ error: 'report_id required' }, { status: 400 });
      const report = await base44.asServiceRole.entities.Report.get(report_id).catch(() => null);
      if (!report) return Response.json({ error: 'Report not found' }, { status: 404 });
      const ename = TARGET_ENTITY[report.target_type];
      if (ename) {
        await base44.asServiceRole.entities[ename].delete(report.target_id).catch(() => {});
      }
      const updated = await base44.asServiceRole.entities.Report.update(report_id, {
        status: 'resolved', resolution: 'removed',
        resolved_by: user.id, resolved_by_email: user.email || '', resolved_at: new Date().toISOString(),
        admin_notes: admin_notes || 'Content removed by admin',
      });
      await logAudit(base44, user, ip, 'report_suspend', { id: report_id, name: report.target_name, notes: `Removed ${report.target_type}` });
      return Response.json({ success: true, report: updated });
    }

    if (action === 'bulk_resolve' || action === 'bulk_dismiss') {
      const ids = report_ids || [];
      if (!ids.length) return Response.json({ error: 'report_ids required' }, { status: 400 });
      const patch = action === 'bulk_resolve'
        ? { status: 'resolved', resolution: 'no_action', resolved_by: user.id, resolved_by_email: user.email || '', resolved_at: new Date().toISOString() }
        : { status: 'dismissed', resolution: 'no_action', resolved_by: user.id, resolved_by_email: user.email || '', resolved_at: new Date().toISOString() };
      for (const id of ids) await base44.asServiceRole.entities.Report.update(id, patch).catch(() => {});
      await logAudit(base44, user, ip, action === 'bulk_resolve' ? 'report_warn' : 'report_dismiss', { id: ids.join(','), notes: `Bulk ${ids.length} reports` });
      return Response.json({ success: true, updated: ids.length });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('[adminManageReport] error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});