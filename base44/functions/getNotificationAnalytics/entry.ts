import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { NOTIF_TYPES, getCategoryMeta } from "../../shared/notificationTypes.ts";

// Notification Analytics — admin-only aggregation over Notification,
// NotificationDelivery, and DeviceToken. Returns dashboard cards + chart data
// with optional filters (community, category, platform, date range). Capped at
// 2000 records per collection for performance; metrics are computed from the
// most recent sample. Designed to be polled (e.g. every 30s) by the dashboard.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const communityId = body.community_id || "";
    const category = body.category || "";
    const platform = body.platform || "";
    const range = body.range || "all";

    const now = new Date();
    const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
    const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
    const monthAgo = new Date(now.getTime() - 30 * 86400000).toISOString();
    let since = null;
    if (range === "today") since = startOfToday;
    else if (range === "week") since = weekAgo;
    else if (range === "month") since = monthAgo;

    // The SDK does not support $gte on the built-in created_date field, so we
    // fetch the most recent 2000 records per collection and apply the date-range
    // filter in JavaScript. Community/category filters still go to the SDK.
    const notifFilter = {};
    if (communityId) notifFilter.community_id = communityId;
    if (category) notifFilter.type = category;

    const delivFilter = {};
    if (category) delivFilter.type = category;

    const tokenFilter = platform ? { platform } : {};

    const [notifications, deliveries, tokens] = await Promise.all([
      base44.asServiceRole.entities.Notification.filter(notifFilter, "-created_date", 2000).catch(() => []),
      base44.asServiceRole.entities.NotificationDelivery.filter(delivFilter, "-created_date", 2000).catch(() => []),
      base44.asServiceRole.entities.DeviceToken.filter(tokenFilter, "-created_date", 2000).catch(() => []),
    ]);

    const allNotifs = notifications || [];
    const allDels = deliveries || [];
    const toks = tokens || [];
    // Apply the date-range filter in JS (range scopes charts/top lists; cards
    // below use the full recent sample so today/week/month stay absolute).
    const notifs = since ? allNotifs.filter((n) => n.created_date && new Date(n.created_date) >= new Date(since)) : allNotifs;
    const dels = since ? allDels.filter((d) => d.created_date && new Date(d.created_date) >= new Date(since)) : allDels;

    // Cards
    const today = allNotifs.filter((n) => n.created_date && new Date(n.created_date) >= new Date(startOfToday)).length;
    const week = allNotifs.filter((n) => n.created_date && new Date(n.created_date) >= new Date(weekAgo)).length;
    const month = allNotifs.filter((n) => n.created_date && new Date(n.created_date) >= new Date(monthAgo)).length;
    const sent = dels.filter((d) => d.status === "sent").length;
    const failed = dels.filter((d) => d.status === "failed" || d.status === "expired").length;
    const pushTotal = sent + failed;
    const pushSuccessRate = pushTotal ? (sent / pushTotal) * 100 : 0;
    const pushFailureRate = pushTotal ? (failed / pushTotal) * 100 : 0;
    const deliveryTimes = dels.filter((d) => d.sent_at && d.created_date).map((d) => new Date(d.sent_at) - new Date(d.created_date)).filter((ms) => ms >= 0);
    const avgDeliveryMs = deliveryTimes.length ? deliveryTimes.reduce((a, b) => a + b, 0) / deliveryTimes.length : 0;
    const readTimes = notifs.filter((n) => n.read_at && n.created_date).map((n) => new Date(n.read_at) - new Date(n.created_date)).filter((ms) => ms >= 0);
    const avgReadMs = readTimes.length ? readTimes.reduce((a, b) => a + b, 0) / readTimes.length : 0;
    const activeTokens = toks.filter((t) => t.is_active).length;
    const totalDevices = toks.length;
    const pendingQueue = dels.filter((d) => (d.status === "failed" && d.next_retry_at) || d.status === "pending").length;

    // Per day (14 days)
    const perDay = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(); d.setUTCDate(d.getUTCDate() - i);
      const key = d.toISOString().split("T")[0].slice(5);
      perDay.push({ date: key, count: 0 });
    }
    const dayMap = {};
    perDay.forEach((p) => (dayMap[p.date] = p));
    notifs.forEach((n) => {
      const d = n.created_date?.split("T")[0]?.slice(5);
      if (d && dayMap[d]) dayMap[d].count++;
    });

    // Per category + top types
    const catCount = {};
    notifs.forEach((n) => { catCount[n.type] = (catCount[n.type] || 0) + 1; });
    const perCategory = Object.entries(catCount).map(([key, count]) => ({ key, label: getCategoryMeta(key)?.label || key, count })).sort((a, b) => b.count - a.count);

    // Success vs failure
    const successFailure = [{ name: "Sent", value: sent }, { name: "Failed", value: failed }];

    // Read vs unread
    const readCount = notifs.filter((n) => n.read).length;
    const readUnread = [{ name: "Read", value: readCount }, { name: "Unread", value: notifs.length - readCount }];

    // Top communities
    const commCount = {};
    notifs.forEach((n) => { if (n.community_id) commCount[n.community_id] = (commCount[n.community_id] || 0) + 1; });
    const topCommIds = Object.entries(commCount).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id]) => id);
    const communities = topCommIds.length ? await Promise.all(topCommIds.map((id) => base44.asServiceRole.entities.Community.get(id).catch(() => null))) : [];
    const commNameMap = new Map(communities.filter(Boolean).map((c) => [c.id, c.name]));
    const topCommunities = topCommIds.map((id) => ({ id, name: commNameMap.get(id) || "Unknown", count: commCount[id] }));

    // Top users
    const userCount = {};
    notifs.forEach((n) => { if (n.recipient_id) userCount[n.recipient_id] = (userCount[n.recipient_id] || 0) + 1; });
    const topUserIds = Object.entries(userCount).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id]) => id);
    const users = topUserIds.length ? await Promise.all(topUserIds.map((id) => base44.asServiceRole.entities.User.get(id).catch(() => null))) : [];
    const userNameMap = new Map(users.filter(Boolean).map((u) => [u.id, u.full_name || u.email || "Unknown"]));
    const topUsers = topUserIds.map((id) => ({ id, name: userNameMap.get(id) || "Unknown", count: userCount[id] }));

    return Response.json({
      cards: { today, week, month, pushSuccessRate, pushFailureRate, avgDeliveryMs, avgReadMs, totalDevices, activeTokens, pendingQueue },
      perDay,
      perCategory,
      successFailure,
      readUnread,
      topCommunities,
      topUsers,
      topTypes: perCategory.slice(0, 8),
      sample: { notifications: notifs.length, deliveries: dels.length, tokens: toks.length },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});