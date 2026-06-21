import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const BRIDGE_URL = "https://insomniacsgmrs.com/mist-api.php";

async function bridgeCall(action, params) {
  const secret = Deno.env.get("MIST_BRIDGE_SECRET") || "MIST_BRIDGE_SECRET_KEY_CHANGE_ME";
  const res = await fetch(BRIDGE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Mist-Secret": secret,
    },
    body: JSON.stringify({ action, ...params }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Bridge error: ${res.status} — ${text}`);
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Bridge returned non-JSON: ${text}`);
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Fetch all users to check their PMs
    const membersData = await bridgeCall("members", {});
    const members = membersData.members || [];
    
    const apiKey = Deno.env.get("PUSHALERT_API_KEY");
    let notified = 0;

    for (const member of members) {
      const uid = member.uid;
      const username = member.username;
      
      // Get unread PM count for this user
      const pmData = await bridgeCall("get_pms", { uid, password: Deno.env.get("MYBB_BOT_PASSWORD") || "" });
      const unreadCount = pmData.unread_count || 0;
      
      if (unreadCount === 0) continue;

      // Load last seen PM count from DB (stored as Alert with title "__pm_uid__")
      const markerKey = `__pm_${uid}__`;
      const markers = await base44.asServiceRole.entities.Alert.filter({ title: markerKey });
      const marker = markers[0];
      const lastSeenCount = marker ? parseInt(marker.message || 0) : 0;

      // Initialize marker on first run
      if (!marker) {
        await base44.asServiceRole.entities.Alert.create({
          title: markerKey,
          message: String(unreadCount),
          type: "system",
          is_read: true,
        });
        continue;
      }

      // If unread count increased, send notification
      if (unreadCount > lastSeenCount) {
        const newPMs = unreadCount - lastSeenCount;
        
        if (apiKey) {
          await fetch("https://api.pushalert.co/api/v1/send", {
            method: "POST",
            headers: {
              "Authorization": `api_key=${apiKey}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              title: `New Message${newPMs > 1 ? 's' : ''}`,
              message: `You have ${newPMs} new private message${newPMs > 1 ? 's' : ''} on the forum`,
              url: `https://insomniacsgmrs.com/private.php`,
              icon: "https://insomniacsgmrs.com/uploads/mist-icon.png",
              sound: "https://insomniacsgmrs.com/uploads/notification.mp3",
            }).toString(),
          }).catch(() => {});
        }
        
        notified++;
        
        // Update marker
        await base44.asServiceRole.entities.Alert.update(marker.id, { message: String(unreadCount) });
      }
    }

    return Response.json({ ok: true, notified });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});