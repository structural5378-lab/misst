// MIST Notification Engine — Phase 1 (in-app delivery).
//
// This module is the single source of truth for notification logic. The `notify`
// HTTP service and any other backend function import `dispatchNotifications` to
// emit events. Chat, community, net, and badge modules never implement their own
// notification logic — they route through here.
//
// Delivery is pluggable: today `deliver()` is an in-app no-op (the DB record IS
// the in-app delivery). Phase 2 will add FCM push, email, and SMS inside
// `deliver()` without changing any emitter.

export const NOTIF_TYPES = [
  "direct_message",
  "community_chat",
  "community_announcement",
  "friend_request",
  "user_mention",
  "net_starting",
  "emergency_alert",
  "badge_earned",
  "community_invite",
  "system",
];

function parseJSON(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

// Resolve a user's per-type preference from the parsed notification_preferences object.
// Supports both `false` (disable all channels) and `{ push: false, inapp: true }`.
export function isTypeEnabled(prefs, type) {
  if (!prefs || typeof prefs !== "object") return true;
  const v = prefs[type];
  if (v === false) return false;
  if (v === true) return true;
  if (typeof v === "object" && v !== null) {
    if (v.inapp === false) return false;
    return true;
  }
  return true; // default: enabled
}

// Resolve a deep-link route from the event type + related object + metadata.
export function resolveLink(event) {
  if (event.link) return event.link;
  const meta = parseJSON(event.metadata, {});
  const rid = event.related_object_id ? String(event.related_object_id) : "";
  switch (event.type) {
    case "direct_message":
      return "/messages";
    case "community_chat":
      return meta.community_slug ? `/c/${meta.community_slug}/chat` : "/live-chat";
    case "community_announcement":
    case "community_invite":
      return meta.community_slug ? `/c/${meta.community_slug}` : "/my-communities";
    case "friend_request":
      return "/members";
    case "user_mention":
      return event.related_object_type === "thread" && rid
        ? `/community/thread/${rid}`
        : "/community-forum";
    case "net_starting":
      return rid ? `/nets/${rid}/display` : "/nets";
    case "emergency_alert":
      return "/alerts";
    case "badge_earned":
      return "/achievements";
    default:
      return "/notifications";
  }
}

// Fetch user records for a set of ids (for preference resolution + name lookup).
// Small sets: parallel get. Large sets: batched list + in-memory match.
async function fetchUsers(base44, ids) {
  const set = new Set(ids.filter(Boolean));
  if (set.size === 0) return [];
  if (set.size <= 50) {
    const results = await Promise.all(
      [...set].map((id) =>
        base44.asServiceRole.entities.User.get(id).catch(() => null)
      )
    );
    return results.filter(Boolean);
  }
  const all = [];
  const batch = 500;
  for (let i = 0; i < 20; i++) {
    const chunk = await base44.asServiceRole.entities.User.list(
      "-last_active",
      batch,
      i * batch
    );
    if (!chunk || chunk.length === 0) break;
    all.push(...chunk.filter((u) => set.has(u.id)));
    if (chunk.length < batch) break;
  }
  return all;
}

// Resolve the recipient list for an event.
// Explicit recipient_ids win; otherwise fan out to all active community members.
async function resolveRecipients(base44, event) {
  if (Array.isArray(event.recipient_ids) && event.recipient_ids.length > 0) {
    return [...new Set(event.recipient_ids.map(String).filter(Boolean))];
  }
  if (event.community_id) {
    const chunk = await base44.asServiceRole.entities.CommunityMember.filter(
      { community_id: event.community_id, status: "active" },
      "-joined_date",
      500
    );
    const ids = (chunk || []).map((m) => String(m.user_id)).filter(Boolean);
    return [...new Set(ids)];
  }
  return [];
}

// Pluggable delivery hook. Phase 1: in-app only (record already created).
// Phase 2 will route to FCM push / email / SMS here based on prefs + channels.
// We return per-channel delivery metadata that gets merged into the record.
async function deliver(record, recipient) {
  // No-op for in-app. Future: const channels = resolveChannels(recipient, record.type);
  return {
    delivered_at: record.delivered_at,
    delivery: { inapp: "delivered", push: "pending", email: "pending", sms: "pending" },
  };
}

// Main entry: dispatch a notification event to all eligible recipients.
//
// event: {
//   type, title, message,
//   sender_id?, sender_name?,
//   recipient_ids?: string[],   // explicit recipients
//   community_id?: string,      // OR fan out to active members of this community
//   related_object_id?, related_object_type?,
//   link?, metadata?,            // metadata may be an object or JSON string
//   skip_sender?: boolean        // exclude sender from community fanout
// }
export async function dispatchNotifications(base44, event) {
  if (!NOTIF_TYPES.includes(event.type)) {
    throw new Error(`Unknown notification type: ${event.type}`);
  }

  const recipients = await resolveRecipients(base44, event);
  if (recipients.length === 0) return { created: 0, recipients: [] };

  const users = await fetchUsers(base44, recipients);
  const userMap = new Map(users.map((u) => [u.id, u]));

  const senderId = event.sender_id ? String(event.sender_id) : "";
  const now = new Date().toISOString();
  const baseMeta =
    typeof event.metadata === "string" ? parseJSON(event.metadata, {}) : event.metadata || {};
  const link = resolveLink(event);

  const records = [];
  for (const recipientId of recipients) {
    if (event.skip_sender && recipientId === senderId) continue;
    const recipient = userMap.get(recipientId);
    const prefs = parseJSON(recipient?.notification_preferences, {});
    if (!isTypeEnabled(prefs, event.type)) continue;

    const base = {
      recipient_id: recipientId,
      recipient_name:
        recipient?.display_name || recipient?.full_name || recipient?.username || "",
      sender_id: senderId,
      sender_name: event.sender_name || "",
      type: event.type,
      title: event.title || "",
      message: event.message || "",
      related_object_id: event.related_object_id ? String(event.related_object_id) : "",
      related_object_type: event.related_object_type || "",
      read: false,
      delivered_at: now,
      community_id: event.community_id ? String(event.community_id) : "",
      link,
      metadata: "",
    };

    // Pluggable delivery — record the per-channel state for future phases.
    const delivery = await deliver(base, recipient);
    base.metadata = JSON.stringify({ ...baseMeta, link, delivery: delivery.delivery });
    base.delivered_at = delivery.delivered_at;

    records.push(base);
  }

  if (records.length === 0) return { created: 0, recipients: [] };

  const created = [];
  for (let i = 0; i < records.length; i += 500) {
    const batch = records.slice(i, i + 500);
    const res = await base44.asServiceRole.entities.Notification.bulkCreate(batch);
    if (Array.isArray(res)) created.push(...res);
  }
  return { created: created.length, recipients };
}