import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

// listDeletedMessages — community-scoped viewer for soft-deleted chat messages.
//
// SECURITY: caller must be the community_owner / community_admin or a platform
// admin. Regular members can NEVER see deleted messages. Supports search
// (body / sender / deleted_by), room filter, date range (deleted_at), and
// pagination. Returns rich rows (room name, author, deleted_by, reason, ts).

const ADMIN_ROLES = ["community_owner", "community_admin"];

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  try {
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { community_id, search, room_id, date_from, date_to, page = 1, limit = 50 } = body;
    if (!community_id) return Response.json({ error: "community_id required" }, { status: 400 });

    // Authorize: community admin/owner or platform admin.
    const mine = await base44.asServiceRole.entities.CommunityMember
      .filter({ user_id: user.id, community_id, is_active: true }, "-joined_date", 10).catch(() => []);
    const me = (mine || [])[0] || null;
    const isCommunityAdmin = me && ADMIN_ROLES.includes(me.role);
    let platformAdmin = false;
    try {
      const pr = await base44.asServiceRole.entities.PlatformRole.filter({ user_id: user.id, is_active: true });
      platformAdmin = (pr || []).some((r) => r.role === "platform_owner" || r.role === "platform_admin");
    } catch {}
    if (!isCommunityAdmin && !platformAdmin) {
      return Response.json({ error: "Not authorized" }, { status: 403 });
    }

    // Build the query. We fetch a generous window then refine in-memory for
    // search/date range (entity filter is limited to equality fields).
    const filter = { community_id, deleted: true } as any;
    if (room_id) filter.room_id = room_id;

    const pageSize = Math.min(Math.max(Number(limit) || 50, 1), 200);
    const pageNum = Math.max(Number(page) || 1, 1);
    const skip = (pageNum - 1) * pageSize;

    // Fetch up to a sane cap sorted by deleted_at desc.
    const all = await base44.asServiceRole.entities.ChatV2RoomMessage
      .filter(filter, "-deleted_at", 1000).catch(() => []);

    let rows = (all || []).filter((m) => m.deleted);

    // Date range on deleted_at.
    if (date_from) {
      const from = new Date(date_from).getTime();
      if (!isNaN(from)) rows = rows.filter((m) => new Date(m.deleted_at || m.updated_date || m.created_date).getTime() >= from);
    }
    if (date_to) {
      const to = new Date(date_to).getTime();
      if (!isNaN(to)) rows = rows.filter((m) => new Date(m.deleted_at || m.updated_date || m.created_date).getTime() <= to);
    }
    // Search across body / sender_name / deleted_by_name / deleted_reason.
    if (search && String(search).trim()) {
      const q = String(search).toLowerCase();
      rows = rows.filter((m) =>
        (m.body || "").toLowerCase().includes(q) ||
        (m.sender_name || "").toLowerCase().includes(q) ||
        (m.deleted_by_name || "").toLowerCase().includes(q) ||
        (m.deleted_reason || "").toLowerCase().includes(q)
      );
    }

    const total = rows.length;
    const items = rows.slice(skip, skip + pageSize);

    return Response.json({ items, total, page: pageNum, limit: pageSize, has_more: skip + pageSize < total });
  } catch (e) {
    return Response.json({ error: e?.message || String(e) }, { status: 500 });
  }
});