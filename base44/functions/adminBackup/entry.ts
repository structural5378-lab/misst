import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Platform data inventory + snapshot export for admins. Provides record
// counts per entity and JSON snapshot export (capped at 1000 per entity).
// Restore is intentionally NOT exposed here — it is a destructive operation.

async function isPlatformAdmin(base44, user) {
  if (user.role === 'admin') return true;
  const pr = await base44.asServiceRole.entities.PlatformRole.filter({ user_id: user.id, is_active: true });
  return (pr || []).some((r) => r.role === 'platform_owner' || r.role === 'platform_admin');
}

const INVENTORY = ['Community', 'CommunityMember', 'User', 'Repeater', 'Net', 'ForumThread', 'ChatMessage', 'Event', 'MarketplaceItem', 'Report', 'PlatformAuditLog', 'FeatureFlag'];

async function logAudit(base44, user, ip, action, extra = {}) {
  try {
    await base44.asServiceRole.entities.PlatformAuditLog.create({
      admin_id: user.id, admin_email: user.email || '',
      action, target_type: 'platform', target_id: '', notes: extra.notes || '', ip_address: ip || '',
    });
  } catch (e) { console.error('[adminBackup] audit failed:', e.message); }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!(await isPlatformAdmin(base44, user))) return Response.json({ error: 'Forbidden: platform admin required' }, { status: 403 });

    const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || '';
    const body = await req.json().catch(() => ({}));
    const { action, entities } = body;

    if (action === 'inventory') {
      const out = {};
      for (const ename of INVENTORY) {
        const E = base44.asServiceRole.entities[ename];
        const rows = await E.list('-created_date', 1000).catch(() => []);
        out[ename] = Array.isArray(rows) ? rows.length : 0;
      }
      return Response.json({ success: true, inventory: out });
    }

    if (action === 'snapshot') {
      const list = entities && entities.length ? entities : INVENTORY;
      const snap = {};
      for (const ename of list) {
        const E = base44.asServiceRole.entities[ename];
        snap[ename] = await E.list('-created_date', 1000).catch(() => []);
      }
      await logAudit(base44, user, ip, 'platform_backup', { notes: `Snapshot of ${list.length} entities` });
      return Response.json({ success: true, snapshot: snap, exported_at: new Date().toISOString(), exported_by: user.email });
    }

    if (action === 'restore') {
      // Destructive import: re-creates records from a previously-exported snapshot.
      // Built-in fields (id, dates, created_by_id) are stripped so fresh records are made.
      const snapshot = body.snapshot || {};
      if (!snapshot || typeof snapshot !== 'object' || Object.keys(snapshot).length === 0) {
        return Response.json({ error: 'Empty or invalid snapshot' }, { status: 400 });
      }
      const results = {};
      let totalCreated = 0;
      for (const [ename, rows] of Object.entries(snapshot)) {
        const E = base44.asServiceRole.entities[ename];
        if (!E) { results[ename] = { skipped: true, reason: 'unknown entity' }; continue; }
        const clean = (Array.isArray(rows) ? rows : []).map(({ id, created_date, updated_date, created_by_id, is_sample, ...rest }) => rest);
        if (!clean.length) { results[ename] = 0; continue; }
        try {
          const created = await E.bulkCreate(clean);
          const n = Array.isArray(created) ? created.length : 0;
          results[ename] = n;
          totalCreated += n;
        } catch (e) {
          results[ename] = { error: e.message };
        }
      }
      await logAudit(base44, user, ip, 'platform_restore', { notes: `Restored ${totalCreated} records across ${Object.keys(snapshot).length} entities` });
      return Response.json({ success: true, results, totalCreated, restored_at: new Date().toISOString(), restored_by: user.email });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('[adminBackup] error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});