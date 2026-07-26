import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

// roomMessageAction — service-role operations on ChatV2RoomMessage that RLS
// can't express: reactions (any member), pin/unpin (community admin),
// edit (sender), delete (sender or admin). Verifies membership/role via
// CommunityMember before mutating.
function parseJSON(v, fb) { try { return v ? JSON.parse(v) : fb; } catch { return fb; } }

async function memberRow(base44, userId, communityId) {
  if (!userId) return null;
  const rows = await base44.asServiceRole.entities.CommunityMember
    .filter({ community_id: communityId, user_id: userId, status: "active" }, "-joined_date", 50)
    .catch(() => []);
  return (rows || [])[0] || null;
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const body = await req.json().catch(() => ({}));
  const { action, message_id, user_id, user_name, emoji, pinned, body: newBody } = body;
  if (!message_id || !user_id) return Response.json({ ok: false, error: "message_id and user_id required" });

  try {
    const msg = await base44.asServiceRole.entities.ChatV2RoomMessage.get(message_id).catch(() => null);
    if (!msg) return Response.json({ ok: false, error: "message not found" });
    const communityId = msg.community_id;

    if (action === "react") {
      const m = await memberRow(base44, user_id, communityId);
      if (!m) return Response.json({ ok: false, error: "not a community member" });
      const reactions = parseJSON(msg.reactions, {});
      const list = Array.isArray(reactions[emoji]) ? reactions[emoji] : [];
      const idx = list.indexOf(user_id);
      if (idx >= 0) list.splice(idx, 1); else list.push(user_id);
      if (list.length) reactions[emoji] = list; else delete reactions[emoji];
      const updated = await base44.asServiceRole.entities.ChatV2RoomMessage.update(message_id, { reactions: JSON.stringify(reactions) });
      return Response.json({ ok: true, reactions: updated.reactions });
    }

    if (action === "pin") {
      const m = await memberRow(base44, user_id, communityId);
      const isAdmin = m && ["community_owner", "community_admin"].includes(m.role);
      if (!isAdmin) return Response.json({ ok: false, error: "community admin required to pin" });
      const update = pinned
        ? { pinned: true, pinned_by: user_id, pinned_by_name: user_name || "", pinned_at: new Date().toISOString() }
        : { pinned: false, pinned_by: "", pinned_by_name: "", pinned_at: "" };
      const updated = await base44.asServiceRole.entities.ChatV2RoomMessage.update(message_id, update);
      return Response.json({ ok: true, message: updated });
    }

    if (action === "edit") {
      if (String(msg.sender_id) !== String(user_id)) return Response.json({ ok: false, error: "not authorized" });
      const updated = await base44.asServiceRole.entities.ChatV2RoomMessage.update(message_id, {
        body: String(newBody || "").slice(0, 4000),
        edited_at: new Date().toISOString(),
      });
      return Response.json({ ok: true, message: updated });
    }

    if (action === "delete") {
      const isOwner = String(msg.sender_id) === String(user_id);
      let isAdmin = false;
      if (!isOwner) {
        const m = await memberRow(base44, user_id, communityId);
        isAdmin = m && ["community_owner", "community_admin"].includes(m.role);
      }
      if (!isOwner && !isAdmin) return Response.json({ ok: false, error: "not authorized" });
      await base44.asServiceRole.entities.ChatV2RoomMessage.update(message_id, { deleted: true });
      return Response.json({ ok: true });
    }

    return Response.json({ ok: false, error: "unknown action" });
  } catch (e) {
    return Response.json({ ok: false, error: e?.message || String(e) });
  }
});