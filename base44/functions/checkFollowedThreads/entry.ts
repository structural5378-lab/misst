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

    // Get all followed threads
    const followed = await base44.asServiceRole.entities.FollowedThread.list();
    if (!followed || followed.length === 0) {
      return Response.json({ checked: 0, alerts: 0 });
    }

    // Group by thread_id to avoid duplicate forum fetches
    const threadMap = {};
    for (const f of followed) {
      if (!threadMap[f.thread_id]) threadMap[f.thread_id] = [];
      threadMap[f.thread_id].push(f);
    }

    let alertsCreated = 0;

    for (const [tid, followers] of Object.entries(threadMap)) {
      // Fetch latest thread info from MyBB
      let currentReplies = null;
      let threadTitle = followers[0].thread_title || `Thread #${tid}`;
      try {
        const data = await bridgeCall("threads", {});
        const match = (data.threads || []).find(t => String(t.tid) === String(tid));
        if (match) {
          currentReplies = parseInt(match.replies || 0);
          threadTitle = match.subject || threadTitle;
        }
      } catch {
        continue;
      }

      if (currentReplies === null) continue;

      for (const follow of followers) {
        const lastKnown = parseInt(follow.last_known_reply_count || 0);
        if (currentReplies > lastKnown) {
          const newReplies = currentReplies - lastKnown;

          // Create an Alert for this user
          await base44.asServiceRole.entities.Alert.create({
            title: `New repl${newReplies === 1 ? "y" : "ies"} in: ${threadTitle}`,
            message: `${newReplies} new repl${newReplies === 1 ? "y" : "ies"} posted in a thread you follow.`,
            type: "info",
            is_read: false,
            link: `/community-forum`,
          });
          alertsCreated++;

          // Update last known count
          await base44.asServiceRole.entities.FollowedThread.update(follow.id, {
            last_known_reply_count: currentReplies,
            thread_title: threadTitle,
          });
        }
      }
    }

    return Response.json({ checked: Object.keys(threadMap).length, alerts: alertsCreated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});