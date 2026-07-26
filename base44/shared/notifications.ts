// MIST Notification Engine — the centralized Notification Service.
//
// Single source of truth for all push/in-app/badge/deeplink logic. Every feature
// routes here via the `notify` endpoint or by calling `dispatchNotifications`.
//
// Per-user, per-category preferences (User.notif_settings):
//   { <categoryKey>: { push, inapp, sound, vibrate } }
// - push=false & inapp=false  => SKIP entirely (no push, no in-app record, no badge)
// - push=true,  inapp=false  => push only (no Notification Center record)
// - push=false, inapp=true   => in-app only (no push)
// - sound/vibrate            => override the category default in the FCM payload
// Emergency alerts are always delivered; only sound/vibrate respect preferences.
// Quiet hours (NotificationPreferences) suppress non-emergency push.

import { NotificationService } from "./notificationService.ts";
import { NOTIF_TYPES, TYPE_TO_PREF_KEY, DEFAULT_NOTIF_SETTINGS, getCategoryMeta } from "./notificationTypes.ts";

export { NOTIF_TYPES };

function parseJSON(value, fallback) {
  if (!value) return fallback;
  try { return JSON.parse(value); } catch { return fallback; }
}

function getNotifSettings(user) {
  const ns = parseJSON(user?.notif_settings, null);
  if (!ns || typeof ns !== "object") return DEFAULT_NOTIF_SETTINGS;
  return { ...DEFAULT_NOTIF_SETTINGS, ...ns };
}

// Resolve per-category channel preferences for a type. Tolerates legacy flat booleans.
function categoryPrefs(ns, type) {
  const key = TYPE_TO_PREF_KEY[type];
  if (!key) return { push: true, inapp: true, sound: true, vibrate: true };
  const v = ns[key];
  if (v == null) return { push: true, inapp: true, sound: true, vibrate: true };
  if (v === false) return { push: false, inapp: false, sound: false, vibrate: false };
  if (v === true) return { push: true, inapp: true, sound: true, vibrate: true };
  if (typeof v === "object") {
    return {
      push: v.push !== false,
      inapp: v.inapp !== false,
      sound: v.sound !== false,
      vibrate: v.vibrate !== false,
    };
  }
  return { push: true, inapp: true, sound: true, vibrate: true };
}

export function isTypeEnabled(prefs, type) {
  if (!prefs || typeof prefs !== "object") return true;
  const v = prefs[type];
  if (v === false) return false;
  if (v === true) return true;
  if (typeof v === "object" && v !== null) {
    if (v.inapp === false && v.push === false) return false;
    return true;
  }
  return true;
}

export function resolveLink(event) {
  if (event.link) return event.link;
  const meta = parseJSON(event.metadata, {});
  const rid = event.related_object_id ? String(event.related_object_id) : "";
  switch (event.type) {
    case "direct_message": return "/messages";
    case "community_chat": return meta.community_slug ? `/c/${meta.community_slug}/chat` : "/live-chat";
    case "community_announcement":
    case "community_invite": return meta.community_slug ? `/c/${meta.community_slug}` : "/my-communities";
    case "friend_request": return "/members";
    case "user_mention": return event.related_object_type === "thread" && rid ? `/community/thread/${rid}` : "/community-forum";
    case "forum_reply": return rid ? `/community/thread/${rid}` : "/community-forum";
    case "net_starting": return rid ? `/nets/${rid}/display` : "/nets";
    case "net_ended": return "/nets";
    case "mission_control": return rid ? `/nets/${rid}/control` : "/nets";
    case "radioscope_nearby": return "/radioscope";
    case "emergency_alert": return "/alerts";
    case "weather_alert": return "/weather";
    case "ai_assistant": return "/notifications";
    case "event_reminder": return meta.community_slug ? `/c/${meta.community_slug}/events` : "/alerts";
    case "news": return "/notifications";
    case "repeater_added": return rid ? `/repeaters/${rid}` : "/repeaters";
    case "achievement_unlocked":
    case "badge_earned": return "/achievements";
    default: return "/notifications";
  }
}

async function fetchUsers(base44, ids) {
  const set = new Set(ids.filter(Boolean));
  if (set.size === 0) return [];
  if (set.size <= 50) {
    const results = await Promise.all(
      [...set].map((id) => base44.asServiceRole.entities.User.get(id).catch(() => null))
    );
    return results.filter(Boolean);
  }
  const all = [];
  const batch = 500;
  for (let i = 0; i < 20; i++) {
    const chunk = await base44.asServiceRole.entities.User.list("-last_active", batch, i * batch);
    if (!chunk || chunk.length === 0) break;
    all.push(...chunk.filter((u) => set.has(u.id)));
    if (chunk.length < batch) break;
  }
  return all;
}

async function resolveRecipients(base44, event) {
  if (Array.isArray(event.recipient_ids) && event.recipient_ids.length > 0) {
    return [...new Set(event.recipient_ids.map(String).filter(Boolean))];
  }
  if (event.community_id) {
    const chunk = await base44.asServiceRole.entities.CommunityMember.filter(
      { community_id: event.community_id, status: "active" }, "-joined_date", 500
    );
    return [...new Set((chunk || []).map((m) => String(m.user_id)).filter(Boolean))];
  }
  return [];
}

async function fetchTokensByUser(base44, recipientIds) {
  const idSet = new Set(recipientIds.filter(Boolean).map(String));
  const map = new Map();
  if (idSet.size === 0) return map;
  let all = [];
  try {
    all = await base44.asServiceRole.entities.DeviceToken.filter({ is_active: true }, "-created_date", 2000);
  } catch { all = []; }
  if (!Array.isArray(all)) all = [];
  for (const t of all) {
    if (!t.token || !t.user_id) continue;
    const uid = String(t.user_id);
    if (!idSet.has(uid)) continue;
    if (!map.has(uid)) map.set(uid, []);
    map.get(uid).push(t.token);
  }
  return map;
}

async function fetchPreferences(base44, recipientIds) {
  const map = new Map();
  if (!recipientIds || recipientIds.length === 0) return map;
  let rows = [];
  try { rows = await base44.asServiceRole.entities.NotificationPreferences.filter({}, "-created_date", 2000); }
  catch { rows = []; }
  const idSet = new Set(recipientIds.map(String));
  for (const r of rows || []) {
    if (r.user_id && idSet.has(String(r.user_id))) map.set(String(r.user_id), r);
  }
  return map;
}

function isQuietHours(pref, now = new Date()) {
  if (!pref || !pref.quiet_hours_start || !pref.quiet_hours_end) return false;
  if (pref.quiet_hours_start === pref.quiet_hours_end) return false;
  try {
    const tz = pref.quiet_hours_timezone || "America/New_York";
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(now);
    const h = parseInt(parts.find((p) => p.type === "hour")?.value || "0", 10) % 24;
    const m = parseInt(parts.find((p) => p.type === "minute")?.value || "0", 10);
    const cur = h * 60 + m;
    const [sh, sm] = pref.quiet_hours_start.split(":").map((n) => parseInt(n, 10));
    const [eh, em] = pref.quiet_hours_end.split(":").map((n) => parseInt(n, 10));
    const start = sh * 60 + sm, end = eh * 60 + em;
    if (start < end) return cur >= start && cur < end;
    return cur >= start || cur < end;
  } catch { return false; }
}

function buildEnrichedPayload(record, meta) {
  const icon = "https://insomniacsgmrs.com/uploads/mist-icon.png";
  const extra = parseJSON(record.metadata, {});
  const payload: any = {
    notification: { title: record.title || "MIST", body: record.message || "" },
    data: {
      link: String(record.link || "/notifications"),
      type: String(record.type || "system"),
      community_id: String(record.community_id || ""),
      tag: meta.tag || String(record.type || "mist"),
      color: meta.color || "",
      image: extra.image || "",
      requireInteraction: meta.requireInteraction ? "1" : "0",
      vibrate: meta.vibrate ? meta.vibrate.join(",") : "",
    },
    android: { notification: { icon, sound: meta.sound ? "default" : undefined, tag: meta.tag, color: meta.color } },
    apns: { payload: { aps: { sound: meta.sound ? "default" : undefined, "mutable-content": 1 } } },
    webpush: {
      notification: { icon, badge: icon, tag: meta.tag, requireInteraction: !!meta.requireInteraction, vibrate: meta.vibrate || undefined },
      fcm_options: { link: String(record.link || "/notifications") },
    },
  };
  if (extra.image) payload.notification.image = extra.image;
  return payload;
}

async function purgeInvalidTokens(base44, tokens) {
  if (!tokens || tokens.length === 0) return 0;
  try {
    await base44.asServiceRole.entities.DeviceToken.updateMany({ token: { $in: tokens } }, { $set: { is_active: false } }).catch(() => {});
    return tokens.length;
  } catch { return 0; }
}

export async function dispatchNotifications(base44, event) {
  if (!NOTIF_TYPES.includes(event.type)) throw new Error(`Unknown notification type: ${event.type}`);

  const recipients = await resolveRecipients(base44, event);
  if (recipients.length === 0) return { created: 0, recipients: [] };

  const users = await fetchUsers(base44, recipients);
  const userMap = new Map(users.map((u) => [u.id, u]));
  const tokensByUser = await fetchTokensByUser(base44, recipients);
  const prefsByUser = await fetchPreferences(base44, recipients);

  const senderId = event.sender_id ? String(event.sender_id) : "";
  const now = new Date().toISOString();
  const baseMeta = typeof event.metadata === "string" ? parseJSON(event.metadata, {}) : event.metadata || {};
  if (event.image) baseMeta.image = event.image;
  const link = resolveLink(event);
  const meta = getCategoryMeta(event.type);
  const isEmergency = event.type === "emergency_alert";

  // 1) Resolve per-recipient channel preferences and build the deliverable list.
  const deliverables = [];
  for (const recipientId of recipients) {
    if (event.skip_sender && recipientId === senderId) continue;
    const recipient = userMap.get(recipientId);
    const ns = getNotifSettings(recipient);
    let cp = categoryPrefs(ns, event.type);
    if (isEmergency) { cp = { ...cp, push: true, inapp: true }; } // emergency always delivered
    if (!cp.push && !cp.inapp) continue; // category disabled => skip entirely
    const globalPushOn = ns.push !== false;
    const pushWanted = isEmergency || (cp.push && globalPushOn);
    const inappWanted = cp.inapp;
    if (!pushWanted && !inappWanted) continue;
    deliverables.push({
      recipientId,
      recipientName: recipient?.full_name || recipient?.email || "",
      inappWanted,
      pushWanted,
      sound: cp.sound,
      vibrate: cp.vibrate,
    });
  }
  if (deliverables.length === 0) return { created: 0, recipients, skipped: "all-disabled" };

  // 2) Persist in-app records for recipients who want in-app delivery.
  const inappFields = (d) => ({
    recipient_id: d.recipientId,
    recipient_name: d.recipientName,
    sender_id: senderId,
    sender_name: event.sender_name || "",
    type: event.type,
    title: event.title || "",
    message: event.message || "",
    image_url: event.image || baseMeta.image || "",
    related_object_id: event.related_object_id ? String(event.related_object_id) : "",
    related_object_type: event.related_object_type || "",
    read: false,
    delivered_at: now,
    community_id: event.community_id ? String(event.community_id) : "",
    link,
    metadata: JSON.stringify({ ...baseMeta, link, category: meta.label }),
  });
  const inappDeliverables = deliverables.filter((d) => d.inappWanted);
  const createdMap = new Map();
  if (inappDeliverables.length) {
    const records = inappDeliverables.map(inappFields);
    const created = [];
    for (let i = 0; i < records.length; i += 500) {
      const res = await base44.asServiceRole.entities.Notification.bulkCreate(records.slice(i, i + 500));
      if (Array.isArray(res)) created.push(...res);
    }
    for (const r of created) createdMap.set(r.recipient_id, r);
  }

  // 3) Deliver push + write NotificationDelivery records (logging/analytics/retry).
  for (const d of deliverables) {
    const inappRec = createdMap.get(d.recipientId) || null;
    const recipient = userMap.get(d.recipientId);
    const ns = getNotifSettings(recipient);
    const prefRow = prefsByUser.get(String(d.recipientId));
    const tokens = tokensByUser.get(String(d.recipientId)) || [];
    const quiet = !isEmergency && isQuietHours(prefRow);
    const canPush = d.pushWanted && tokens.length > 0 && !quiet;

    let status = "delivered";
    let lastError = "";
    let lastErrorCode = "";
    let sentAt = "";
    let fcmMessageId = "";
    let tokenPreview = "";
    let invalidTokens = [];

    if (!d.pushWanted) {
      status = "delivered"; // push disabled by preference (in-app only)
    } else if (tokens.length === 0) {
      status = "delivered"; // no registered device
    } else if (quiet) {
      status = "delivered"; // suppressed during quiet hours
    } else {
      tokenPreview = tokens[0] ? tokens[0].slice(0, 16) + "…" : "";
      // Per-recipient sound/vibration override from preferences.
      const metaOverride = { ...meta, sound: d.sound ? meta.sound : false, vibrate: d.vibrate ? meta.vibrate : undefined };
      const recForPayload = inappRec || {
        title: event.title, message: event.message, type: event.type,
        community_id: event.community_id || "", link, metadata: JSON.stringify({ ...baseMeta, link }),
      };
      const payload = buildEnrichedPayload(recForPayload, metaOverride);
      const res = await NotificationService.sendPush(tokens, payload);
      invalidTokens = res.invalidTokens || [];
      if (invalidTokens.length) await purgeInvalidTokens(base44, invalidTokens);
      const firstOk = (res.results || []).find((r) => r.ok);
      fcmMessageId = firstOk?.messageId || "";
      if (res.failed === 0) { status = "sent"; sentAt = new Date().toISOString(); }
      else if (res.sent > 0) { status = "sent"; sentAt = new Date().toISOString(); lastError = (res.errors[0] || "partial failure").slice(0, 240); }
      else { status = "failed"; lastError = (res.errors[0] || "push failed").slice(0, 240); }
    }

    console.log(
      `[NOTIFY] user=${d.recipientId} cat=${event.type} title="${(event.title || "").slice(0, 60)}" ` +
      `ts=${new Date().toISOString()} token=${tokenPreview || "none"} fcm=${fcmMessageId || "-"} ` +
      `status=${status}${lastError ? ` err=${lastError}` : ""}`
    );

    try {
      await base44.asServiceRole.entities.NotificationDelivery.create({
        notification_id: inappRec?.id || "",
        recipient_id: d.recipientId,
        type: event.type,
        title: (event.title || "").slice(0, 200),
        status,
        attempts: status === "failed" ? 1 : status === "sent" ? 1 : 0,
        max_attempts: 5,
        next_retry_at: status === "failed" ? new Date(Date.now() + 60_000).toISOString() : "",
        last_error: lastError,
        last_error_code: lastErrorCode,
        token_count: tokens.length,
        token_preview: tokenPreview,
        fcm_message_id: fcmMessageId,
        platforms: JSON.stringify(["web"]),
        sent_at: sentAt,
        delivered_at: status === "delivered" ? new Date().toISOString() : "",
        failed_at: status === "failed" ? new Date().toISOString() : "",
      });
    } catch { /* delivery record is best-effort */ }
  }

  return { created: inappDeliverables.length, recipients };
}