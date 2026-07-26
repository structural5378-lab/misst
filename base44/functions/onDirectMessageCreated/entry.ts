import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { dispatchNotifications } from "../../shared/notifications.ts";

// Entity automation: fires when a DMMessage is created.
// Emits a direct_message notification to every other participant in the
// conversation ("New message from <sender>."). Tap opens the Messages screen.
// The centralized service honors User.notif_settings (messages category + push
// channel) and writes/logs delivery.
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const body = await req.json().catch(() => ({}));
  const msg = body.data || body;
  if (!msg || !msg.conversation_id || msg.is_deleted) {
    return Response.json({ ok: true, skipped: true });
  }
  try {
    const participants = await base44.asServiceRole.entities.ConversationParticipant
      .filter({ conversation_id: msg.conversation_id }, "-joined_at", 50)
      .catch(() => []);
    const recipientIds = [...new Set(
      (participants || [])
        .map((p) => String(p.user_id))
        .filter((id) => id && id !== String(msg.sender_id))
    )];
    if (!recipientIds.length) return Response.json({ ok: true, skipped: "no-recipients" });

    const preview = (msg.content || "").slice(0, 120);
    const result = await dispatchNotifications(base44, {
      type: "direct_message",
      title: `New message from ${msg.sender_name || "Someone"}`,
      message: preview,
      recipient_ids: recipientIds,
      sender_id: String(msg.sender_id || ""),
      sender_name: msg.sender_name || "",
      related_object_id: msg.conversation_id,
      related_object_type: "conversation",
      metadata: JSON.stringify({ conversation_id: msg.conversation_id }),
      image: msg.image_url || "",
      skip_sender: true,
    });
    return Response.json({ ok: true, result });
  } catch (e) {
    return Response.json({ ok: false, error: e?.message || String(e) });
  }
});