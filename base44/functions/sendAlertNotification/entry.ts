import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { dispatchNotifications } from "../../shared/notifications.ts";

// Called by entity automation when a new Alert (News / Announcement) is created.
// Routes through the centralized Notification Service so per-user preferences,
// in-app Notification records, delivery logs, analytics, and badge sync all
// apply — replacing the legacy direct-FCM broadcast.
//   emergency          -> emergency_alert (always delivered; admins emailed)
//   info/warning/system -> news (honors the user's "news" preference)
// Recipients: community-scoped alert -> active community members; platform-wide
// alert (no community_id) -> all users.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const data = body.data || body;
    if (!data || !data.title) return Response.json({ ok: true, skipped: "no-data" });

    const isEmergency = data.type === "emergency";
    const type = isEmergency ? "emergency_alert" : "news";
    const link = data.link || "/alerts";

    // Resolve recipients. For community-scoped alerts, let the engine fan out to
    // active members (pass community_id, no recipient_ids). For platform-wide
    // alerts, fetch all users and pass explicit recipient_ids.
    let event: any = {
      type,
      title: data.title || "MIST",
      message: data.message || "",
      community_id: data.community_id ? String(data.community_id) : "",
      related_object_id: data.id ? String(data.id) : "",
      related_object_type: "alert",
      sender_id: "",
      sender_name: data.community_name || "MIST",
      link,
    };

    if (!data.community_id) {
      const users = await base44.asServiceRole.entities.User.list("-created_date", 2000).catch(() => []);
      event.recipient_ids = (users || []).map((u) => String(u.id)).filter(Boolean);
    }

    const result = await dispatchNotifications(base44, event);

    // Email platform admins for emergency alerts (side effect preserved).
    if (isEmergency) {
      try {
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
      } catch { /* best-effort */ }
    }

    return Response.json({ ok: true, result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});