import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Called by entity automation when new Alert is created
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    const { event, data } = body;

    if (!data) {
      return Response.json({ ok: true, skipped: "no data" });
    }

    // Get all users who have push_alerts enabled
    const users = await base44.asServiceRole.entities.User.filter({ push_alerts: true });

    // Create an Alert record for each user (or a global one)
    // For now we broadcast by creating Alert records visible to all
    await base44.asServiceRole.entities.Alert.create({
      title: data.title || "New Activity",
      message: data.message || "",
      type: data.type || "info",
      is_read: false,
      link: data.link || ""
    });

    // Also send email to admins for emergency alerts
    if (data.type === "emergency") {
      const admins = await base44.asServiceRole.entities.User.filter({ role: "admin" });
      for (const admin of admins) {
        if (admin.email) {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: admin.email,
            subject: `🚨 EMERGENCY ALERT: ${data.title}`,
            body: `An emergency alert has been posted on MIST:\n\n${data.title}\n\n${data.message}\n\nView in the app.`
          });
        }
      }
    }

    return Response.json({ ok: true, notified: users.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});