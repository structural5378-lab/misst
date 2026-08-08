import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { dispatchNotifications } from "../../shared/notifications.ts";

// onRoomMessageCreated — entity automation fired when a ChatV2RoomMessage is
// created. Responsibilities:
//  1. Update the room's last-message metadata.
//  2. Increment unread_count on existing memberships (excludes the sender).
//  3. Dispatch notifications: reply → community_chat; mentions → user_mention;
//     emergency room → emergency_alert; admin/event room broadcast →
//     community_announcement. Honors per-user preferences via dispatchNotifications.

function parseMentions(body) {
  const out = { everyone: false, admins: false, moderators: false, names: [] as string[] };
  if (!body) return out;
  out.everyone = /@everyone\b/i.test(body);
  out.admins = /@admins?\b/i.test(body);
  out.moderators = /@moderators?\b/i.test(body);
  const matches = [...body.matchAll(/@([a-zA-Z0-9_.\s-]{2,40})/g)]
    .map((m) => m[1].trim())
    .filter((n) => n && !["everyone", "admin", "admins", "moderator", "moderators"].includes(n.toLowerCase()));
  out.names = [...new Set(matches)];
  return out;
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const body = await req.json().catch(() => ({}));
  const msg = body.data || body;
  if (!msg || !msg.room_id) return Response.json({ ok: true, skipped: true });

  try {
    const communityId = String(msg.community_id || "");
    const senderId = String(msg.sender_id || "");

    // 1) Room last message
    await base44.asServiceRole.entities.ChatV2Room.update(msg.room_id, {
      last_message_id: String(msg.id || ""),
      last_message_preview: (msg.body || "").slice(0, 120),
      last_message_at: new Date().toISOString(),
      last_sender_id: senderId,
      last_sender_name: msg.sender_name || "",
      last_sender_avatar: msg.sender_avatar || "",
    }).catch(() => {});

    // 2) Unread increment for existing memberships (exclude sender)
    await base44.asServiceRole.entities.ChatV2RoomMembership.updateMany(
      { room_id: msg.room_id, user_id: { $ne: senderId } },
      { $inc: { unread_count: 1 } }
    ).catch(() => {});

    // 3) Notifications
    const room = await base44.asServiceRole.entities.ChatV2Room.get(msg.room_id).catch(() => null);
    const roomType = room?.type || "text";
    const roomName = room?.name || "Room";
    const slug = room?.community_slug || msg.community_slug || "";
    const link = communityId ? `/messages?c=${communityId}` : "/messages";
    const meta = { community_id: communityId, community_slug: slug, room_id: msg.room_id, room_name: roomName };

    const members = await base44.asServiceRole.entities.CommunityMember
      .filter({ community_id: communityId, status: "active" }, "-joined_date", 500)
      .catch(() => []);
    const memberIds = (members || []).map((m) => String(m.user_id)).filter(Boolean);
    const { everyone, admins, moderators, names } = parseMentions(msg.body);

    const mentioned = new Set<string>();
    const add = (id: string) => { if (id && id !== senderId) mentioned.add(id); };
    if (everyone) memberIds.forEach(add);
    if (admins || moderators) {
      for (const m of members) {
        const r = m.role || "";
        if (admins && ["community_owner", "community_admin"].includes(r)) add(String(m.user_id));
        if (moderators && r === "moderator") add(String(m.user_id));
      }
    }
    if (names.length) {
      for (const m of members) {
        const display = (m.user_name || "").toLowerCase();
        if (display && names.some((n) => display.includes(n.toLowerCase()))) add(String(m.user_id));
      }
    }

    const baseEvt = {
      sender_id: senderId,
      sender_name: msg.sender_name || "",
      related_object_id: msg.room_id,
      related_object_type: "room",
      community_id: communityId,
      link,
      image: msg.sender_avatar || "",
      skip_sender: true,
    };

    // Reply → community_chat to the replied-to sender
    if (msg.reply_to_message_id && msg.reply_to_sender_id) {
      const rid = String(msg.reply_to_sender_id);
      if (rid !== senderId) {
        await dispatchNotifications(base44, {
          ...baseEvt,
          type: "community_chat",
          title: `${msg.sender_name || "Someone"} replied to you in ${roomName}`,
          message: (msg.body || "").slice(0, 160),
          recipient_ids: [rid],
          metadata: JSON.stringify({ ...meta, reply: true }),
        });
      }
    }

    // Mentions → user_mention
    if (mentioned.size) {
      await dispatchNotifications(base44, {
        ...baseEvt,
        type: "user_mention",
        title: `${msg.sender_name || "Someone"} mentioned you in ${roomName}`,
        message: (msg.body || "").slice(0, 160),
        recipient_ids: [...mentioned],
        metadata: JSON.stringify({ ...meta, mention: true }),
      });
    }

    // Emergency room (no mention) → emergency_alert to all members
    if (roomType === "emergency" && !mentioned.size) {
      await dispatchNotifications(base44, {
        ...baseEvt,
        type: "emergency_alert",
        title: `Emergency traffic in ${roomName}`,
        message: (msg.body || "").slice(0, 160),
        recipient_ids: memberIds.filter((id) => id !== senderId),
        metadata: JSON.stringify(meta),
      });
    }

    // Admin/event room broadcast (no mention, no reply) → community_announcement
    if ((roomType === "admin" || roomType === "event") && !mentioned.size && !msg.reply_to_message_id) {
      await dispatchNotifications(base44, {
        ...baseEvt,
        type: "community_announcement",
        title: `${roomName} · ${msg.sender_name || "Admin"}`,
        message: (msg.body || "").slice(0, 160),
        recipient_ids: memberIds.filter((id) => id !== senderId),
        metadata: JSON.stringify(meta),
      });
    }

    // General community chat: EVERY regular text-room message notifies all
    // members (excluding the sender, @mentioned users, and the replied-to
    // sender, who each receive their own dedicated notification above). This
    // closes the gap where ordinary community messages produced no notification
    // at all — now every message drives an in-app record + FCM push + global
    // badge increment for non-active viewers, per the "every message notifies"
    // rule. Emergency/admin/event rooms already broadcast above.
    if (roomType === "text") {
      const replyToId = msg.reply_to_message_id && msg.reply_to_sender_id ? String(msg.reply_to_sender_id) : "";
      const generalRecipients = memberIds.filter(
        (id) => id !== senderId && !mentioned.has(id) && id !== replyToId
      );
      if (generalRecipients.length) {
        await dispatchNotifications(base44, {
          ...baseEvt,
          type: "community_chat",
          title: `${msg.sender_name || "Someone"} in ${roomName}`,
          message: (msg.body || "").slice(0, 160),
          recipient_ids: generalRecipients,
          metadata: JSON.stringify(meta),
        });
      }
    }

    return Response.json({ ok: true, mentioned: mentioned.size });
  } catch (e) {
    return Response.json({ ok: false, error: e?.message || String(e) });
  }
});