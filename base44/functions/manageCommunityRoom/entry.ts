import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

// manageCommunityRoom — community-admin-gated CRUD + reorder for Chat V2 rooms.
// Verifies the caller is a community_owner/community_admin (via CommunityMember)
// then performs the action with the service role (bypasses ChatV2Room RLS).
//
// actions: create | update | delete | reorder
async function isCommunityAdmin(base44, userId, communityId) {
  if (!userId) return false;
  const rows = await base44.asServiceRole.entities.CommunityMember
    .filter({ community_id: communityId, user_id: userId, status: "active" }, "-joined_date", 50)
    .catch(() => []);
  return (rows || []).some((x) => ["community_owner", "community_admin"].includes(x.role));
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const body = await req.json().catch(() => ({}));
  const { action, community_id, room_id, user_id, user_name, ...fields } = body;
  if (!community_id) return Response.json({ ok: false, error: "community_id required" });

  try {
    const admin = await isCommunityAdmin(base44, user_id, community_id);
    if (!admin) return Response.json({ ok: false, error: "not authorized — community admin required" });

    if (action === "create") {
      const community = await base44.asServiceRole.entities.Community.get(community_id).catch(() => null);
      const existing = await base44.asServiceRole.entities.ChatV2Room.filter({ community_id }, "order", 200).catch(() => []);
      const order = fields.order ?? ((Array.isArray(existing) ? existing.length : 0) + 1);
      const room = await base44.asServiceRole.entities.ChatV2Room.create({
        name: (fields.name || "New Room").trim(),
        description: fields.description || "",
        icon: fields.icon || "Hash",
        type: fields.type || "text",
        order,
        community_id,
        community_name: community?.name || "",
        community_slug: community?.slug || "",
        created_by: user_id,
        created_by_name: user_name || "",
      });
      return Response.json({ ok: true, room });
    }

    if (action === "update") {
      const allowed = ["name", "description", "icon", "type", "order", "is_locked", "is_archived", "is_hidden", "slow_mode_seconds", "permissions"];
      const update = {};
      for (const k of allowed) if (fields[k] !== undefined) update[k] = fields[k];
      if (update.name) update.name = String(update.name).trim();
      const room = await base44.asServiceRole.entities.ChatV2Room.update(room_id, update);
      // Audit log room config changes (lock / slow mode / hidden / rename).
      const changed = Object.keys(update);
      const auditWorthy = ["is_locked", "slow_mode_seconds", "is_hidden", "type", "name"];
      if (changed.some((k) => auditWorthy.includes(k))) {
        let act = "room_updated";
        if (changed.includes("is_locked")) act = update.is_locked ? "room_locked" : "room_unlocked";
        else if (changed.includes("slow_mode_seconds")) act = update.slow_mode_seconds ? "slow_mode_enabled" : "slow_mode_disabled";
        try {
          await base44.asServiceRole.entities.CommunityAuditLog.create({
            community_id, community_name: room.community_name || "",
            admin_id: user_id, admin_name: user_name || "",
            action: act, target_user_id: "", target_user_name: room.name || "",
            reason: "Updated: " + changed.join(", "),
          });
        } catch {}
      }
      return Response.json({ ok: true, room });
    }

    if (action === "delete") {
      await base44.asServiceRole.entities.ChatV2RoomMessage.deleteMany({ room_id }).catch(() => {});
      await base44.asServiceRole.entities.ChatV2RoomMembership.deleteMany({ room_id }).catch(() => {});
      await base44.asServiceRole.entities.ChatV2Room.delete(room_id);
      return Response.json({ ok: true });
    }

    if (action === "reorder") {
      const orders = Array.isArray(fields.orders) ? fields.orders : [];
      const updates = orders.map((o) => ({ id: o.id, order: o.order })).filter((o) => o.id);
      if (updates.length) await base44.asServiceRole.entities.ChatV2Room.bulkUpdate(updates);
      return Response.json({ ok: true });
    }

    return Response.json({ ok: false, error: "unknown action" });
  } catch (e) {
    return Response.json({ ok: false, error: e?.message || String(e) });
  }
});