import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

// sendRoomMessage — the single server-side gate for posting to a community
// room. Enforces (server-side, never client-side):
//   • Active community membership
//   • Mute status (with automatic expiry clearing)
//   • Room lock (non-admins blocked)
//   • Read-only / admin-only rooms (non-admins blocked)
//   • Slow-mode per-user cooldown (ChatV2RoomMembership.last_sent_at)
// Creates the message with the service role and returns it so the client can
// reconcile its optimistic placeholder. The onRoomMessageCreated automation
// still handles last-message + unread + notifications.

const ADMIN_ROLES = ["community_owner", "community_admin"];

async function getMember(base44, userId, communityId) {
  if (!userId) return null;
  const rows = await base44.asServiceRole.entities.CommunityMember
    .filter({ community_id: communityId, user_id: userId }, "-joined_date", 50)
    .catch(() => []);
  return (rows || [])[0] || null;
}

// Auto-clear an expired mute so chat access is restored without admin action.
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

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const room_id = String(body.room_id || "");
    const text = String(body.body || body.text || "").trim();
    // Attachments: accept either a pre-parsed array or a JSON string.
    let attachments = [];
    if (Array.isArray(body.attachments)) attachments = body.attachments;
    else if (typeof body.attachments === "string" && body.attachments) {
      try { attachments = JSON.parse(body.attachments); } catch { attachments = []; }
    }
    if (!room_id) return Response.json({ error: "room_id required" }, { status: 400 });
    if (!text && !attachments.length) return Response.json({ error: "Message is empty" }, { status: 400 });

    const room = await base44.asServiceRole.entities.ChatV2Room.get(room_id).catch(() => null);
    if (!room) return Response.json({ error: "Room not found" }, { status: 404 });
    const communityId = room.community_id;

    let member = await getMember(base44, user.id, communityId);
    if (!member || member.status !== "active") {
      return Response.json({ error: "You are not an active member of this community" }, { status: 403 });
    }
    member = await clearExpiredMute(base44, member);

    // Mute enforcement.
    if (member.muted) {
      const until = member.muted_until ? new Date(member.muted_until) : null;
      return Response.json(
        {
          error: until ? `You have been muted by the community administration until ${until.toISOString()}.` : "You have been permanently muted in this community.",
          muted: true,
          muted_until: member.muted_until || "",
        },
        { status: 403 }
      );
    }

    const isAdmin = ADMIN_ROLES.includes(member.role);

    if (room.is_locked && !isAdmin) return Response.json({ error: "This room is locked." }, { status: 403 });
    if (room.is_archived) return Response.json({ error: "This room is archived." }, { status: 403 });
    if (room.type === "readonly" && !isAdmin) return Response.json({ error: "This room is read-only." }, { status: 403 });
    if (room.type === "admin" && !isAdmin) return Response.json({ error: "Only admins can post in this room." }, { status: 403 });

    // Slow mode (per-user cooldown).
    if (room.slow_mode_seconds && room.slow_mode_seconds > 0 && !isAdmin) {
      const now = Date.now();
      const last = member.last_sent_at ? new Date(member.last_sent_at).getTime() : 0;
      const elapsedSec = Math.floor((now - last) / 1000);
      const wait = room.slow_mode_seconds - elapsedSec;
      if (wait > 0) {
        return Response.json({ error: `Slow mode is active. Try again in ${wait}s.`, slow_mode: wait }, { status: 429 });
      }
    }

    // Derive message_type from attachment if not explicitly provided.
    const messageType = body.message_type || (attachments.length
      ? ((attachments[0]?.type || "").startsWith("image/") ? "image" : "file")
      : "text");

    const created = await base44.asServiceRole.entities.ChatV2RoomMessage.create({
      room_id,
      community_id: communityId,
      community_slug: room.community_slug || "",
      room_name: room.name || "",
      sender_id: user.id,
      sender_name: user.full_name || user.email || "",
      sender_avatar: user.avatar_url || "",
      sender_role: member.role,
      body: text.slice(0, 4000),
      message_type: messageType,
      attachments: JSON.stringify(attachments),
      reactions: "",
      mentions: typeof body.mentions === "string" ? body.mentions : JSON.stringify(body.mentions || []),
      reply_to_message_id: body.reply_to_message_id || "",
      reply_to_preview: (body.reply_to_preview || "").slice(0, 120),
      reply_to_sender_id: body.reply_to_sender_id || "",
      reply_to_sender_name: body.reply_to_sender_name || "",
      status: "sent",
    });

    // Record per-user slow-mode cooldown.
    if (room.slow_mode_seconds && room.slow_mode_seconds > 0) {
      const mems = await base44.asServiceRole.entities.ChatV2RoomMembership
        .filter({ room_id, user_id: user.id }).catch(() => []);
      const mem = (mems || [])[0];
      if (mem) {
        await base44.asServiceRole.entities.ChatV2RoomMembership
          .update(mem.id, { last_sent_at: new Date().toISOString() }).catch(() => {});
      }
    }

    return Response.json({ ok: true, message: created });
  } catch (e) {
    return Response.json({ error: e?.message || String(e) }, { status: 500 });
  }
});