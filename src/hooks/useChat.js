import { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";

export function useChat(mybbUser) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);

  const myUid = String(mybbUser?.uid || "");
  const myUidRef = useRef(myUid);
  const presenceIdRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const heartbeatRef = useRef(null);
  const lastTypingRef = useRef(0);

  useEffect(() => { myUidRef.current = myUid; }, [myUid]);

  // Load initial messages
  useEffect(() => {
    let mounted = true;
    base44.entities.ChatMessage.list("-created_date", 100).then((msgs) => {
      if (mounted) {
        setMessages(msgs.reverse());
        setLoading(false);
      }
    }).catch(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  // Subscribe to message events
  useEffect(() => {
    const unsub = base44.entities.ChatMessage.subscribe((event) => {
      if (event.type === "create") {
        if (String(event.data?.sender_uid || "") === myUidRef.current) return;
        setMessages((prev) =>
          prev.some((m) => m.id === event.data.id) ? prev : [...prev, event.data]
        );
      } else if (event.type === "update") {
        setMessages((prev) =>
          prev.map((m) => (m.id === event.data.id ? { ...m, ...event.data } : m))
        );
      } else if (event.type === "delete") {
        setMessages((prev) => prev.filter((m) => m.id !== event.id));
      }
    });
    return unsub;
  }, []);

  // Presence: set online, heartbeat, set offline on unmount
  useEffect(() => {
    if (!mybbUser?.uid) return;
    const uid = String(mybbUser.uid);

    const updatePresence = async (status) => {
      try {
        if (presenceIdRef.current) {
          await base44.entities.ChatPresence.update(presenceIdRef.current, {
            status,
            last_active: new Date().toISOString(),
          });
        } else {
          const existing = await base44.entities.ChatPresence.filter({ user_uid: uid });
          if (existing.length > 0) {
            presenceIdRef.current = existing[0].id;
            await base44.entities.ChatPresence.update(existing[0].id, {
              status,
              last_active: new Date().toISOString(),
            });
          } else {
            const rec = await base44.entities.ChatPresence.create({
              user_uid: uid,
              user_name: mybbUser.username,
              user_avatar: mybbUser.avatar || "",
              status,
              last_active: new Date().toISOString(),
            });
            presenceIdRef.current = rec.id;
          }
        }
      } catch {}
    };

    updatePresence("online");
    heartbeatRef.current = setInterval(() => updatePresence("online"), 30000);

    const onUnload = () => updatePresence("offline");
    window.addEventListener("beforeunload", onUnload);

    return () => {
      clearInterval(heartbeatRef.current);
      clearTimeout(typingTimeoutRef.current);
      window.removeEventListener("beforeunload", onUnload);
      updatePresence("offline");
    };
  }, [mybbUser?.uid]);

  // Load + subscribe to presence
  useEffect(() => {
    const loadPresence = async () => {
      try {
        const all = await base44.entities.ChatPresence.list("-last_active", 100);
        const now = Date.now();
        const active = all.filter(
          (p) =>
            p.user_uid !== myUidRef.current &&
            p.last_active &&
            now - new Date(p.last_active).getTime() < 120000
        );
        setOnlineUsers(active);
        setTypingUsers(active.filter((p) => p.status === "typing"));
      } catch {}
    };
    loadPresence();
    const interval = setInterval(loadPresence, 15000);
    const unsub = base44.entities.ChatPresence.subscribe(() => loadPresence());
    return () => { clearInterval(interval); unsub(); };
  }, []);

  // Send message (optimistic)
  const sendMessage = useCallback(async ({ text, imageFile, replyTo }) => {
    if (!text?.trim() && !imageFile) return;
    const tempId = `temp-${Date.now()}`;
    let image_url;

    if (imageFile) {
      try {
        const res = await base44.integrations.Core.UploadFile({ file: imageFile });
        image_url = res.file_url;
      } catch { return; }
    }

    const optimistic = {
      id: tempId,
      sender_uid: String(mybbUser.uid),
      sender_name: mybbUser.username,
      sender_avatar: mybbUser.avatar || "",
      content: text?.trim() || "",
      ...(image_url ? { image_url } : {}),
      created_date: new Date().toISOString(),
      _status: "sending",
      ...(replyTo ? {
        reply_to_id: replyTo.id,
        reply_to_name: replyTo.sender_name,
        reply_to_content: replyTo.content,
        reply_to_image: replyTo.image_url,
      } : {}),
    };

    setMessages((prev) => [...prev, optimistic]);

    try {
      const created = await base44.entities.ChatMessage.create({
        sender_uid: String(mybbUser.uid),
        sender_name: mybbUser.username,
        sender_avatar: mybbUser.avatar || "",
        content: text?.trim() || "",
        ...(image_url ? { image_url } : {}),
        ...(replyTo ? {
          reply_to_id: replyTo.id,
          reply_to_name: replyTo.sender_name,
          reply_to_content: replyTo.content,
          reply_to_image: replyTo.image_url,
        } : {}),
      });
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...created, _status: "sent" } : m))
      );
    } catch {
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, _status: "failed" } : m))
      );
    }
  }, [mybbUser]);

  // Delete message
  const deleteMessage = useCallback(async (id) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
    try { await base44.entities.ChatMessage.delete(id); } catch {}
  }, []);

  // Toggle reaction
  const toggleReaction = useCallback(async (messageId, emoji) => {
    const uid = String(mybbUser.uid);
    let newReactionsStr = "{}";

    setMessages((prev) => prev.map((m) => {
      if (m.id !== messageId) return m;
      let reactions = {};
      try { reactions = JSON.parse(m.reactions || "{}"); } catch {}
      if (!reactions[emoji]) reactions[emoji] = [];
      if (reactions[emoji].includes(uid)) {
        reactions[emoji] = reactions[emoji].filter((u) => u !== uid);
        if (reactions[emoji].length === 0) delete reactions[emoji];
      } else {
        reactions[emoji].push(uid);
      }
      newReactionsStr = JSON.stringify(reactions);
      return { ...m, reactions: newReactionsStr };
    }));

    try {
      await base44.entities.ChatMessage.update(messageId, { reactions: newReactionsStr });
    } catch {}
  }, [mybbUser]);

  // Set typing status
  const setTyping = useCallback(() => {
    const now = Date.now();
    if (now - lastTypingRef.current < 3000) return;
    lastTypingRef.current = now;
    if (presenceIdRef.current) {
      base44.entities.ChatPresence.update(presenceIdRef.current, {
        status: "typing",
        last_active: new Date().toISOString(),
      }).catch(() => {});
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        base44.entities.ChatPresence.update(presenceIdRef.current, {
          status: "online",
          last_active: new Date().toISOString(),
        }).catch(() => {});
      }, 3000);
    }
  }, []);

  return {
    messages, loading, typingUsers, onlineUsers,
    sendMessage, deleteMessage, toggleReaction, setTyping,
  };
}