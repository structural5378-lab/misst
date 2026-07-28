import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// listCommunityAuditLog — searchable, filterable, paginated audit log for a
// single community. Only the community owner/admin (or a platform admin) may
// read it. Entries are scoped to community_id; no cross-community data is
// returned. Categories are derived from the action string so the viewer can
// filter by Membership / Moderation / Role Changes / Settings / Other.

const ADMIN_ROLES = ['community_owner', 'community_admin'];

function categoryOf(action) {
  if (!action) return 'other';
  if (action.startsWith('set_role')) return 'roles';
  if (action === 'update_settings') return 'settings';
  if (['approve', 'reject'].includes(action)) return 'membership';
  if (['ban', 'unban', 'suspend', 'unsuspend', 'mute', 'unmute', 'kick'].includes(action)) return 'moderation';
  if (action.startsWith('message_') || action.startsWith('messages_bulk_') || action.startsWith('room_') || action === 'room_cleared' || action === 'slow_mode_enabled' || action === 'slow_mode_disabled') return 'chat';
  return 'other';
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const community_id = String(body.community_id || '').trim();
    if (!community_id) return Response.json({ error: 'community_id required' }, { status: 400 });

    // Authorization: community admin/owner or platform admin.
    const mine = await base44.asServiceRole.entities.CommunityMember.filter({
      user_id: user.id, community_id, is_active: true,
    });
    const membership = (mine && mine[0]) || null;
    const isPlatformAdmin = user.role === 'admin';
    const isCommunityAdmin = !!membership && ADMIN_ROLES.includes(membership.role);
    if (!isPlatformAdmin && !isCommunityAdmin) {
      return Response.json({ error: 'Access denied: community admin role required' }, { status: 403 });
    }

    const category = String(body.category || 'all').trim();
    const search = String(body.search || '').toLowerCase().trim();
    const dateFrom = body.date_from ? new Date(body.date_from) : null;
    const dateTo = body.date_to ? new Date(body.date_to) : null;
    if (dateTo) dateTo.setHours(23, 59, 59, 999);
    const limit = Math.min(Number(body.limit) || 25, 200);
    const skip = Math.max(Number(body.skip) || 0, 0);

    // Fetch a generous window and filter/paginate in memory. Audit logs are
    // community-scoped and not expected to exceed a few thousand entries.
    const all = await base44.asServiceRole.entities.CommunityAuditLog.filter(
      { community_id }, '-created_date', 500
    );
    let rows = (all || []).map((a) => ({ ...a, category: categoryOf(a.action) }));

    if (category && category !== 'all') rows = rows.filter((a) => a.category === category);
    if (search) {
      rows = rows.filter((a) => {
        const hay = [a.admin_name, a.action, a.target_user_name, a.reason]
          .filter(Boolean).join(' ').toLowerCase();
        return hay.includes(search);
      });
    }
    if (dateFrom) rows = rows.filter((a) => a.created_date && new Date(a.created_date) >= dateFrom);
    if (dateTo) rows = rows.filter((a) => a.created_date && new Date(a.created_date) <= dateTo);

    const total = rows.length;
    const entries = rows.slice(skip, skip + limit);
    return Response.json({ entries, total, has_more: skip + limit < total });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});