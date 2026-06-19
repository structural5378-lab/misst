import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { eventId, title, description, eventTime, type, minutesUntil } = await req.json();

    const apiKey = Deno.env.get("PUSHALERT_API_KEY");
    if (!apiKey) return Response.json({ error: "No PushAlert API key" }, { status: 500 });

    let notifTitle, notifMessage;

    if (type === "created") {
      notifTitle = `📅 New Event: ${title}`;
      const t = new Date(eventTime);
      notifMessage = description
        ? `${description} — Starts ${t.toLocaleString("en-US", { hour: "numeric", minute: "2-digit", month: "short", day: "numeric" })}`
        : `Starts ${t.toLocaleString("en-US", { hour: "numeric", minute: "2-digit", month: "short", day: "numeric" })}`;
    } else if (type === "reminder") {
      notifTitle = `⏰ ${title} starts in ${minutesUntil} min!`;
      notifMessage = description || "Tap to open the app and join.";
    }

    const paRes = await fetch("https://api.pushalert.co/rest/v1/send", {
      method: "POST",
      headers: {
        "Authorization": `api_key=${apiKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        title: notifTitle,
        message: notifMessage,
        url: "https://insomniacsgmrs.com/app",
        sound: "https://insomniacsgmrs.com/uploads/notification.mp3",
      }).toString(),
    });

    const paData = await paRes.text();
    console.log("PushAlert response:", paRes.status, paData);

    if (!paRes.ok) {
      return Response.json({ error: "PushAlert API failed", status: paRes.status, detail: paData }, { status: 502 });
    }

    return Response.json({ ok: true, pushalert: paData });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});