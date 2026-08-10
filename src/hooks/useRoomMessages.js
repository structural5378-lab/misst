import { useEffect, useRef, useState, useCallback } from "react";
import { mist } from '@/api/mist';
// useRoomMessages — realtime-style message stream for one Chat V2 room.
//
// SECURITY: all reads go through the membership-validated listCommunityContent
// backend function (entity "ChatV2RoomMessage") — never a direct open entity
// read or a cross-community realtime subscription. The stream is kept live via
// short-interval polling, which also reconciles optimistic (temp) sends.
function norm(m) {
  let reactions = {};
  try { reactions = typeof m.reactions === "string" ? JSON.parse(m.reactions) : (m.reactions || {}); } catch {}
  return { ...m, reactions };
}

function parseMentionsArr(body) {
  const arr = [];
  if (!body) return arr;
  if (/@everyone\b/i.test(body)) arr.push({ type: "everyone" });
  if (/@admins?\b/i.test(body)) arr.push({ type: "admins" });
  if (/@moderators?\b/i.test(body)) arr.push({ type: "moderators" });
  return arr;
}

// Fetch confirmed messages for a room via the gated community-content function.
async function fetchRoomMessages(communityId, roomId, cursorIso) {
  const extra = { room_id: roomId, deleted: false };
  if (cursorIso) extra.created_date = { $lt: cursorIso };
  const res = await mist.functions.invoke("listCommunityContent", {
    community_id: communityId,
    entity: "ChatV2RoomMessage",
    sort: "-created_date",
    limit: 50,
    extra,
  });
  return (res?.data?.items || []).map(norm).reverse();
}

export function useRoomMessages({ roomId, user, community }) {
  const communityId = community?.id;
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(!!roomId);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [atBottom, setAtBottom] = useState(true);
  const scrollRef = useRef(null);
  const oldestRef = useRef(null);

  // Initial load + live polling (reconciles optimistic temps on each tick).
  useEffect(() => {
    if (!roomId || !communityId) { setMessages([]); setLoading(false); return; }
    let active = true;
    setLoading(true);

    const poll = async () => {
      try {
        const list = await fetchRoomMessages(communityId, roomId);
        if (!active) return;
        oldestRef.current = list[0]?.created_date || null;
        setHasMore(list.length === 50);
        setMessages((prev) => {
          // Keep optimistic temps (sending/failed) not yet confirmed by the server.
          const temps = prev.filter((m) => String(m.id).startsWith("tmp_"));
          const confirmedIds = new Set(list.map((m) => m.id));
          const retainedTemps = temps.filter((t) => !confirmedIds.has(t.client_temp_id) && !(list.some((m) => m.client_temp_id === t.client_temp_id)));
          const merged = [...list];
          for (const t of retainedTemps) {
            const idx = merged.findIndex((m) => new Date(m.created_date) > new Date(t.created_date));
            if (idx === -1) merged.push(t); else merged.splice(idx, 0, t);
          }
          return merged;
        });
      } catch { /* best-effort */ }
      finally { if (active) setLoading(false); }
    };

    poll();
    // Pause polling when the tab is hidden — the realtime subscription (if any)
    // and optimistic UI keep the thread live; polling resumes on focus.
    const interval = setInterval(() => { if (document.visibilityState === "visible") poll(); }, 4000);
    return () => { active = false; clearInterval(interval); };
  }, [roomId, communityId]);

  const loadMore = useCallback(async () => {
    if (!roomId || !communityId || !hasMore || loadingMore || !oldestRef.current) return;
    setLoadingMore(true);
    try {
      const list = await fetchRoomMessages(communityId, roomId, oldestRef.current);
      if (list.length) {
        const prevHeight = scrollRef.current?.scrollHeight || 0;
        setMessages((prev) => [...list, ...prev]);
        oldestRef.current = list[0]?.created_date || oldestRef.current;
        setHasMore(list.length === 50);
        requestAnimationFrame(() => {
          if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight - prevHeight;
        });
      } else setHasMore(false);
    } finally { setLoadingMore(false); }
  }, [roomId, communityId, hasMore, loadingMore]);

  const send = useCallback(async (body, opts = {}) => {
    if (!roomId || !user?.id || (!body.trim() && !opts.attachment)) return;
    const tempId = "tmp_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
    const replyId = opts.replyTo?.id && !String(opts.replyTo.id).startsWith("tmp_") ? opts.replyTo.id : "";
    const attachment = opts.attachment || null;
    const attachments = attachment ? [attachment] : [];
    const messageType = attachment ? ((attachment.type || "").startsWith("image/") ? "image" : "file") : "text";
    const temp = {
      id: tempId, client_temp_id: tempId, room_id: roomId,
      community_id: communityId || "", community_slug: community?.slug || "", room_name: opts.roomName || "",
      sender_id: user.id, sender_name: user.full_name || user.email || "", sender_avatar: user.avatar_url || "",
      body: body.trim(), message_type: messageType, attachments, created_date: new Date().toISOString(), status: "sending", reactions: {},
      reply_to_message_id: replyId, reply_to_preview: (opts.replyTo?.body || "").slice(0, 120),
      reply_to_sender_id: opts.replyTo?.sender_id || "", reply_to_sender_name: opts.replyTo?.sender_name || "",
      mentions: JSON.stringify(parseMentionsArr(body)),
    };
    setMessages((prev) => [...prev, temp]);
    try {
      // Send through the server gate (enforces membership, mute, lock, slow mode).
      const res = await mist.functions.invoke("sendRoomMessage", {
        room_id: roomId, body: body.trim(),
        message_type: messageType, attachments: JSON.stringify(attachments),
        reply_to_message_id: replyId, reply_to_preview: temp.reply_to_preview,
        reply_to_sender_id: temp.reply_to_sender_id, reply_to_sender_name: temp.reply_to_sender_name,
        mentions: temp.mentions,
      });
      const created = res?.data?.message;
      if (!created) throw new Error(res?.data?.error || "Send failed");
      setMessages((prev) => prev.map((m) => (m.client_temp_id === tempId ? { ...m, id: created.id, status: "sent", created_date: created.created_date, body: created.body, message_type: created.message_type, attachments } : m)));
      return created;
    } catch (e) {
      setMessages((prev) => prev.map((m) => (m.client_temp_id === tempId ? { ...m, status: "failed" } : m)));
      throw e;
    }
  }, [roomId, communityId, user, community]);

  const react = useCallback(async (messageId, emoji) => {
    if (!user?.id) return;
    setMessages((prev) => prev.map((m) => {
      if (m.id !== messageId) return m;
      const reactions = { ...(m.reactions || {}) };
      const list = Array.isArray(reactions[emoji]) ? reactions[emoji] : [];
      const idx = list.indexOf(user.id);
      if (idx >= 0) list.splice(idx, 1); else list.push(user.id);
      if (list.length) reactions[emoji] = list; else delete reactions[emoji];
      return { ...m, reactions };
    }));
    try { await mist.functions.invoke("roomMessageAction", { action: "react", message_id: messageId, user_id: user.id, emoji }); } catch {}
  }, [user?.id]);

  const pin = useCallback(async (message) => {
    if (!user?.id) return;
    try { await mist.functions.invoke("roomMessageAction", { action: "pin", message_id: message.id, user_id: user.id, user_name: user.full_name || user.email, pinned: !message.pinned }); } catch {}
  }, [user?.id]);

  const editMessage = useCallback(async (messageId, body) => {
    try { await mist.functions.invoke("roomMessageAction", { action: "edit", message_id: messageId, user_id: user.id, body }); } catch {}
  }, [user?.id]);

  const deleteMessage = useCallback(async (messageId) => {
    setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, deleted: true } : m)));
    try { await mist.functions.invoke("roomMessageAction", { action: "delete", message_id: messageId, user_id: user.id }); } catch {}
  }, [user?.id]);

  // Server-gated moderation toggles (poll reconciles optimistic state).
  const moderate = useCallback(async (messageId, action, opts = {}) => {
    try {
      await mist.functions.invoke("roomMessageAction", { action, message_id: messageId, user_id: user.id, user_name: user.full_name || user.email, ...opts });
    } catch { /* poll reconciles */ }
  }, [user?.id]);

  const announce = useCallback((message) => moderate(message.id, "announce", { pinned: !message.is_announcement }), [moderate]);
  const sticky = useCallback((message) => moderate(message.id, "sticky", { pinned: !message.is_sticky }), [moderate]);
  const official = useCallback((message) => moderate(message.id, "official", { pinned: !message.is_official }), [moderate]);
  const bulkDelete = useCallback((messageIds, reason) =>
    mist.functions.invoke("roomMessageAction", { action: "bulk_delete", message_ids: messageIds, user_id: user.id, user_name: user.full_name || user.email, reason }), [user?.id]);
  const bulkSet = useCallback((messageIds, field, value) =>
    mist.functions.invoke("roomMessageAction", { action: "bulk_set", message_ids: messageIds, field, value, user_id: user.id, user_name: user.full_name || user.email }), [user?.id]);
  const clearHistory = useCallback((roomIdArg, reason) =>
    mist.functions.invoke("roomMessageAction", { action: "clear_history", room_id: roomIdArg, user_id: user.id, user_name: user.full_name || user.email, reason }), [user?.id]);

  return { messages, loading, loadingMore, hasMore, atBottom, setAtBottom, loadMore, send, react, pin, editMessage, deleteMessage, announce, sticky, official, bulkDelete, bulkSet, clearHistory, scrollRef };
}