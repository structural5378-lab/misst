import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const BRIDGE_URL = "https://insomniacsgmrs.com/mist-api.php";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const apiKey = Deno.env.get("PUSHALERT_API_KEY");
    if (!apiKey) return Response.json({ error: "Missing PUSHALERT_API_KEY" }, { status: 500 });

    // Get the last known chat message ID from the database
    const markers = await base44.asServiceRole.entities.Alert.filter({ title: "__chat_last_seen_id" });
    const marker = markers[0];

    // Fetch latest chat messages
    const messages = await base44.asServiceRole.entities.ChatMessage.list("-created_date", 1);
    if (!messages || messages.length === 0) return Response.json({ status: "no messages" });

    const latest = messages[0];

    // First run — just record the marker, don't notify
    if (!marker) {
      await base44.asServiceRole.entities.Alert.create({
        title: "__chat_last_seen_id",
        message: latest.id,
        type: "system",
        is_read: true,
      });
      return Response.json({ status: "initialized", id: latest.id });
    }

    const lastSeenId = marker.message;

    // No new messages
    if (latest.id === lastSeenId) return Response.json({ status: "no new messages" });

    // Update marker
    await base44.asServiceRole.entities.Alert.update(marker.id, { message: latest.id });

    // Send push notification
    const senderName = latest.sender_name || "Someone";
    const content = latest.content?.substring(0, 80) || "New message";

    const payload = {
      title: `💬 ${senderName}`,
      message: content,
      url: "https://mist.insomniacsgmrs.com/live-chat",
      icon: "https://insomniacsgmrs.com/mist-icon.png",
      sound: "https://insomniacsgmrs.com/notification.mp3",
    };

    const pushRes = await fetch("https://api.pushalert.co/api/v1/send", {
      method: "POST",
      headers: {
        "Authorization": `api_key=${apiKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(payload).toString(),
    });

    const pushBody = await pushRes.json();
    return Response.json({ status: "sent", push: pushBody });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});