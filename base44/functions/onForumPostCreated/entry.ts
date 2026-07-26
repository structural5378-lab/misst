import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { dispatchNotifications } from "../../shared/notifications.ts";

// Entity automation: fires when a ForumPost is created.
// Emits two centralized notifications through the Notification Service:
//   1) forum_reply -> the thread author ("X replied to your thread.")
//   2) user_mention -> each @mentioned user ("X mentioned you in <thread>.")
// The service resolves recipients, honors User.notif_settings (category must be
// enabled), writes the in-app Notification record, sends FCM push, and logs
// delivery — so disabled categories produce no push, no in-app record, no badge.
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const body = await req.json().catch(() => ({}));
  const post = body.data || body;
  if (!post || !post.thread_id || post.is_deleted) {
    return Response.json({ ok: true, skipped: true });
  }
  try {
    const thread = await base44.asServiceRole.entities.ForumThread.get(post.thread_id).catch(() => null);
    if (!thread) return Response.json({ ok: true, skipped: "no-thread" });

    const authorId = post.author_id ? String(post.author_id) : "";
    const authorName = post.author_name || "Someone";
    const communityId = thread.community_id || "";
    const threadMeta = JSON.stringify({ community_slug: thread.community_name || "" });
    const results = [];

    // 1) Forum reply -> thread author (skip if replying to own thread).
    if (thread.author_id && String(thread.author_id) !== authorId) {
      results.push(await dispatchNotifications(base44, {
        type: "forum_reply",
        title: `${authorName} replied to your thread.`,
        message: thread.title || "",
        recipient_ids: [String(thread.author_id)],
        sender_id: authorId,
        sender_name: authorName,
        related_object_id: thread.id,
        related_object_type: "thread",
        community_id: communityId,
        metadata: threadMeta,
        skip_sender: true,
      }));
    }

    // 2) Mentions -> each mentioned user (excluding the author and thread author).
    let mentions = [];
    try { mentions = JSON.parse(post.mentions || "[]"); } catch { mentions = []; }
    const mentionIds = [...new Set((Array.isArray(mentions) ? mentions : [])
      .map(String)
      .filter((id) => id && id !== authorId && id !== String(thread.author_id || "")))];
    if (mentionIds.length) {
      results.push(await dispatchNotifications(base44, {
        type: "user_mention",
        title: `${authorName} mentioned you in ${thread.title || "a thread"}.`,
        message: "",
        recipient_ids: mentionIds,
        sender_id: authorId,
        sender_name: authorName,
        related_object_id: thread.id,
        related_object_type: "thread",
        community_id: communityId,
        metadata: threadMeta,
        skip_sender: true,
      }));
    }

    return Response.json({ ok: true, results });
  } catch (e) {
    return Response.json({ ok: false, error: e?.message || String(e) });
  }
});