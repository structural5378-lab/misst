import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const MYBB_BASE = "https://insomniacsgmrs.com";

function parseRSS(xml) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const title = (block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || block.match(/<title>(.*?)<\/title>/) || [])[1] || "";
    const link = (block.match(/<link>(.*?)<\/link>/) || [])[1] || "";
    const description = (block.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) || block.match(/<description>([\s\S]*?)<\/description>/) || [])[1] || "";
    const pubDate = (block.match(/<pubDate>(.*?)<\/pubDate>/) || [])[1] || "";
    const author = (block.match(/<author>(.*?)<\/author>/) || [])[1] || "";
    const tidMatch = link.match(/tid=(\d+)/);
    if (title) {
      items.push({ title: title.trim(), link: link.trim(), description: description.trim(), pubDate, author: author.trim(), threadId: tidMatch ? tidMatch[1] : null });
    }
  }
  return items;
}

function stripHtml(html) {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .trim();
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

    // ── Recent posts (global RSS) ──────────────────────────────────────────────
    if (action === "recent") {
      const res = await fetch(`${MYBB_BASE}/syndication.php?limit=30`, {
        headers: { "User-Agent": "MistApp/1.0" }
      });
      const xml = await res.text();
      return Response.json({ threads: parseRSS(xml), source: "rss" });
    }

    // ── Threads in a specific forum (RSS by fid) ───────────────────────────────
    if (action === "threads") {
      const res = await fetch(`${MYBB_BASE}/syndication.php?fid=${fid}&limit=20`, {
        headers: { "User-Agent": "MistApp/1.0" }
      });
      const xml = await res.text();
      return Response.json({ threads: parseRSS(xml), fid, source: "rss" });
    }

    // ── Full thread posts (HTML scrape of showthread.php) ─────────────────────
    if (action === "thread_posts") {
      const res = await fetch(`${MYBB_BASE}/showthread.php?tid=${tid}&mode=linear`, {
        headers: { "User-Agent": "MistApp/1.0" }
      });
      const html = await res.text();

      // Extract thread title
      const titleMatch = html.match(/<title>(.*?)<\/title>/i);
      const threadTitle = titleMatch ? titleMatch[1].replace(" - INSOMNIACS GMRS", "").trim() : "";

      // Extract each post block — MyBB wraps posts in <div id="post_NUM">
      const posts = [];
      // Match post containers by their post_NUM id
      const postRegex = /<div id="post_(\d+)"[\s\S]*?class="postbit[^"]*"([\s\S]*?)(?=<div id="post_\d+"|<div class="thead"|<\/div>\s*<div class="tfoot")/g;

      // Simpler approach: extract by post author and content patterns
      // Find all post author blocks
      const authorMatches = [...html.matchAll(/<span class="largetext"><strong><a[^>]*>([^<]+)<\/a><\/strong><\/span>/g)];
      const contentMatches = [...html.matchAll(/<div class="post_body scaleimages" id="pid_(\d+)">([\s\S]*?)<\/div>/g)];
      const dateMatches = [...html.matchAll(/<span class="post_date">(.*?)<\/span>/g)];

      for (let i = 0; i < contentMatches.length; i++) {
        const pid = contentMatches[i][1];
        const rawContent = contentMatches[i][2];
        const author = authorMatches[i] ? authorMatches[i][1] : "Unknown";
        const date = dateMatches[i] ? dateMatches[i][1].trim() : "";
        const content = stripHtml(rawContent);
        if (content) {
          posts.push({ pid, author, date, content });
        }
      }

      return Response.json({ threadTitle, posts, tid, source: "scrape" });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});