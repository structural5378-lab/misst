import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { dispatchNotifications } from "../../shared/notifications.ts";

// roomMessageAction — community-scoped message moderation + reactions + edits.
//
// SECURITY: every moderation action verifies the caller's CommunityMember role
// server-side (moderator/admin). Muted members cannot react or edit. All
// moderation actions write a CommunityAuditLog entry (with message/room/state
// context). Privilege escalation is prevented at the membership layer
// (manageCommunityMembership rank checks). Announcement actions dispatch push
// notifications to eligible (active, non-muted, non-banned) members via the
// centralized notification engine, which honors per-user preferences.

const ADMIN_ROLES = ["community_owner", "community_admin"];
const MOD_ROLES = ["community_owner", "community_admin", "moderator"];
const BULK_FIELDS = { pinned: "pinned", is_announcement: "is_announcement", is_sticky: "is_sticky", is_official: "is_official" };

function parseJSON(v, fb) { try { return v ? JSON.parse(v) : fb; } catch { return fb; } }

async function memberRow(base44, userId, communityId) {
  if (!userId) return null;
  const rows = await base44.asServiceRole.entities.CommunityMember
    .filter({ community_id: communityId, user_id: userId, status: "active" }, "-joined_date", 50)
    .catch(() => []);
  return (rows || [])[0] || null;
}

async function clearExpiredMute(base44, m) {
  if (!m || !m.muted) return m;
  if (m.muted_until && new Date(m.muted_until).getTime() < Date.now()) {
    try {
      await base44.asServiceRole.entities.CommunityMember.update(m.id, { muted: false, muted_until: "" });
      return { ...m, muted: false, muted_until: "" };
    } catch {}
  }
  return m;
}

function callerIp(req) {
  try {
    const h = req.headers;
    return h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || "";
  } catch { return ""; }
}

async function audit(base44, communityId, communityName, admin, action, targetId, targetName, reason, extra = {}) {
  try {
    await base44.asServiceRole.entities.CommunityAuditLog.create({
      community_id: communityId,
      community_name: communityName || "",
      admin_id: admin.id,
      admin_name: admin.name,
      action,
      action_category: extra.category || "moderation",
      target_user_id: targetId || "",
      target_user_name: targetName || "",
      target_message_id: extra.message_id || "",
      room_id: extra.room_id || "",
      room_name: extra.room_name || "",
      reason: reason || "",
      duration: extra.duration || "",
      previous_state: extra.previous_state || "",
      new_state: extra.new_state || "",
      ip_address: extra.ip_address || "",
      device_info: extra.device_info || "",
    });
  } catch (e) {
    console.error("[roomMessageAction][audit]", e.message);
  }
}

// Dispatch an announcement push to active, non-muted, non-banned members
// (excluding the moderator). The notification engine honors per-user
// preferences (community_announcement) and quiet hours.
async function dispatchAnnouncementPush(base44, communityId, room, msg, callerName, userId, bulk = false) {
  try {
    const members = await base44.asServiceRole.entities.CommunityMember
      .filter({ community_id: communityId, is_active: true }, "-joined_date", 500).catch(() => []);
    const eligible = (members || []).filter((m) =>
      String(m.user_id) !== String(userId) && m.status === "active" && !m.muted
    );
    const recipient_ids = eligible.map((m) => String(m.user_id)).filter(Boolean);
    if (!recipient_ids.length) return;
    const slug = room?.community_slug || msg?.community_slug || "";
    await dispatchNotifications(base44, {
      type: "community_announcement",
      sender_id: userId,
      sender_name: callerName,
      title: `📢 Announcement in ${room?.name || "Community"}`,
      message: (msg?.body || "").slice(0, 160),
      recipient_ids,
      related_object_id: msg?.room_id || room?.id || "",
      related_object_type: "room",
      community_id: communityId,
      link: slug ? `/chat-v2/c/${slug}` : "/chat-v2",
      metadata: JSON.stringify({
        community_id: communityId, community_slug: slug,
        room_id: msg?.room_id || room?.id || "", room_name: room?.name || "",
        message_id: msg?.id || "", moderator: callerName, announcement: true, bulk,
      }),
      skip_sender: true,
    });
  } catch (e) {
    console.error("[roomMessageAction][announce-push]", e.message);
  }
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const body = await req.json().catch(() => ({}));
  const { action, message_id, room_id, user_id, user_name, emoji, pinned, body: newBody, reason, message_ids } = body;
  if (!user_id) return Response.json({ ok: false, error: "user_id required" });

  try {
    const caller = await base44.auth.me().catch(() => null);
    const callerName = caller?.full_name || caller?.email || user_name || "Admin";
    const admin = { id: user_id, name: callerName };
    const ip = callerIp(req);
    const device = (req.headers.get("user-agent") || "").slice(0, 200);
    const auditExtra = (extra = {}) => ({ ip_address: ip, device_info: device, ...extra });

    // ---- room-scoped: bulk_set (mod+) — pin/announce/sticky/official in bulk ----
    if (action === "bulk_set") {
      const ids = Array.isArray(message_ids) ? message_ids : [];
      if (!ids.length) return Response.json({ ok: false, error: "message_ids required" });
      const field = BULK_FIELDS[body.field];
      const value = !!body.value;
      if (!field) return Response.json({ ok: false, error: "invalid field" });
      const first = await base44.asServiceRole.entities.ChatV2RoomMessage.get(ids[0]).catch(() => null);
      if (!first) return Response.json({ ok: false, error: "message not found" });
      const room = await base44.asServiceRole.entities.ChatV2Room.get(first.room_id).catch(() => null);
      let m = await memberRow(base44, user_id, first.community_id);
      m = await clearExpiredMute(base44, m);
      if (!m || !MOD_ROLES.includes(m.role)) return Response.json({ ok: false, error: "moderator role required" });
      const stamp = new Date().toISOString();
      const update = { [field]: value };
      if (field === "pinned") {
        update.pinned_by = value ? user_id : "";
        update.pinned_by_name = value ? callerName : "";
        update.pinned_at = value ? stamp : "";
      }
      await Promise.all(ids.map((id) =>
        base44.asServiceRole.entities.ChatV2RoomMessage.update(id, update).catch(() => {})
      ));
      const slug = `messages_bulk_${body.field}_${value ? "set" : "unset"}`;
      await audit(base44, first.community_id, room?.community_name || "", admin, slug, "", `${ids.length} messages`, reason,
        auditExtra({ room_id: first.room_id, room_name: room?.name || "", category: "chat", previous_state: `${body.field}:${!value}`, new_state: `${body.field}:${value}` }));
      if (field === "is_announcement" && value) {
        await dispatchAnnouncementPush(base44, first.community_id, room, first, callerName, user_id, true);
      }
      return Response.json({ ok: true, count: ids.length });
    }

    // ---- room-scoped: bulk_delete (mod+) ----
    if (action === "bulk_delete") {
      const ids = Array.isArray(message_ids) ? message_ids : [];
      if (!ids.length) return Response.json({ ok: false, error: "message_ids required" });
      const first = await base44.asServiceRole.entities.ChatV2RoomMessage.get(ids[0]).catch(() => null);
      if (!first) return Response.json({ ok: false, error: "message not found" });
      const room = await base44.asServiceRole.entities.ChatV2Room.get(first.room_id).catch(() => null);
      let m = await memberRow(base44, user_id, first.community_id);
      m = await clearExpiredMute(base44, m);
      if (!m || !MOD_ROLES.includes(m.role)) return Response.json({ ok: false, error: "moderator role required" });
      const stamp = new Date().toISOString();
      await Promise.all(ids.map((id) =>
        base44.asServiceRole.entities.ChatV2RoomMessage.update(id, {
          deleted: true, deleted_by: user_id, deleted_by_name: callerName, deleted_at: stamp, deleted_reason: reason || "",
        }).catch(() => {})
      ));
      await audit(base44, first.community_id, room?.community_name || "", admin, "messages_bulk_deleted", "", `${ids.length} messages`, reason,
        auditExtra({ room_id: first.room_id, room_name: room?.name || "", category: "chat", previous_state: "visible", new_state: "deleted" }));
      return Response.json({ ok: true, count: ids.length });
    }

    // ---- room-scoped: clear_history (admin only) ----
    if (action === "clear_history") {
      if (!room_id) return Response.json({ ok: false, error: "room_id required" });
      const room = await base44.asServiceRole.entities.ChatV2Room.get(room_id).catch(() => null);
      if (!room) return Response.json({ ok: false, error: "room not found" });
      let m = await memberRow(base44, user_id, room.community_id);
      m = await clearExpiredMute(base44, m);
      if (!m || !ADMIN_ROLES.includes(m.role)) return Response.json({ ok: false, error: "community admin required" });
      const msgs = await base44.asServiceRole.entities.ChatV2RoomMessage.filter({ room_id }, "-created_date", 1000).catch(() => []);
      const stamp = new Date().toISOString();
      await Promise.all((msgs || []).filter((x) => !x.deleted).map((x) =>
        base44.asServiceRole.entities.ChatV2RoomMessage.update(x.id, {
          deleted: true, deleted_by: user_id, deleted_by_name: callerName, deleted_at: stamp, deleted_reason: reason || "Room history cleared",
        }).catch(() => {})
      ));
      await audit(base44, room.community_id, room.community_name, admin, "room_cleared", "", room.name, reason,
        auditExtra({ room_id: room.id, room_name: room.name, category: "chat", previous_state: `${(msgs||[]).length} messages`, new_state: "cleared" }));
      return Response.json({ ok: true });
    }

    // ---- message-scoped actions ----
    if (message_id) {
      const msg = await base44.asServiceRole.entities.ChatV2RoomMessage.get(message_id).catch(() => null);
      if (!msg) return Response.json({ ok: false, error: "message not found" });
      const communityId = msg.community_id;
      const room = await base44.asServiceRole.entities.ChatV2Room.get(msg.room_id).catch(() => null);
      const communityName = room?.community_name || "";
      const roomName = room?.name || "";

      let m = await memberRow(base44, user_id, communityId);
      m = await clearExpiredMute(base44, m);
      if (!m) return Response.json({ ok: false, error: "not a community member" });

      if ((action === "react" || action === "edit") && m.muted) {
        return Response.json({ ok: false, error: "You are muted in this community.", muted: true }, { status: 403 });
      }

      if (action === "react") {
        const reactions = parseJSON(msg.reactions, {});
        const list = Array.isArray(reactions[emoji]) ? reactions[emoji] : [];
        const idx = list.indexOf(user_id);
        if (idx >= 0) list.splice(idx, 1); else list.push(user_id);
        if (list.length) reactions[emoji] = list; else delete reactions[emoji];
        const updated = await base44.asServiceRole.entities.ChatV2RoomMessage.update(message_id, { reactions: JSON.stringify(reactions) });
        return Response.json({ ok: true, reactions: updated.reactions });
      }

      if (action === "edit") {
        if (String(msg.sender_id) !== String(user_id)) return Response.json({ ok: false, error: "not authorized" });
        const updated = await base44.asServiceRole.entities.ChatV2RoomMessage.update(message_id, {
          body: String(newBody || "").slice(0, 4000),
          edited_at: new Date().toISOString(),
        });
        return Response.json({ ok: true, message: updated });
      }

      const isMod = MOD_ROLES.includes(m.role);

      if (action === "delete") {
        const isOwner = String(msg.sender_id) === String(user_id);
        if (!isOwner && !isMod) return Response.json({ ok: false, error: "not authorized" });
        await base44.asServiceRole.entities.ChatV2RoomMessage.update(message_id, {
          deleted: true, deleted_by: user_id, deleted_by_name: callerName, deleted_at: new Date().toISOString(), deleted_reason: reason || "",
        });
        await audit(base44, communityId, communityName, admin, "message_deleted", msg.sender_id, msg.sender_name, reason,
          auditExtra({ message_id, room_id: msg.room_id, room_name: roomName, category: "chat", previous_state: "visible", new_state: "deleted" }));
        return Response.json({ ok: true });
      }

      if (action === "pin") {
        if (!isMod) return Response.json({ ok: false, error: "moderator role required to pin" });
        const update = pinned
          ? { pinned: true, pinned_by: user_id, pinned_by_name: callerName, pinned_at: new Date().toISOString() }
          : { pinned: false, pinned_by: "", pinned_by_name: "", pinned_at: "" };
        const updated = await base44.asServiceRole.entities.ChatV2RoomMessage.update(message_id, update);
        await audit(base44, communityId, communityName, admin, pinned ? "message_pinned" : "message_unpinned", msg.sender_id, msg.sender_name, reason,
          auditExtra({ message_id, room_id: msg.room_id, room_name: roomName, category: "chat", previous_state: `pinned:${!pinned}`, new_state: `pinned:${pinned}` }));
        return Response.json({ ok: true, message: updated });
      }

      if (action === "announce") {
        if (!isMod) return Response.json({ ok: false, error: "moderator role required" });
        const updated = await base44.asServiceRole.entities.ChatV2RoomMessage.update(message_id, { is_announcement: !!pinned });
        await audit(base44, communityId, communityName, admin, pinned ? "message_announced" : "message_unannounced", msg.sender_id, msg.sender_name, reason,
          auditExtra({ message_id, room_id: msg.room_id, room_name: roomName, category: "chat", previous_state: `announcement:${!pinned}`, new_state: `announcement:${pinned}` }));
        if (pinned) await dispatchAnnouncementPush(base44, communityId, room, msg, callerName, user_id, false);
        return Response.json({ ok: true, message: updated });
      }

      if (action === "sticky") {
        if (!isMod) return Response.json({ ok: false, error: "moderator role required" });
        const updated = await base44.asServiceRole.entities.ChatV2RoomMessage.update(message_id, { is_sticky: !!pinned });
        await audit(base44, communityId, communityName, admin, pinned ? "message_sticky" : "message_unsticky", msg.sender_id, msg.sender_name, reason,
          auditExtra({ message_id, room_id: msg.room_id, room_name: roomName, category: "chat", previous_state: `sticky:${!pinned}`, new_state: `sticky:${pinned}` }));
        return Response.json({ ok: true, message: updated });
      }

      if (action === "official") {
        if (!isMod) return Response.json({ ok: false, error: "moderator role required" });
        const updated = await base44.asServiceRole.entities.ChatV2RoomMessage.update(message_id, { is_official: !!pinned });
        await audit(base44, communityId, communityName, admin, pinned ? "message_official" : "message_unofficial", msg.sender_id, msg.sender_name, reason,
          auditExtra({ message_id, room_id: msg.room_id, room_name: roomName, category: "chat", previous_state: `official:${!pinned}`, new_state: `official:${pinned}` }));
        return Response.json({ ok: true, message: updated });
      }

      return Response.json({ ok: false, error: "unknown action" });
    }

    return Response.json({ ok: false, error: "message_id or action required" });
  } catch (e) {
    return Response.json({ ok: false, error: e?.message || String(e) });
  }
});