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

    // Fetch recent threads from MyBB
    const data = await bridgeCall("threads", {});
    const threads = data.threads || [];
    if (threads.length === 0) return Response.json({ ok: true, notified: 0 });

    // Sort by tid descending to find newest
    const sortedThreads = [...threads].sort((a, b) => parseInt(b.tid) - parseInt(a.tid));
    const maxTid = parseInt(sortedThreads[0]?.tid || 0);

    // Load last seen TID from DB (stored as an Alert with type "system" and title "__last_tid__")
    const markers = await base44.asServiceRole.entities.Alert.filter({ title: "__forum_last_tid__" });
    const marker = markers[0];
    const lastSeenTid = marker ? parseInt(marker.message || 0) : 0;

    // On very first run, just save current max and don't spam
    if (!marker) {
      await base44.asServiceRole.entities.Alert.create({
        title: "__forum_last_tid__",
        message: String(maxTid),
        type: "system",
        is_read: true,
      });
      return Response.json({ ok: true, notified: 0, initialized: true, maxTid });
    }

    const newThreads = sortedThreads.filter(t => parseInt(t.tid) > lastSeenTid);

    if (newThreads.length === 0) {
      return Response.json({ ok: true, notified: 0 });
    }

    const apiKey = Deno.env.get("PUSHALERT_API_KEY");
    let notified = 0;

    if (apiKey) {
      for (const thread of newThreads) {
        await fetch("https://api.pushalert.co/rest/v1/send", {
          method: "POST",
          headers: {
            "Authorization": `api_key=${apiKey}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            title: `New Thread by ${thread.username || "a member"}`,
            message: thread.subject || "A new thread was posted on the forum",
            url: `https://insomniacsgmrs.com/showthread.php?tid=${thread.tid}`,
          }).toString(),
        }).catch(() => {});
        notified++;
      }
    }

    // Update the marker with the new max TID
    await base44.asServiceRole.entities.Alert.update(marker.id, { message: String(maxTid) });

    return Response.json({ ok: true, notified, newThreads: newThreads.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});