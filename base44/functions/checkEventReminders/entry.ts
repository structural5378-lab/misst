import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const now = new Date();

    // Get upcoming/delayed events that haven't ended
    const events = await base44.asServiceRole.entities.Event.filter({ status: "upcoming" });
    const delayed = await base44.asServiceRole.entities.Event.filter({ status: "delayed" });
    const allActive = [...events, ...delayed];

    let reminded = 0;

    for (const event of allActive) {
      const eventTime = new Date(event.event_time);
      const msUntil = eventTime - now;
      const minutesUntil = Math.round(msUntil / 60000);

      // If event has passed, mark as ended
      if (msUntil < -5 * 60 * 1000) {
        await base44.asServiceRole.entities.Event.update(event.id, { status: "ended" });
        continue;
      }

      // Send reminders every 10 minutes up until start (from 60 min down to 0)
      // Only send if we're within 60 min and the minute mark is a 10-min interval
      if (minutesUntil > 0 && minutesUntil <= 60 && minutesUntil % 10 === 0) {
        const lastReminder = event.last_reminder_at ? new Date(event.last_reminder_at) : null;
        // Avoid double-sending within the same minute
        const minutesSinceLastReminder = lastReminder ? (now - lastReminder) / 60000 : 999;
        if (minutesSinceLastReminder < 8) continue;

        const apiKey = Deno.env.get("PUSHALERT_API_KEY");
        if (apiKey) {
          await fetch("https://api.pushalert.co/rest/v1/send", {
            method: "POST",
            headers: {
              "Authorization": `api_key=${apiKey}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              title: `⏰ ${event.title} starts in ${minutesUntil} min!`,
              message: event.description || "Tap to open the app and join.",
              url: "https://insomniacsgmrs.com/app",
              sound: "https://insomniacsgmrs.com/uploads/notification.mp3",
            }).toString(),
          });

          await base44.asServiceRole.entities.Event.update(event.id, {
            last_reminder_at: now.toISOString(),
            reminders_sent: (event.reminders_sent || 0) + 1,
          });
          reminded++;
        }
      }
    }

    return Response.json({ ok: true, reminded, checked: allActive.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});