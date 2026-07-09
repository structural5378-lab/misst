import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const BRIDGE_URL = "https://insomniacsgmrs.com/mist-api.php";

async function bridgeCall(action, params) {
  const secret = Deno.env.get("MIST_BRIDGE_SECRET") || "MIST_BRIDGE_SECRET_KEY_CHANGE_ME";
  const res = await fetch(BRIDGE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Mist-Secret": secret,
    },
    body: JSON.stringify({ action, ...params }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Bridge error: ${res.status} — ${text}`);
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Bridge returned non-JSON: ${text}`);
  }
}

async function sendPush(apiKey, payload) {
  if (!apiKey) return;
  await fetch("https://api.pushalert.co/api/v1/send", {
    method: "POST",
    headers: {
      "Authorization": `api_key=${apiKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(payload).toString(),
  }).catch(() => {});
}

// ── Check new chat messages ──
async function checkChatMessages(base44, apiKey) {
  const markers = await base44.asServiceRole.entities.Alert.filter({ title: "__chat_last_seen_id" });
  const marker = markers[0];
  const messages = await base44.asServiceRole.entities.ChatMessage.list("-created_date", 1);
  if (!messages || messages.length === 0) return 0;

  const latest = messages[0];
  if (!marker) {
    await base44.asServiceRole.entities.Alert.create({
      title: "__chat_last_seen_id", message: latest.id, type: "system", is_read: true,
    });
    return 0;
  }
  if (latest.id === marker.message) return 0;

  await base44.asServiceRole.entities.Alert.update(marker.id, { message: latest.id });
  await sendPush(apiKey, {
    title: `💬 ${latest.sender_name || "Someone"}`,
    message: latest.content?.substring(0, 80) || "New message",
    url: "https://mist.insomniacsgmrs.com/live-chat",
    icon: "https://insomniacsgmrs.com/mist-icon.png",
    sound: "https://insomniacsgmrs.com/notification.mp3",
  });
  return 1;
}

// ── Check new PMs ──
async function checkPMs(base44, apiKey) {
  const membersData = await bridgeCall("members", {});
  const members = membersData.members || [];
  let notified = 0;

  for (const member of members) {
    const uid = member.uid;
    const pmData = await bridgeCall("get_pms", { uid, password: Deno.env.get("MYBB_BOT_PASSWORD") || "" });
    const unreadCount = pmData.unread_count || 0;
    if (unreadCount === 0) continue;

    const markerKey = `__pm_${uid}__`;
    const markers = await base44.asServiceRole.entities.Alert.filter({ title: markerKey });
    const marker = markers[0];
    const lastSeenCount = marker ? parseInt(marker.message || 0) : 0;

    if (!marker) {
      await base44.asServiceRole.entities.Alert.create({
        title: markerKey, message: String(unreadCount), type: "system", is_read: true,
      });
      continue;
    }

    if (unreadCount > lastSeenCount) {
      const newPMs = unreadCount - lastSeenCount;
      await sendPush(apiKey, {
        title: `New Message${newPMs > 1 ? 's' : ''}`,
        message: `You have ${newPMs} new private message${newPMs > 1 ? 's' : ''} on the forum`,
        url: "https://insomniacsgmrs.com/private.php",
        icon: "https://insomniacsgmrs.com/uploads/mist-icon.png",
        sound: "https://insomniacsgmrs.com/uploads/notification.mp3",
      });
      notified++;
      await base44.asServiceRole.entities.Alert.update(marker.id, { message: String(unreadCount) });
    }
  }
  return notified;
}

// ── Check new forum threads ──
async function checkNewThreads(base44, apiKey) {
  const data = await bridgeCall("threads", {});
  const threads = data.threads || [];
  if (threads.length === 0) return 0;

  const sortedThreads = [...threads].sort((a, b) => parseInt(b.tid) - parseInt(a.tid));
  const maxTid = parseInt(sortedThreads[0]?.tid || 0);

  const markers = await base44.asServiceRole.entities.Alert.filter({ title: "__forum_last_tid__" });
  const marker = markers[0];
  const lastSeenTid = marker ? parseInt(marker.message || 0) : 0;

  if (!marker) {
    await base44.asServiceRole.entities.Alert.create({
      title: "__forum_last_tid__", message: String(maxTid), type: "system", is_read: true,
    });
    return 0;
  }

  const newThreads = sortedThreads.filter(t => parseInt(t.tid) > lastSeenTid);
  if (newThreads.length === 0) return 0;

  let notified = 0;
  for (const thread of newThreads) {
    await sendPush(apiKey, {
      title: `New Thread by ${thread.username || "a member"}`,
      message: thread.subject || "A new thread was posted on the forum",
      url: `https://insomniacsgmrs.com/showthread.php?tid=${thread.tid}`,
      icon: "https://insomniacsgmrs.com/uploads/mist-icon.png",
      sound: "https://insomniacsgmrs.com/uploads/notification.mp3",
    });
    notified++;
  }
  await base44.asServiceRole.entities.Alert.update(marker.id, { message: String(maxTid) });
  return notified;
}

// ── Check location share requests ──
async function checkLocationShares(base44, apiKey) {
  const requests = await base44.asServiceRole.entities.LocationShare.filter({ status: "pending" });
  if (!requests || requests.length === 0) return 0;

  let notified = 0;
  for (const request of requests) {
    const markerKey = `__simplex_${request.id}__`;
    const markers = await base44.asServiceRole.entities.Alert.filter({ title: markerKey });
    if (markers.length > 0) continue;

    await base44.asServiceRole.entities.Alert.create({
      title: markerKey, message: "notified", type: "system", is_read: true,
    });
    await sendPush(apiKey, {
      title: `📍 ${request.initiator_username || "Someone"} wants your location`,
      message: "Tap to open Simplex Mode and respond",
      url: "https://mist.insomniacsgmrs.com/cineplex",
      icon: "https://insomniacsgmrs.com/mist-icon.png",
      sound: "https://insomniacsgmrs.com/notification.mp3",
    });
    notified++;
  }
  return notified;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const apiKey = Deno.env.get("PUSHALERT_API_KEY");

    const chatNotified = await checkChatMessages(base44, apiKey);
    const pmNotified = await checkPMs(base44, apiKey);
    const threadNotified = await checkNewThreads(base44, apiKey);
    const locationNotified = await checkLocationShares(base44, apiKey);

    return Response.json({
      ok: true,
      chat: chatNotified,
      pms: pmNotified,
      threads: threadNotified,
      locations: locationNotified,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});