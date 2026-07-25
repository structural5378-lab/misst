import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";
import { sendFcmMulticast } from "../../shared/fcm.ts";

const ICON = "https://insomniacsgmrs.com/uploads/mist-icon.png";

async function fetchAllActiveTokens(base44) {
  let all = [];
  try {
    const chunk = await base44.asServiceRole.entities.DeviceToken.filter(
      { is_active: true },
      "-created_date",
      2000
    );
    if (Array.isArray(chunk)) all = chunk.map((t) => t.token).filter(Boolean);
  } catch (e) {
    console.warn("fetchActiveTokens failed", e.message);
  }
  return [...new Set(all)];
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { title, description, eventTime, type, minutesUntil } = await req.json();

    let notifTitle, notifMessage;
    if (type === "created") {
      notifTitle = `📅 New Event: ${title}`;
      const t = new Date(eventTime);
      const when = t.toLocaleString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        month: "short",
        day: "numeric",
      });
      notifMessage = description ? `${description} — Starts ${when}` : `Starts ${when}`;
    } else if (type === "reminder") {
      notifTitle = `⏰ ${title} starts in ${minutesUntil} min!`;
      notifMessage = description || "Tap to open the app and join.";
    } else {
      return Response.json({ error: "Unknown event type" }, { status: 400 });
    }

    const tokens = await fetchAllActiveTokens(base44);
    if (tokens.length === 0) {
      return Response.json({ ok: false, error: "No registered devices" });
    }

    const res = await sendFcmMulticast(tokens, {
      notification: { title: notifTitle, body: notifMessage },
      data: { link: "/events", type: "community_announcement" },
      android: { notification: { icon: ICON, sound: "default" } },
      apns: { payload: { aps: { sound: "default" } } },
      webpush: { notification: { icon: ICON } },
    });
    console.log("FCM event broadcast:", JSON.stringify(res));
    return Response.json({ ok: res.sent > 0, sent: res.sent, failed: res.failed });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});