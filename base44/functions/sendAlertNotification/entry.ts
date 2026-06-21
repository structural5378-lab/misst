import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Called by entity automation when new Alert is created
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    const { data } = body;

    if (!data) {
      return Response.json({ ok: true, skipped: "no data" });
    }

    // Send push notification to all subscribers via PushAlert
    const apiKey = Deno.env.get("PUSHALERT_API_KEY");
    if (apiKey) {
      const pushBody = {
        title: data.title,
        message: data.message || "",
        url: data.link || "https://mist.insomniacsgmrs.com",
        icon: "https://insomniacsgmrs.com/uploads/mist-icon.png",
        sound: "https://insomniacsgmrs.com/uploads/notification.mp3",
      };

      const pushRes = await fetch("https://api.pushalert.co/rest/v1/send", {
        method: "POST",
        headers: {
          "Authorization": `api_key=${apiKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams(pushBody).toString(),
      });
      const pushData = await pushRes.json().catch(() => ({}));
      console.log("PushAlert response:", JSON.stringify(pushData));
    }

    // Send email to admins for emergency alerts only
    if (data.type === "emergency") {
      const admins = await base44.asServiceRole.entities.User.filter({ role: "admin" });
      for (const admin of admins) {
        if (admin.email) {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: admin.email,
            subject: `🚨 EMERGENCY ALERT: ${data.title}`,
            body: `An emergency alert has been posted on MIST:\n\n${data.title}\n\n${data.message || ""}\n\nView in the app.`
          });
        }
      }
    }

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});