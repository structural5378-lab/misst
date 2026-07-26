import { useCallback, useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { cmpCreatedAsc, genTempId, isTempId, normalizeMessage, parseJSON } from "@/lib/chatV2/chatV2Utils";
import * as queue from "@/lib/chatV2/offlineQueue";

const PAGE = 30;

// useChatV2 — real-time message stream for one conversation.
//
// - Cursor-based pagination (created_date) loads the newest PAGE messages first;
//   older pages prepend while preserving scroll position.
// - Entity subscription delivers new messages instantly (create), status/read/
//   edit/delete changes (update), and removals (delete).
// - Optimistic send: a temp message is inserted immediately; the create event
//   merges it by client_temp_id (dedup). On failure the message shows a retry
//   state and is persisted in the offline queue.
// - Delivered/read receipts are written best-effort to the message record so the
//   sender's UI animates sent -> delivered -> read.
export function useChatV2({ conversationId, user }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [atBottom, setAtBottom] = useState(true);
  const oldestDateRef = useRef(null);
  const scrollRef = useRef(null);

  const loadInitial = useCallback(async () => {
    if (!conversationId) return;
    setLoading(true);
    const rows = await base44.entities.ChatV2Message
      .filter({ conversation_id: conversationId }, "-created_date", PAGE)
      .catch(() => []);
    const asc = (rows || []).sort(cmpCreatedAsc).map(normalizeMessage);
    setMessages(asc);
    setHasMore((rows || []).length >= PAGE);
    oldestDateRef.current = asc.length ? asc[0].created_date : null;
    setLoading(false);
  }, [conversationId]);

  useEffect(() => { loadInitial(); }, [loadInitial]);

  const loadMore = useCallback(async () => {
    if (!conversationId || loadingMore || !hasMore || !oldestDateRef.current) return;
    setLoadingMore(true);
    const el = scrollRef.current;
    const prevHeight = el?.scrollHeight || 0;
    const rows = await base44.entities.ChatV2Message
      .filter({ conversation_id: conversationId, created_date: { $lt: oldestDateRef.current } }, "-created_date", PAGE)
      .catch(() => []);
    const asc = (rows || []).sort(cmpCreatedAsc).map(normalizeMessage);
    setHasMore((rows || []).length >= PAGE);
    setMessages((prev) => [...asc, ...prev]);
    if (asc.length) oldestDateRef.current = asc[0].created_date;
    setLoadingMore(false);
    requestAnimationFrame(() => {
      if (el) { el.scrollTop = el.scrollTop + (el.scrollHeight - prevHeight); }
    });
  }, [conversationId, loadingMore, hasMore]);

  // Real-time subscription + delivered receipts.
  useEffect(() => {
    if (!conversationId || !user?.id) return;
    const unsub = base44.entities.ChatV2Message.subscribe((event) => {
      const m = normalizeMessage(event.data);
      if (!m || m.conversation_id !== conversationId) return;

      if (event.type === "delete") {
        setMessages((prev) => prev.filter((x) => x.id !== m.id));
        return;
      }
      if (event.type === "update") {
        setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, ...m } : x)));
        return;
      }
      // create
      setMessages((prev) => {
        if (prev.find((x) => x.id === m.id)) return prev; // dedup by id
        if (m.client_temp_id) {
          const idx = prev.findIndex((x) => x.client_temp_id === m.client_temp_id);
          if (idx >= 0) { const next = [...prev]; next[idx] = { ...next[idx], ...m, status: "delivered" }; return next; }
        }
        const next = [...prev, m];
        next.sort(cmpCreatedAsc);
        return next;
      });
      // delivered receipt (recipient side): acknowledge incoming messages
      if (m.sender_id !== user.id && m.id && !isTempId(m.id)) {
        const dt = parseJSON(m.delivered_to, []);
        if (!dt.includes(user.id)) {
          base44.entities.ChatV2Message.update(m.id, {
            delivered_to: JSON.stringify([...dt, user.id]),
            status: "delivered",
          }).catch(() => {});
        }
      }
    });
    return () => { try { unsub(); } catch {} };
  }, [conversationId, user?.id]);

  // Send (optimistic) + offline queue.
  const send = useCallback(async (body, opts = {}) => {
    if (!conversationId || !user?.id || !body?.trim()) return null;
    const tempId = genTempId();
    const now = new Date().toISOString();
    const optimistic = {
      id: tempId, client_temp_id: tempId, conversation_id: conversationId,
      sender_id: user.id, sender_name: user.displayName || "", sender_avatar: user.avatarUrl || "",
      body: body.trim(), message_type: "text", attachments: [], reactions: {},
      reply_to_message_id: opts.replyTo || "", reply_to_preview: opts.replyToPreview || "",
      deleted: false, status: "sending", read_by: [], delivered_to: [], created_date: now,
    };
    setMessages((prev) => [...prev, optimistic]);

    const payload = {
      conversation_id: conversationId,
      sender_id: user.id, sender_name: user.displayName || "", sender_avatar: user.avatarUrl || "",
      body: body.trim(), message_type: "text",
      attachments: JSON.stringify([]), reactions: JSON.stringify({}),
      reply_to_message_id: opts.replyTo || "", reply_to_preview: opts.replyToPreview || "",
      status: "sent", read_by: JSON.stringify([]), delivered_to: JSON.stringify([]),
      client_temp_id: tempId,
    };

    const persist = async () => {
      const created = await base44.entities.ChatV2Message.create(payload);
      const norm = normalizeMessage(created);
      setMessages((prev) => prev.map((x) => (x.client_temp_id === tempId ? { ...x, ...norm, status: "sent" } : x)));
      queue.remove(tempId);
    };

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      queue.enqueue({ client_temp_id: tempId, conversation_id: conversationId, payload });
      return tempId;
    }
    try { await persist(); }
    catch {
      setMessages((prev) => prev.map((x) => (x.client_temp_id === tempId ? { ...x, status: "failed" } : x)));
      queue.enqueue({ client_temp_id: tempId, conversation_id: conversationId, payload });
    }
    return tempId;
  }, [conversationId, user]);

  const retry = useCallback(async (tempId) => {
    const item = queue.getQueue().find((x) => x.client_temp_id === tempId);
    if (!item) return;
    setMessages((prev) => prev.map((x) => (x.client_temp_id === tempId ? { ...x, status: "sending" } : x)));
    try {
      const created = await base44.entities.ChatV2Message.create(item.payload);
      const norm = normalizeMessage(created);
      setMessages((prev) => prev.map((x) => (x.client_temp_id === tempId ? { ...x, ...norm, status: "sent" } : x)));
      queue.remove(tempId);
    } catch {
      setMessages((prev) => prev.map((x) => (x.client_temp_id === tempId ? { ...x, status: "failed" } : x)));
    }
  }, []);

  // Flush queued messages on reconnect.
  useEffect(() => {
    const flush = async () => {
      const q = queue.getQueue().filter((x) => x.conversation_id === conversationId);
      for (const item of q) {
        try {
          const created = await base44.entities.ChatV2Message.create(item.payload);
          const norm = normalizeMessage(created);
          setMessages((prev) => prev.map((x) => (x.client_temp_id === item.client_temp_id ? { ...x, ...norm, status: "sent" } : x)));
          queue.remove(item.client_temp_id);
        } catch { /* leave queued */ }
      }
    };
    const onOnline = () => flush();
    if (typeof navigator !== "undefined" && navigator.onLine) flush();
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [conversationId]);

  // Mark conversation read (resets unread badge + writes read_by for others' messages).
  const markRead = useCallback(async () => {
    if (!conversationId || !user?.id) return;
    const myParts = await base44.entities.ChatV2Participant
      .filter({ conversation_id: conversationId, user_id: user.id }, "-joined_at", 5)
      .catch(() => []);
    const part = myParts?.[0];
    if (!part) return;
    const lastMsg = messages[messages.length - 1];
    const lastId = lastMsg && !isTempId(lastMsg.id) ? lastMsg.id : (part.last_read_message_id || "");
    await base44.entities.ChatV2Participant.update(part.id, {
      unread_count: 0, last_read_message_id: lastId, last_read_at: new Date().toISOString(),
    }).catch(() => {});
    const toMark = messages.filter((m) => m.sender_id !== user.id && !(m.read_by || []).includes(user.id) && m.id && !isTempId(m.id));
    if (toMark.length) {
      const updates = toMark.map((m) => ({ id: m.id, read_by: JSON.stringify([...(m.read_by || []), user.id]) }));
      await base44.entities.ChatV2Message.bulkUpdate(updates).catch(() => {});
      setMessages((prev) => prev.map((m) => ((m.sender_id === user.id || (m.read_by || []).includes(user.id) || isTempId(m.id)) ? m : { ...m, read_by: [...(m.read_by || []), user.id] })));
    }
  }, [conversationId, user?.id, messages]);

  // Reactions: toggle the current user's emoji in the message's reactions map.
  const react = useCallback(async (messageId, emoji) => {
    if (!messageId || isTempId(messageId) || !user?.id) return;
    const target = messages.find((m) => m.id === messageId);
    if (!target) return;
    const cur = { ...(target.reactions || {}) };
    const list = cur[emoji] || [];
    const has = list.includes(user.id);
    const nextList = has ? list.filter((u) => u !== user.id) : [...list, user.id];
    const next = { ...cur };
    if (nextList.length) next[emoji] = nextList; else delete next[emoji];
    setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, reactions: next } : m)));
    await base44.entities.ChatV2Message.update(messageId, { reactions: JSON.stringify(next) }).catch(() => {});
  }, [messages, user?.id]);

  // Edit / delete (sender only).
  const editMessage = useCallback(async (messageId, newBody) => {
    if (!messageId || isTempId(messageId)) return;
    setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, body: newBody, edited_at: new Date().toISOString() } : m)));
    await base44.entities.ChatV2Message.update(messageId, { body: newBody, edited_at: new Date().toISOString() }).catch(() => {});
  }, []);

  const deleteMessage = useCallback(async (messageId) => {
    if (!messageId || isTempId(messageId)) return;
    setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, deleted: true } : m)));
    await base44.entities.ChatV2Message.update(messageId, { deleted: true, body: "" }).catch(() => {});
  }, []);

  return {
    messages, loading, loadingMore, hasMore, atBottom, setAtBottom,
    loadMore, send, retry, markRead, editMessage, deleteMessage, react, scrollRef,
  };
}