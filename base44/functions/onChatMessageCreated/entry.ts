import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { dispatchNotifications } from "../../shared/notifications.ts";

// Entity automation: fires when a ChatMessage is created in a community chat.
// Emits a community_chat notification to every eligible community member (minus
// the sender) via the centralized Notification Service. Honors each recipient's
// "community_chat" preference (push/in-app/sound/vibrate) and the global push
// toggle. Suppresses delivery to members actively viewing that exact community
// chat (ChatPresence.active_chat_community_id within the heartbeat window).
// Groups rapid successive messages so only one push fires per 60s window per
// recipient+community, updating the existing in-app notification in place.
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const body = await req.json().catch(() => ({}));
  const msg = body.data || body;
  if (!msg || !msg.community_id || !msg.sender_uid) {
    return Response.json({ ok: true, skipped: "no-data" });
  }
  try {
    const senderId = String(msg.sender_uid);
    const communityId = String(msg.community_id);
    const communityName = msg.community_name || "Community";

    // Resolve community slug for the deep link (/c/{slug}/chat).
    let communitySlug = "";
    try {
      const c = await base44.asServiceRole.entities.Community.get(communityId);
      communitySlug = c?.slug || "";
    } catch { /* deep link falls back to /live-chat */ }

    // Eligible recipients: active community members, minus the sender.
    const members = await base44.asServiceRole.entities.CommunityMember
      .filter({ community_id: communityId, status: "active" }, "-joined_date", 500)
      .catch(() => []);
    let recipientIds = [...new Set(
      (members || []).map((m) => String(m.user_id)).filter(Boolean)
    )].filter((id) => id && id !== senderId);
    if (!recipientIds.length) return Response.json({ ok: true, skipped: "no-recipients" });

    // Active-view suppression: skip members whose ChatPresence shows they are
    // viewing this exact community chat (flag set + heartbeat within 90s).
    const presence = await base44.asServiceRole.entities.ChatPresence
      .filter({ active_chat_community_id: communityId }, "-last_active", 500)
      .catch(() => []);
    const ninetySecAgo = new Date(Date.now() - 90_000).toISOString();
    const viewing = new Set(
      (presence || [])
        .filter((p) => p.user_uid && p.last_active && p.last_active >= ninetySecAgo)
        .map((p) => String(p.user_uid))
    );
    recipientIds = recipientIds.filter((id) => !viewing.has(id));
    if (!recipientIds.length) return Response.json({ ok: true, skipped: "all-viewing", recipients: 0 });

    const preview = (msg.content || "").slice(0, 100);
    const senderName = msg.sender_name || "Someone";
    const senderAvatar = msg.sender_avatar || "";
    const messageId = msg.id ? String(msg.id) : "";

    // Grouping: find any unread community_chat notification for each recipient +
    // this community created within the last 60s. Fetch once for the community,
    // then bucket per recipient in memory.
    const GROUP_WINDOW_MS = 60_000;
    const recentAll = await base44.asServiceRole.entities.Notification
      .filter({ type: "community_chat", community_id: communityId, read: false }, "-created_date", 500)
      .catch(() => []);
    const now = Date.now();
    const recentByRecipient = new Map();
    for (const r of (recentAll || [])) {
      if (!r.recipient_id) continue;
      const cd = r.created_date ? new Date(r.created_date).getTime() : 0;
      if (now - cd >= GROUP_WINDOW_MS) continue;
      const existing = recentByRecipient.get(String(r.recipient_id));
      if (!existing || (r.created_date > existing.created_date)) {
        recentByRecipient.set(String(r.recipient_id), r);
      }
    }

    const freshRecipients = [];
    const groupUpdates = [];
    for (const recipientId of recipientIds) {
      const groupedRec = recentByRecipient.get(recipientId);
      if (groupedRec) groupUpdates.push({ recipientId, groupedRec });
      else freshRecipients.push(recipientId);
    }

    let freshCreated = 0;
    if (freshRecipients.length) {
      const result = await dispatchNotifications(base44, {
        type: "community_chat",
        title: "New Community Message",
        message: `${senderName}: "${preview}"`,
        recipient_ids: freshRecipients,
        sender_id: senderId,
        sender_name: senderName,
        related_object_id: messageId,
        related_object_type: "chat_message",
        community_id: communityId,
        image: senderAvatar,
        metadata: JSON.stringify({
          community_slug: communitySlug,
          community_name: communityName,
          sender_avatar: senderAvatar,
          count: 1,
          senders: [senderName],
          last_sender: senderName,
          latest_message_id: messageId,
          message_preview: preview,
        }),
        skip_sender: true,
      });
      freshCreated = result?.created || 0;
    }

    // Grouped updates: bump the existing in-app notification (no new push).
    let groupedCount = 0;
    const updateTs = new Date().toISOString();
    for (const { recipientId, groupedRec } of groupUpdates) {
      const meta = safeParse(groupedRec.metadata, {});
      const count = (meta.count || 1) + 1;
      const senders = [...new Set([...(meta.senders || []), senderName])];
      let title, message;
      if (senders.length === 1) {
        title = "New Community Message";
        message = `${senderName}: "${preview}"`;
      } else {
        title = communityName;
        const others = senders.length - 1;
        message = `${senders[senders.length - 1]} and ${others} other${others > 1 ? "s" : ""} sent new messages.`;
      }
      const newMeta = {
        ...meta,
        count,
        senders,
        community_slug: communitySlug,
        community_name: communityName,
        last_sender: senderName,
        latest_message_id: messageId,
        message_preview: preview,
        link: `/c/${communitySlug}/chat`,
      };
      try {
        await base44.asServiceRole.entities.Notification.update(groupedRec.id, {
          title, message,
          image_url: senderAvatar || groupedRec.image_url || "",
          read: false, read_at: null,
          delivered_at: updateTs,
          metadata: JSON.stringify(newMeta),
        });
      } catch { /* best-effort */ }
      // Delivery log for the grouped update (no push — suppressed to avoid spam).
      try {
        await base44.asServiceRole.entities.NotificationDelivery.create({
          notification_id: groupedRec.id,
          recipient_id: recipientId,
          type: "community_chat",
          title,
          status: "delivered",
          attempts: 0,
          max_attempts: 5,
          token_count: 0,
          platforms: JSON.stringify(["web"]),
          delivered_at: updateTs,
        });
      } catch { /* best-effort */ }
      groupedCount++;
    }

    return Response.json({
      ok: true,
      recipients: recipientIds.length,
      fresh_created: freshCreated,
      grouped: groupedCount,
    });
  } catch (e) {
    return Response.json({ ok: false, error: e?.message || String(e) });
  }
});

function safeParse(v, fallback) {
  if (!v) return fallback;
  try { return JSON.parse(v); } catch { return fallback; }
}