import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const BRIDGE_URL = "https://insomniacsgmrs.com/mist-api.php";

function stripMyBBCodes(text) {
  return text
    .replace(/\[quote[^\]]*\][\s\S]*?\[\/quote\]/gi, "")
    .replace(/\[[^\]]+\]/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .trim();
}

function formatDate(unix) {
  if (!unix) return "";
  return new Date(parseInt(unix) * 1000).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true
  });
}

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
  if (!res.ok) throw new Error(`Bridge error: ${res.status}`);
  return res.json();
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { action = "recent", fid, tid } = body;

    if (action === "recent") {
      const data = await bridgeCall("threads", {});
      const threads = (data.threads || []).map(t => ({
        threadId: t.tid,
        title: t.subject,
        author: t.username,
        replies: parseInt(t.replies || 0),
        views: parseInt(t.views || 0),
        pubDate: formatDate(t.lastpost),
        link: `https://insomniacsgmrs.com/showthread.php?tid=${t.tid}`,
      }));
      return Response.json({ threads, source: "db" });
    }

    if (action === "threads") {
      const data = await bridgeCall("threads", { fid });
      const threads = (data.threads || []).map(t => ({
        threadId: t.tid,
        title: t.subject,
        author: t.username,
        replies: parseInt(t.replies || 0),
        views: parseInt(t.views || 0),
        pubDate: formatDate(t.lastpost),
        link: `https://insomniacsgmrs.com/showthread.php?tid=${t.tid}`,
      }));
      return Response.json({ threads, fid, source: "db" });
    }

    if (action === "thread_posts") {
      const data = await bridgeCall("posts", { tid });
      const posts = (data.posts || []).map(p => ({
        pid: p.pid,
        author: p.username,
        date: formatDate(p.dateline),
        content: stripMyBBCodes(p.message),
      }));
      // Get thread title from first post or posts list
      const threadTitle = data.posts?.[0]?.subject || `Thread #${tid}`;
      return Response.json({ threadTitle, posts, tid, source: "db" });
    }

    if (action === "forums") {
      const data = await bridgeCall("forums", {});
      return Response.json({ forums: data.forums || [], source: "db" });
    }

    if (action === "post_checkin") {
      const { net_name, callsign, location, signal_report, notes, fid: postFid } = body;
      const subject = `[Online Check-In] ${net_name}`;
      const message = [
        `[b]📡 Online Check-In — ${net_name}[/b]`,
        ``,
        `[b]Callsign:[/b] ${callsign}`,
        location ? `[b]Location:[/b] ${location}` : null,
        signal_report ? `[b]Signal Report:[/b] ${signal_report}` : null,
        notes ? `[b]Notes:[/b] ${notes}` : null,
        ``,
        `[i]Checked in via MIST App[/i]`,
      ].filter(l => l !== null).join("\n");

      const data = await bridgeCall("create_post", {
        fid: postFid || 2,
        subject,
        message,
        username: callsign,
      });
      return Response.json({ ok: true, result: data });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});