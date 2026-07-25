import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { sendFcmMulticast } from "../../shared/fcm.ts";

const ICON = "https://insomniacsgmrs.com/uploads/mist-icon.png";

// Sends a test FCM push to the calling user's own registered device tokens.
// Requires authentication so the test only reaches the admin's own devices.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const tokens = await base44.asServiceRole.entities.DeviceToken
      .filter({ user_id: user.id, is_active: true }, "-created_date", 20)
      .catch(() => []);
    const tokenList = (tokens || []).map((t) => t.token).filter(Boolean);

    if (tokenList.length === 0) {
      return Response.json({
        ok: false,
        error: "No registered device tokens for your account. Subscribe on this device first.",
      });
    }

    const res = await sendFcmMulticast(tokenList, {
      notification: { title: "🔔 Test Notification", body: "FCM push is working! INSOMNIACSGMRS.COM" },
      data: { link: "/", type: "system" },
      android: { notification: { icon: ICON, sound: "default" } },
      apns: { payload: { aps: { sound: "default" } } },
      webpush: { notification: { icon: ICON } },
    });

    return Response.json({
      ok: res.sent > 0,
      sent: res.sent,
      failed: res.failed,
      errors: res.errors,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});