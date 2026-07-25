import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";
import { sendFcmMulticast } from "../../shared/fcm.ts";

const ICON = "https://insomniacsgmrs.com/uploads/mist-icon.png";

// Called by entity automation when a new Alert is created. Broadcasts an FCM
// push to every active device token; emails platform admins for emergencies.
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
    const body = await req.json().catch(() => ({}));
    const { data } = body;

    if (!data) {
      return Response.json({ ok: true, skipped: "no data" });
    }

    const tokens = await fetchAllActiveTokens(base44);
    let push = { sent: 0, failed: 0 };
    if (tokens.length > 0) {
      const payload = {
        notification: { title: data.title || "MIST Alert", body: data.message || "" },
        data: {
          link: String(data.link || "/alerts"),
          type: data.type === "emergency" ? "emergency_alert" : "community_announcement",
          community_id: String(data.community_id || ""),
        },
        android: { notification: { icon: ICON, sound: "default" } },
        apns: { payload: { aps: { sound: "default" } } },
        webpush: { notification: { icon: ICON } },
      };
      push = await sendFcmMulticast(tokens, payload);
      console.log("FCM alert broadcast:", JSON.stringify(push));
    }

    // Email admins for emergency alerts only
    if (data.type === "emergency") {
      const admins = await base44.asServiceRole.entities.User.filter({ role: "admin" });
      for (const admin of admins) {
        if (admin.email) {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: admin.email,
            subject: `🚨 EMERGENCY ALERT: ${data.title}`,
            body: `An emergency alert has been posted on MIST:\n\n${data.title}\n\n${data.message || ""}\n\nView in the app.`,
          });
        }
      }
    }

    return Response.json({ ok: true, pushedTo: tokens.length, push });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});