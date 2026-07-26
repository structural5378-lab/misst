import { useEffect, useRef, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";

// useRoomMessages — realtime message stream for one Chat V2 room. Handles
// initial load, cursor history pagination (position-preserving), optimistic
// send with temp-id dedup, and react/pin/edit/delete via the roomMessageAction
// backend function (service role).
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

export function useRoomMessages({ roomId, user, community }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(!!roomId);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [atBottom, setAtBottom] = useState(true);
  const scrollRef = useRef(null);
  const oldestRef = useRef(null);

  const loadInitial = useCallback(async () => {
    if (!roomId) { setMessages([]); setLoading(false); return; }
    setLoading(true);
    try {
      const list = await base44.entities.ChatV2RoomMessage.filter({ room_id: roomId, deleted: false }, "-created_date", 50).catch(() => []);
      const arr = (list || []).map(norm).reverse();
      setMessages(arr);
      oldestRef.current = arr[0]?.created_date || null;
      setHasMore(arr.length === 50);
    } finally { setLoading(false); }
  }, [roomId]);

  useEffect(() => { loadInitial(); }, [loadInitial]);

  useEffect(() => {
    if (!roomId) return;
    const unsub = base44.entities.ChatV2RoomMessage.subscribe((event) => {
      const m = event.data;
      if (!m || m.room_id !== roomId) return;
      setMessages((prev) => {
        if (event.type === "delete") return prev.filter((x) => x.id !== event.id);
        const n = norm(m);
        const idx = prev.findIndex((x) => x.id === n.id || (n.client_temp_id && x.client_temp_id === n.client_temp_id));
        if (idx >= 0) { const next = [...prev]; next[idx] = { ...next[idx], ...n }; return next; }
        const next = [...prev, n];
        next.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
        return next;
      });
    });
    return unsub;
  }, [roomId]);

  const loadMore = useCallback(async () => {
    if (!roomId || !hasMore || loadingMore || !oldestRef.current) return;
    setLoadingMore(true);
    try {
      const list = await base44.entities.ChatV2RoomMessage.filter(
        { room_id: roomId, deleted: false, created_date: { $lt: oldestRef.current } },
        "-created_date", 50
      ).catch(() => []);
      const arr = (list || []).map(norm).reverse();
      if (arr.length) {
        const prevHeight = scrollRef.current?.scrollHeight || 0;
        setMessages((prev) => [...arr, ...prev]);
        oldestRef.current = arr[0]?.created_date || oldestRef.current;
        setHasMore(arr.length === 50);
        requestAnimationFrame(() => {
          if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight - prevHeight;
        });
      } else setHasMore(false);
    } finally { setLoadingMore(false); }
  }, [roomId, hasMore, loadingMore]);

  const send = useCallback(async (body, opts = {}) => {
    if (!roomId || !user?.id || !body.trim()) return;
    const tempId = "tmp_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
    const temp = {
      id: tempId, client_temp_id: tempId, room_id: roomId,
      community_id: community?.id || "", community_slug: community?.slug || "", room_name: opts.roomName || "",
      sender_id: user.id, sender_name: user.full_name || user.email || "", sender_avatar: user.avatar_url || "",
      body: body.trim(), created_date: new Date().toISOString(), status: "sending", reactions: {},
      reply_to_message_id: opts.replyTo?.id && !String(opts.replyTo.id).startsWith("tmp_") ? opts.replyTo.id : "",
      reply_to_preview: (opts.replyTo?.body || "").slice(0, 120),
      reply_to_sender_id: opts.replyTo?.sender_id || "",
      reply_to_sender_name: opts.replyTo?.sender_name || "",
      mentions: JSON.stringify(parseMentionsArr(body)),
    };
    setMessages((prev) => [...prev, temp]);
    try {
      const created = await base44.entities.ChatV2RoomMessage.create({
        room_id: roomId, community_id: community?.id || "", community_slug: community?.slug || "", room_name: opts.roomName || "",
        sender_id: user.id, sender_name: user.full_name || user.email || "", sender_avatar: user.avatar_url || "",
        body: body.trim(), message_type: "text", reactions: "", mentions: JSON.stringify(parseMentionsArr(body)),
        reply_to_message_id: temp.reply_to_message_id, reply_to_preview: temp.reply_to_preview,
        reply_to_sender_id: temp.reply_to_sender_id, reply_to_sender_name: temp.reply_to_sender_name,
        client_temp_id: tempId, status: "sent",
      });
      setMessages((prev) => prev.map((m) => (m.client_temp_id === tempId ? { ...m, id: created.id, status: "sent", created_date: created.created_date } : m)));
    } catch {
      setMessages((prev) => prev.map((m) => (m.client_temp_id === tempId ? { ...m, status: "failed" } : m)));
    }
  }, [roomId, user, community]);

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
    try { await base44.functions.invoke("roomMessageAction", { action: "react", message_id: messageId, user_id: user.id, emoji }); } catch {}
  }, [user?.id]);

  const pin = useCallback(async (message) => {
    if (!user?.id) return;
    try { await base44.functions.invoke("roomMessageAction", { action: "pin", message_id: message.id, user_id: user.id, user_name: user.full_name || user.email, pinned: !message.pinned }); } catch {}
  }, [user?.id]);

  const editMessage = useCallback(async (messageId, body) => {
    try { await base44.functions.invoke("roomMessageAction", { action: "edit", message_id: messageId, user_id: user.id, body }); } catch {}
  }, [user?.id]);

  const deleteMessage = useCallback(async (messageId) => {
    setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, deleted: true } : m)));
    try { await base44.functions.invoke("roomMessageAction", { action: "delete", message_id: messageId, user_id: user.id }); } catch {}
  }, [user?.id]);

  return { messages, loading, loadingMore, hasMore, atBottom, setAtBottom, loadMore, send, react, pin, editMessage, deleteMessage, scrollRef };
}