import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const MYBB_BASE = "https://insomniacsgmrs.com";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { action = "forums", fid, tid, page = 1 } = body;

    if (action === "forums") {
      // Fetch forum list via MyBB's built-in XML feed / stats page
      // MyBB doesn't have a REST API by default — we scrape the forum index
      const res = await fetch(`${MYBB_BASE}/misc.php?action=syndication`, {
        headers: { "User-Agent": "MistApp/1.0" }
      });
      const xml = await res.text();

      // Parse RSS items
      const items = [];
      const itemRegex = /<item>([\s\S]*?)<\/item>/g;
      let match;
      while ((match = itemRegex.exec(xml)) !== null) {
        const block = match[1];
        const title = (block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || [])[1] || "";
        const link = (block.match(/<link>(.*?)<\/link>/) || [])[1] || "";
        const description = (block.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) || [])[1] || "";
        const pubDate = (block.match(/<pubDate>(.*?)<\/pubDate>/) || [])[1] || "";
        const author = (block.match(/<author>(.*?)<\/author>/) || [])[1] || "";
        if (title) {
          items.push({ title, link, description, pubDate, author });
        }
      }

      return Response.json({ threads: items, source: "rss" });

    } else if (action === "threads") {
      // Fetch threads from a specific forum via RSS
      const res = await fetch(`${MYBB_BASE}/syndication.php?fid=${fid || 1}&limit=20`, {
        headers: { "User-Agent": "MistApp/1.0" }
      });
      const xml = await res.text();

      const items = [];
      const itemRegex = /<item>([\s\S]*?)<\/item>/g;
      let match;
      while ((match = itemRegex.exec(xml)) !== null) {
        const block = match[1];
        const title = (block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || [])[1] || "";
        const link = (block.match(/<link>(.*?)<\/link>/) || [])[1] || "";
        const description = (block.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) || [])[1] || "";
        const pubDate = (block.match(/<pubDate>(.*?)<\/pubDate>/) || [])[1] || "";
        const author = (block.match(/<author>(.*?)<\/author>/) || [])[1] || "";
        // Extract tid from link
        const tidMatch = link.match(/tid=(\d+)/);
        const threadId = tidMatch ? tidMatch[1] : null;
        if (title) {
          items.push({ title, link, description, pubDate, author, threadId });
        }
      }

      return Response.json({ threads: items, fid, source: "rss" });

    } else if (action === "recent") {
      // Global recent posts feed
      const res = await fetch(`${MYBB_BASE}/syndication.php?limit=30`, {
        headers: { "User-Agent": "MistApp/1.0" }
      });
      const xml = await res.text();

      const items = [];
      const itemRegex = /<item>([\s\S]*?)<\/item>/g;
      let match;
      while ((match = itemRegex.exec(xml)) !== null) {
        const block = match[1];
        const title = (block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || [])[1] || "";
        const link = (block.match(/<link>(.*?)<\/link>/) || [])[1] || "";
        const description = (block.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) || [])[1] || "";
        const pubDate = (block.match(/<pubDate>(.*?)<\/pubDate>/) || [])[1] || "";
        const author = (block.match(/<author>(.*?)<\/author>/) || [])[1] || "";
        if (title) items.push({ title, link, description, pubDate, author });
      }

      return Response.json({ threads: items, source: "rss" });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});