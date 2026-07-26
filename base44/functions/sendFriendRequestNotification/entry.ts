import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { dispatchNotifications } from "../../shared/notifications.ts";

// sendFriendRequestNotification — invoked when a user sends a friend request.
// Routes through the centralized Notification Service (type: friend_request) so
// the recipient's "friend_requests" preference is honored (push / in-app / badge
// / delivery log / analytics). The friend_request type, preference key, category
// meta, and deep link are all registered in the shared engine.
//
// Body: { senderId, recipientId, requestId, senderName? }
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const senderId = String(body.senderId || body.sender_id || "");
    const recipientId = String(body.recipientId || body.recipient_id || "");
    const requestId = String(body.requestId || body.request_id || "");
    const senderName = body.senderName || body.sender_name || "Someone";
    if (!recipientId) return Response.json({ error: "recipientId is required" }, { status: 400 });

    const result = await dispatchNotifications(base44, {
      type: "friend_request",
      title: `${senderName} sent you a friend request.`,
      message: "",
      recipient_ids: [recipientId],
      sender_id: senderId,
      sender_name: senderName,
      related_object_id: requestId,
      related_object_type: "friend_request",
      link: "/members",
    });
    return Response.json({ ok: true, result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});