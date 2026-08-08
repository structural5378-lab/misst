import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { dispatchNotifications } from "../../shared/notifications.ts";

// Entity automation: fires when a ChatV2Message is created.
//
// 1. Updates the conversation's last_message_* fields (conversation-list preview).
// 2. Increments unread_count for every other participant.
// 3. Dispatches an FCM push (type "direct_message") to participants who are NOT
//    actively viewing this conversation (ChatV2Presence.active_conversation_id
//    within the 60s heartbeat window). Active viewers get the message via the
//    realtime subscription and are suppressed to avoid duplicate alerts.
//
// Realtime delivery itself happens through entity subscriptions (create event);
// this function only handles metadata + offline/background push.
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const body = await req.json().catch(() => ({}));
  const msg = body.data || body;
  if (!msg || !msg.conversation_id || !msg.sender_id) {
    return Response.json({ ok: true, skipped: "no-data" });
  }
  try {
    const conversationId = String(msg.conversation_id);
    const senderId = String(msg.sender_id);
    const messageId = msg.id ? String(msg.id) : "";
    const preview = (msg.body || "").slice(0, 120);
    const senderName = msg.sender_name || "Someone";
    const senderAvatar = msg.sender_avatar || "";
    const now = new Date().toISOString();

    // 1) Update conversation last-message metadata.
    try {
      await base44.asServiceRole.entities.ChatV2Conversation.update(conversationId, {
        last_message_id: messageId,
        last_message_preview: preview,
        last_message_at: now,
        last_sender_id: senderId,
        last_sender_name: senderName,
        last_sender_avatar: senderAvatar,
      });
    } catch { /* best-effort */ }

    // 2) Increment unread for every other active participant.
    const participants = await base44.asServiceRole.entities.ChatV2Participant
      .filter({ conversation_id: conversationId, left: false }, "-joined_at", 200)
      .catch(() => []);
    const otherParticipants = (participants || []).filter(
      (p) => String(p.user_id) && String(p.user_id) !== senderId
    );
    if (otherParticipants.length) {
      try {
        await base44.asServiceRole.entities.ChatV2Participant.updateMany(
          { conversation_id: conversationId, left: false, user_id: { $ne: senderId } },
          { $inc: { unread_count: 1 } }
        );
      } catch { /* best-effort */ }
    }

    // 3) Push to participants NOT actively viewing this conversation.
    let recipientIds = [...new Set(otherParticipants.map((p) => String(p.user_id)).filter(Boolean))];
    if (!recipientIds.length) {
      return Response.json({ ok: true, recipients: 0, pushed: 0 });
    }

    const presence = await base44.asServiceRole.entities.ChatV2Presence
      .filter({ active_conversation_id: conversationId }, "-last_heartbeat", 500)
      .catch(() => []);
    const sixtySecAgo = new Date(Date.now() - 60_000).toISOString();
    const viewing = new Set(
      (presence || [])
        .filter((p) => p.user_id && p.last_heartbeat && p.last_heartbeat >= sixtySecAgo)
        .map((p) => String(p.user_id))
    );
    recipientIds = recipientIds.filter((id) => !viewing.has(id));
    if (!recipientIds.length) {
      return Response.json({ ok: true, recipients: otherParticipants.length, pushed: 0, suppressed: otherParticipants.length });
    }

    const result = await dispatchNotifications(base44, {
      type: "direct_message",
      title: `New message from ${senderName}`,
      message: preview,
      recipient_ids: recipientIds,
      sender_id: senderId,
      sender_name: senderName,
      related_object_id: conversationId,
      related_object_type: "chat_v2_conversation",
      image: senderAvatar,
      link: `/messages?dm=${conversationId}`,
      metadata: JSON.stringify({ conversation_id: conversationId, chat_v2: true }),
      skip_sender: true,
    });

    return Response.json({
      ok: true,
      recipients: otherParticipants.length,
      pushed: recipientIds.length,
      suppressed: viewing.size,
      created: result?.created || 0,
    });
  } catch (e) {
    return Response.json({ ok: false, error: e?.message || String(e) });
  }
});