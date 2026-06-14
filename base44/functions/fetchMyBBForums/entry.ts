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
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Bridge error: ${res.status} — ${text}`);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Bridge returned non-JSON: ${text}`);
  }
}

Deno.serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    const { action = "recent", fid, tid } = body;

    // Public read-only actions don't require auth
    const publicActions = ["forums", "recent", "threads", "thread_posts", "online_users", "members"];
    if (!publicActions.includes(action)) {
      const base44 = createClientFromRequest(req);
      const user = await base44.auth.me();
      if (!user) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

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

    if (action === "online_users") {
      const data = await bridgeCall("online_users", {});
      const users = (data.users || []).map(u => ({
        uid: u.uid,
        username: u.username,
        avatar: u.avatar ? `https://insomniacsgmrs.com/${u.avatar}` : null,
      }));
      return Response.json({ users, count: users.length });
    }

    if (action === "members") {
      const data = await bridgeCall("members", {});
      const members = (data.members || []).map(m => ({
        uid: m.uid,
        username: m.username,
        avatar: m.avatar ? (m.avatar.startsWith("http") ? m.avatar : `https://insomniacsgmrs.com/${m.avatar.replace(/^\//, "")}`) : null,
        postcount: parseInt(m.postcount || 0),
        threadcount: parseInt(m.threadcount || 0),
        reputation: parseInt(m.reputation || 0),
        usergroup: m.usergroup,
        role: [4, 6].includes(parseInt(m.usergroup)) ? "admin" : parseInt(m.usergroup) === 6 ? "moderator" : "member",
      }));
      return Response.json({ members, count: members.length });
    }

    if (action === "forums") {
      const data = await bridgeCall("forums", {});
      const forums = (data.forums || []).sort((a, b) => parseInt(a.disporder || 0) - parseInt(b.disporder || 0));
      return Response.json({ forums, source: "db" });
    }

    if (action === "create_thread") {
      const { fid: postFid, subject, message, username, password } = body;
      if (!postFid || !subject || !message || !username || !password) {
        return Response.json({ error: "Missing required fields" }, { status: 400 });
      }
      const data = await bridgeCall("create_thread", {
        fid: postFid,
        subject,
        message,
        bot_username: username,
        bot_password: password,
      });
      if (data.error) {
        return Response.json({ ok: false, error: data.error, result: data });
      }
      // Push notification for new thread
      const pushApiKey = Deno.env.get("PUSHALERT_API_KEY");
      if (pushApiKey && data.tid) {
        await fetch("https://api.pushalert.co/rest/v1/send", {
          method: "POST",
          headers: {
            "Authorization": `api_key=${pushApiKey}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            title: `New Thread by ${username}`,
            message: subject,
            url: `https://insomniacsgmrs.com/showthread.php?tid=${data.tid}`,
          }).toString(),
        }).catch(() => {});
      }
      return Response.json({ ok: true, result: data });
    }

    if (action === "reply") {
      const { tid: replyTid, message: replyMsg, username: replyUser, password: replyPass } = body;
      if (!replyTid || !replyMsg || !replyUser || !replyPass) {
        return Response.json({ error: "Missing required fields" }, { status: 400 });
      }
      const data = await bridgeCall("new_reply", {
        tid: replyTid,
        message: replyMsg,
        bot_username: replyUser,
        bot_password: replyPass,
      });
      if (data.error) {
        return Response.json({ ok: false, error: data.error, result: data });
      }
      return Response.json({ ok: true, result: data });
    }

    if (action === "debug_insert") {
      const data = await bridgeCall("debug_insert", { bot_username: body.bot_username || "Mist Client" });
      return Response.json(data);
    }

    if (action === "post_checkin") {
      const { net_name, callsign, location, signal_report, notes, fid: postFid } = body;
      const subject = `[Online Check-In] ${net_name}`;
      const message = [
        `[b]Online Check-In -- ${net_name}[/b]`,
        ``,
        `[b]Callsign:[/b] ${callsign}`,
        location ? `[b]Location:[/b] ${location}` : null,
        signal_report ? `[b]Signal Report:[/b] ${signal_report}` : null,
        notes ? `[b]Notes:[/b] ${notes}` : null,
        ``,
        `[i]Checked in via MIST App[/i]`,
      ].filter(l => l !== null).join("\n");

      // Target "On-Air Activity" forum (fid 7) by default
      const data = await bridgeCall("create_thread", {
        fid: postFid || 18,
        subject,
        message,
        bot_username: "Mist Client",
        bot_password: Deno.env.get("MYBB_BOT_PASSWORD"),
        checkin_callsign: callsign,
      });
      return Response.json({ ok: true, result: data });
    }

    if (action === "post_net_schedule") {
      const { net_name, frequency, time, day_of_week, description, repeater_callsign, net_control } = body;
      const subject = `[Net Schedule] ${net_name}`;
      const lines = [
        `[b]${net_name}[/b]`,
        ``,
        frequency ? `[b]Frequency:[/b] ${frequency} MHz` : null,
        repeater_callsign ? `[b]Repeater:[/b] ${repeater_callsign}` : null,
        day_of_week ? `[b]Day:[/b] ${day_of_week}` : null,
        time ? `[b]Time:[/b] ${time}` : null,
        net_control ? `[b]Net Control:[/b] ${net_control}` : null,
        description ? `\n${description}` : null,
        ``,
        `[i]Added via MIST App[/i]`,
      ].filter(l => l !== null).join("\n");

      // Post to Net Schedules forum (fid 7) and also add calendar event
      const threadResult = await bridgeCall("create_thread", {
        fid: body.fid || 7,
        subject,
        message: lines,
        bot_username: "Mist Client",
        bot_password: Deno.env.get("MYBB_BOT_PASSWORD"),
      });

      // Add to MyBB calendar
      const today = new Date();
      const calResult = await bridgeCall("add_calendar_event", {
        name: net_name,
        description: lines,
        startdate: `${today.getMonth() + 1}-${today.getDate()}-${today.getFullYear()}`,
        enddate: `${today.getMonth() + 1}-${today.getDate()}-${today.getFullYear()}`,
        repeating: 1,
        repeating_type: day_of_week ? "weekly" : "daily",
        bot_username: "Mist Client",
        bot_password: Deno.env.get("MYBB_BOT_PASSWORD"),
      }).catch(() => null); // calendar is optional

      return Response.json({ ok: true, thread: threadResult, calendar: calResult });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});