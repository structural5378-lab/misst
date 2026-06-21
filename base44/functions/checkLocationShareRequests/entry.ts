import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const BRIDGE_URL = "https://insomniacsgmrs.com/mist-api.php";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const apiKey = Deno.env.get("PUSHALERT_API_KEY");
    if (!apiKey) return Response.json({ error: "Missing PUSHALERT_API_KEY" }, { status: 500 });

    // Fetch pending location share requests
    const requests = await base44.asServiceRole.entities.LocationShare.filter({ status: "pending" });
    if (!requests || requests.length === 0) return Response.json({ status: "no pending requests" });

    let notified = 0;

    for (const request of requests) {
      // Check if we already notified for this request
      const markerKey = `__simplex_${request.id}__`;
      const markers = await base44.asServiceRole.entities.Alert.filter({ title: markerKey });
      
      // Skip if already notified
      if (markers.length > 0) continue;

      // Create marker to prevent duplicate notifications
      await base44.asServiceRole.entities.Alert.create({
        title: markerKey,
        message: "notified",
        type: "system",
        is_read: true,
      });

      const initiatorName = request.initiator_username || "Someone";
      
      // Send push notification to target user
      const payload = {
        title: `📍 ${initiatorName} wants your location`,
        message: "Tap to open Simplex Mode and respond",
        url: "https://mist.insomniacsgmrs.com/cineplex",
        icon: "https://insomniacsgmrs.com/mist-icon.png",
        sound: "https://insomniacsgmrs.com/notification.mp3",
      };

      await fetch("https://api.pushalert.co/api/v1/send", {
        method: "POST",
        headers: {
          "Authorization": `api_key=${apiKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams(payload).toString(),
      }).catch(() => {});

      notified++;
    }

    return Response.json({ ok: true, notified });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});