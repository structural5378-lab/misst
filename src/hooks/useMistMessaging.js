import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

/**
 * useMistMessaging — Native MIST Direct Messaging hook.
 * Handles conversations, messages, real-time updates, presence, typing,
 * read receipts, pin/archive, block list, and search.
 * Completely independent of MyBB. Uses Base44 user IDs.
 */
export function useMistMessaging() {
  const { user } = useAuth();
  const userId = user?.id || null;

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [onlineUserIds, setOnlineUserIds] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState({}); // { conversationId: { userId: timestamp } }
  const [searchQuery, setSearchQuery] = useState("");
  const [messageSearchQuery, setMessageSearchQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  // Refs for stable access in subscriptions
  const activeConvRef = useRef(null);
  const userIdRef = useRef(userId);
  const conversationsRef = useRef([]);
  const presenceIdRef = useRef(null);
  const heartbeatRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const lastTypingRef = useRef(0);

  useEffect(() => { activeConvRef.current = activeConversationId; }, [activeConversationId]);
  useEffect(() => { userIdRef.current = userId; }, [userId]);
  useEffect(() => { conversationsRef.current = conversations; }, [conversations]);

  // ─── Load Conversation List ─────────────────────────────────────────────
  const loadConversations = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    try {
      setLoading(true);
      // 1. Get my participant records
      const myParts = await base44.entities.ConversationParticipant.filter(
        { user_id: userId }, "-is_pinned", 200
      );
      if (myParts.length === 0) { setConversations([]); setLoading(false); return; }

      const convIds = myParts.map((p) => p.conversation_id);

      // 2. Get all conversations and all participants in parallel
      const [convRecords, allParts] = await Promise.all([
        base44.entities.Conversation.filter({ id: { $in: convIds } }, "-last_message_at", 200),
        base44.entities.ConversationParticipant.filter(
          { conversation_id: { $in: convIds } }, "-joined_at", 500
        ),
      ]);

      // 3. Group participants by conversation
      const partsByConv = {};
      allParts.forEach((p) => {
        if (!partsByConv[p.conversation_id]) partsByConv[p.conversation_id] = [];
        partsByConv[p.conversation_id].push(p);
      });

      // 4. Build conversation objects
      const built = convRecords.map((conv) => {
        const parts = partsByConv[conv.id] || [];
        const myPart = parts.find((p) => p.user_id === userId) || {};
        const otherParts = parts.filter((p) => p.user_id !== userId);
        return {
          ...conv,
          participants: parts,
          otherParticipants: otherParts,
          myParticipant: myPart,
          unreadCount: myPart.unread_count || 0,
          isPinned: myPart.is_pinned || false,
          isArchived: myPart.is_archived || false,
          isMuted: myPart.is_muted || false,
        };
      });

      setConversations(built);
    } catch (err) {
      console.error("Failed to load conversations:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // ─── Load Messages for Active Conversation ─────────────────────────────
  const loadMessages = useCallback(async (convId) => {
    if (!convId) { setMessages([]); return; }
    try {
      setMessagesLoading(true);
      const msgs = await base44.entities.DMMessage.filter(
        { conversation_id: convId }, "-created_date", 100
      );
      setMessages(msgs.reverse());
    } catch (err) {
      console.error("Failed to load messages:", err);
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  // ─── Load Blocked Users ─────────────────────────────────────────────────
  const loadBlockedUsers = useCallback(async () => {
    if (!userId) return;
    try {
      const blocked = await base44.entities.BlockedUser.filter({ user_id: userId }, "-blocked_at", 200);
      setBlockedUsers(blocked);
    } catch (err) {
      console.error("Failed to load blocked users:", err);
    }
  }, [userId]);

  // ─── Presence: Online status + heartbeat ───────────────────────────────
  useEffect(() => {
    if (!userId) return;

    const updatePresence = async (status) => {
      try {
        const existing = await base44.entities.UserPresence.filter({ user_id: userId });
        if (existing.length > 0) {
          presenceIdRef.current = existing[0].id;
          await base44.entities.UserPresence.update(existing[0].id, {
            status,
            last_active: new Date().toISOString(),
          });
        } else {
          const rec = await base44.entities.UserPresence.create({
            user_id: userId,
            user_name: user.full_name || user.email || "User",
            user_avatar: user.avatar_url || "",
            status,
            last_active: new Date().toISOString(),
          });
          presenceIdRef.current = rec.id;
        }
      } catch {}
    };

    updatePresence("online");
    heartbeatRef.current = setInterval(() => updatePresence("online"), 30000);

    const onUnload = () => updatePresence("offline");
    window.addEventListener("beforeunload", onUnload);

    return () => {
      clearInterval(heartbeatRef.current);
      window.removeEventListener("beforeunload", onUnload);
      updatePresence("offline");
    };
  }, [userId, user?.full_name, user?.email, user?.avatar_url]);

  // ─── Subscribe to presence for online status ────────────────────────────
  useEffect(() => {
    const loadPresence = async () => {
      try {
        const all = await base44.entities.UserPresence.list("-last_active", 200);
        const now = Date.now();
        const online = new Set(
          all
            .filter((p) => p.user_id !== userIdRef.current && p.last_active && now - new Date(p.last_active).getTime() < 120000)
            .map((p) => p.user_id)
        );
        setOnlineUserIds(online);
      } catch {}
    };
    loadPresence();
    const interval = setInterval(loadPresence, 15000);
    const unsub = base44.entities.UserPresence.subscribe(() => {
      loadPresence();
    });
    return () => { clearInterval(interval); unsub(); };
  }, []);

  // ─── Subscribe to DMMessage events (real-time) ──────────────────────────
  useEffect(() => {
    const unsub = base44.entities.DMMessage.subscribe((event) => {
      const msg = event.data;
      if (!msg || !msg.conversation_id) return;
      const myId = userIdRef.current;

      // Update messages if in active conversation
      if (msg.conversation_id === activeConvRef.current) {
        if (event.type === "create") {
          setMessages((prev) =>
            prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]
          );
          // Mark as read if message is from someone else
          if (msg.sender_id !== myId) {
            markAsRead(msg.conversation_id);
          }
        } else if (event.type === "update") {
          setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, ...msg } : m)));
        } else if (event.type === "delete") {
          setMessages((prev) => prev.filter((m) => m.id !== event.id));
        }
      }

      // Update conversation list for new messages
      if (event.type === "create" && msg.sender_id !== myId) {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === msg.conversation_id
              ? {
                  ...c,
                  last_message_at: msg.created_date,
                  last_message_preview: msg.content || (msg.image_url ? "📷 Photo" : "📎 File"),
                  last_message_sender_name: msg.sender_name,
                  last_message_sender_id: msg.sender_id,
                  unreadCount: activeConvRef.current === msg.conversation_id ? 0 : (c.unreadCount || 0) + 1,
                }
              : c
          )
        );
      } else if (event.type === "create" && msg.sender_id === myId) {
        // My own message — update preview but don't increment unread
        setConversations((prev) =>
          prev.map((c) =>
            c.id === msg.conversation_id
              ? {
                  ...c,
                  last_message_at: msg.created_date,
                  last_message_preview: msg.content || (msg.image_url ? "📷 Photo" : "📎 File"),
                  last_message_sender_name: msg.sender_name,
                  last_message_sender_id: msg.sender_id,
                }
              : c
          )
        );
      }
    });
    return unsub;
  }, []);

  // ─── Subscribe to ConversationParticipant events (typing, unread) ────────
  useEffect(() => {
    const unsub = base44.entities.ConversationParticipant.subscribe((event) => {
      const part = event.data;
      if (!part) return;

      // Typing indicator
      if (part.typing_at && part.user_id !== userIdRef.current) {
        const typingAge = Date.now() - new Date(part.typing_at).getTime();
        if (typingAge < 3000) {
          setTypingUsers((prev) => ({
            ...prev,
            [part.conversation_id]: {
              ...(prev[part.conversation_id] || {}),
              [part.user_id]: part.typing_at,
            },
          }));
        }
      }

      // Unread count or pin/archive changes for my participant records
      if (part.user_id === userIdRef.current && event.type === "update") {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === part.conversation_id
              ? {
                  ...c,
                  unreadCount: part.unread_count || 0,
                  isPinned: part.is_pinned || false,
                  isArchived: part.is_archived || false,
                  isMuted: part.is_muted || false,
                  myParticipant: { ...c.myParticipant, ...part },
                }
              : c
          )
        );
      }
    });
    return unsub;
  }, []);

  // ─── Subscribe to Conversation events (last message updates) ─────────────
  useEffect(() => {
    const unsub = base44.entities.Conversation.subscribe((event) => {
      const conv = event.data;
      if (!conv) return;
      setConversations((prev) =>
        prev.map((c) => (c.id === conv.id ? { ...c, ...conv } : c))
      );
    });
    return unsub;
  }, []);

  // ─── Initial load ────────────────────────────────────────────────────────
  useEffect(() => {
    loadConversations();
    loadBlockedUsers();
  }, [loadConversations, loadBlockedUsers]);

  // ─── Load messages when active conversation changes ──────────────────────
  useEffect(() => {
    if (activeConversationId) {
      loadMessages(activeConversationId);
      markAsRead(activeConversationId);
    } else {
      setMessages([]);
    }
  }, [activeConversationId, loadMessages]);

  // ─── Select Conversation ─────────────────────────────────────────────────
  const selectConversation = useCallback((convId) => {
    setActiveConversationId(convId);
  }, []);

  // ─── Send Message ─────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (content, imageFile, fileAttachment, replyTo) => {
    if (!userId || !activeConversationId) return;
    if (!content?.trim() && !imageFile && !fileAttachment) return;

    const conv = conversationsRef.current.find((c) => c.id === activeConversationId);
    if (!conv) return;

    const tempId = `temp-${Date.now()}`;
    const now = new Date().toISOString();

    const optimistic = {
      id: tempId,
      conversation_id: activeConversationId,
      sender_id: userId,
      sender_name: user.full_name || user.email || "You",
      sender_avatar: user.avatar_url || "",
      content: content?.trim() || "",
      created_date: now,
      _status: "sending",
      ...(replyTo ? {
        reply_to_id: replyTo.id,
        reply_to_content: replyTo.content,
        reply_to_sender_name: replyTo.sender_name,
      } : {}),
    };

    setMessages((prev) => [...prev, optimistic]);

    try {
      let image_url = "";
      let file_url = "";
      let file_name = "";
      let file_size = 0;
      let last_message_type = "text";

      if (imageFile) {
        const res = await base44.integrations.Core.UploadFile({ file: imageFile });
        image_url = res.file_url;
        last_message_type = "image";
        setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, image_url } : m)));
      }

      if (fileAttachment) {
        const res = await base44.integrations.Core.UploadFile({ file: fileAttachment });
        file_url = res.file_url;
        file_name = fileAttachment.name;
        file_size = fileAttachment.size;
        last_message_type = "file";
      }

      const created = await base44.entities.DMMessage.create({
        conversation_id: activeConversationId,
        sender_id: userId,
        sender_name: user.full_name || user.email || "You",
        sender_avatar: user.avatar_url || "",
        content: content?.trim() || "",
        ...(image_url ? { image_url } : {}),
        ...(file_url ? { file_url, file_name, file_size } : {}),
        ...(replyTo ? {
          reply_to_id: replyTo.id,
          reply_to_content: replyTo.content,
          reply_to_sender_name: replyTo.sender_name,
        } : {}),
      });

      setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...created, _status: "sent" } : m)));

      // Update conversation metadata
      const preview = content?.trim() || (image_url ? "📷 Photo" : file_name || "📎 File");
      await base44.entities.Conversation.update(activeConversationId, {
        last_message_at: now,
        last_message_preview: preview,
        last_message_sender_name: user.full_name || user.email || "You",
        last_message_sender_id: userId,
        last_message_type,
      });

      // Increment unread for other participants
      await base44.entities.ConversationParticipant.updateMany(
        { conversation_id: activeConversationId, user_id: { $ne: userId } },
        { $inc: { unread_count: 1 } }
      ).catch(() => {});
    } catch (err) {
      console.error("Failed to send message:", err);
      setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, _status: "failed" } : m)));
    }
  }, [userId, user, activeConversationId]);

  // ─── Create Direct Conversation (find or create) ─────────────────────────
  const createDirectConversation = useCallback(async (otherUserId, otherUserName, otherUserAvatar, otherUserCallsign) => {
    if (!userId) return null;

    // Check if conversation already exists
    const existing = conversationsRef.current.find((c) => {
      if (c.type !== "direct") return false;
      return c.otherParticipants.some((p) => p.user_id === otherUserId);
    });
    if (existing) return existing.id;

    try {
      const now = new Date().toISOString();
      const conv = await base44.entities.Conversation.create({
        type: "direct",
        created_by: userId,
        created_by_name: user.full_name || user.email || "You",
        last_message_at: now,
      });

      await base44.entities.ConversationParticipant.bulkCreate([
        {
          conversation_id: conv.id,
          user_id: userId,
          user_name: user.full_name || user.email || "You",
          user_avatar: user.avatar_url || "",
          user_callsign: user.callsign || "",
          role: "admin",
          joined_at: now,
          last_read_at: now,
          unread_count: 0,
        },
        {
          conversation_id: conv.id,
          user_id: otherUserId,
          user_name: otherUserName,
          user_avatar: otherUserAvatar || "",
          user_callsign: otherUserCallsign || "",
          role: "member",
          joined_at: now,
          last_read_at: null,
          unread_count: 0,
        },
      ]);

      await loadConversations();
      return conv.id;
    } catch (err) {
      console.error("Failed to create conversation:", err);
      return null;
    }
  }, [userId, user, loadConversations]);

  // ─── Create Group Conversation ────────────────────────────────────────────
  const createGroupConversation = useCallback(async (title, participants) => {
    if (!userId) return null;
    try {
      const now = new Date().toISOString();
      const conv = await base44.entities.Conversation.create({
        type: "group",
        title,
        created_by: userId,
        created_by_name: user.full_name || user.email || "You",
        last_message_at: now,
      });

      const allParts = [
        {
          conversation_id: conv.id,
          user_id: userId,
          user_name: user.full_name || user.email || "You",
          user_avatar: user.avatar_url || "",
          user_callsign: user.callsign || "",
          role: "admin",
          joined_at: now,
          last_read_at: now,
          unread_count: 0,
        },
        ...participants.map((p) => ({
          conversation_id: conv.id,
          user_id: p.id,
          user_name: p.full_name || p.email || "User",
          user_avatar: p.avatar_url || "",
          user_callsign: p.callsign || "",
          role: "member",
          joined_at: now,
          last_read_at: null,
          unread_count: 0,
        })),
      ];

      await base44.entities.ConversationParticipant.bulkCreate(allParts);
      await loadConversations();
      return conv.id;
    } catch (err) {
      console.error("Failed to create group:", err);
      return null;
    }
  }, [userId, user, loadConversations]);

  // ─── Mark As Read ──────────────────────────────────────────────────────────
  const markAsRead = useCallback(async (convId) => {
    if (!userId || !convId) return;
    const conv = conversationsRef.current.find((c) => c.id === convId);
    if (!conv || conv.unreadCount === 0) return;

    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, unreadCount: 0 } : c))
    );

    try {
      const myPart = conv.participants.find((p) => p.user_id === userId);
      if (myPart) {
        await base44.entities.ConversationParticipant.update(myPart.id, {
          unread_count: 0,
          last_read_at: new Date().toISOString(),
        });
      }
    } catch {}
  }, [userId]);

  // ─── Toggle Pin ─────────────────────────────────────────────────────────────
  const togglePin = useCallback(async (convId) => {
    if (!userId) return;
    const conv = conversationsRef.current.find((c) => c.id === convId);
    if (!conv) return;
    const newPinned = !conv.isPinned;
    setConversations((prev) => prev.map((c) => (c.id === convId ? { ...c, isPinned: newPinned } : c)));
    try {
      const myPart = conv.participants.find((p) => p.user_id === userId);
      if (myPart) await base44.entities.ConversationParticipant.update(myPart.id, { is_pinned: newPinned });
    } catch {}
  }, [userId]);

  // ─── Toggle Archive ─────────────────────────────────────────────────────────
  const toggleArchive = useCallback(async (convId) => {
    if (!userId) return;
    const conv = conversationsRef.current.find((c) => c.id === convId);
    if (!conv) return;
    const newArchived = !conv.isArchived;
    setConversations((prev) => prev.map((c) => (c.id === convId ? { ...c, isArchived: newArchived } : c)));
    try {
      const myPart = conv.participants.find((p) => p.user_id === userId);
      if (myPart) await base44.entities.ConversationParticipant.update(myPart.id, { is_archived: newArchived });
    } catch {}
  }, [userId]);

  // ─── Toggle Mute ─────────────────────────────────────────────────────────────
  const toggleMute = useCallback(async (convId) => {
    if (!userId) return;
    const conv = conversationsRef.current.find((c) => c.id === convId);
    if (!conv) return;
    const newMuted = !conv.isMuted;
    setConversations((prev) => prev.map((c) => (c.id === convId ? { ...c, isMuted: newMuted } : c)));
    try {
      const myPart = conv.participants.find((p) => p.user_id === userId);
      if (myPart) await base44.entities.ConversationParticipant.update(myPart.id, { is_muted: newMuted });
    } catch {}
  }, [userId]);

  // ─── Delete Message ──────────────────────────────────────────────────────────
  const deleteMessage = useCallback(async (messageId) => {
    setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, is_deleted: true, content: "" } : m)));
    try {
      await base44.entities.DMMessage.update(messageId, { is_deleted: true, content: "" });
    } catch {}
  }, []);

  // ─── Edit Message ───────────────────────────────────────────────────────────
  const editMessage = useCallback(async (messageId, newContent) => {
    setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, content: newContent, edited_at: new Date().toISOString() } : m)));
    try {
      await base44.entities.DMMessage.update(messageId, { content: newContent, edited_at: new Date().toISOString() });
    } catch {}
  }, []);

  // ─── Block User ─────────────────────────────────────────────────────────────
  const blockUser = useCallback(async (blockedUserId, blockedUserName, blockedUserAvatar) => {
    if (!userId) return;
    try {
      await base44.entities.BlockedUser.create({
        user_id: userId,
        blocked_user_id: blockedUserId,
        blocked_user_name: blockedUserName,
        blocked_user_avatar: blockedUserAvatar || "",
        blocked_at: new Date().toISOString(),
      });
      loadBlockedUsers();
    } catch {}
  }, [userId, loadBlockedUsers]);

  // ─── Unblock User ────────────────────────────────────────────────────────────
  const unblockUser = useCallback(async (blockedUserId) => {
    if (!userId) return;
    try {
      const records = await base44.entities.BlockedUser.filter({ user_id: userId, blocked_user_id: blockedUserId });
      await Promise.all(records.map((r) => base44.entities.BlockedUser.delete(r.id)));
      loadBlockedUsers();
    } catch {}
  }, [userId, loadBlockedUsers]);

  // ─── Set Typing ──────────────────────────────────────────────────────────────
  const setTyping = useCallback(() => {
    if (!userId || !activeConversationId) return;
    const now = Date.now();
    if (now - lastTypingRef.current < 3000) return;
    lastTypingRef.current = now;

    const conv = conversationsRef.current.find((c) => c.id === activeConversationId);
    if (!conv) return;
    const myPart = conv.participants.find((p) => p.user_id === userId);
    if (myPart) {
      base44.entities.ConversationParticipant.update(myPart.id, {
        typing_at: new Date().toISOString(),
      }).catch(() => {});
    }
  }, [userId, activeConversationId]);

  // ─── Leave Conversation ──────────────────────────────────────────────────────
  const leaveConversation = useCallback(async (convId) => {
    if (!userId) return;
    const conv = conversationsRef.current.find((c) => c.id === convId);
    if (!conv) return;
    const myPart = conv.participants.find((p) => p.user_id === userId);
    if (myPart) {
      try {
        await base44.entities.ConversationParticipant.delete(myPart.id);
        setActiveConversationId(null);
        loadConversations();
      } catch {}
    }
  }, [userId, loadConversations]);

  // ─── Derived values ──────────────────────────────────────────────────────────
  const unreadTotal = useMemo(
    () => conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0),
    [conversations]
  );

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeConversationId) || null,
    [conversations, activeConversationId]
  );

  const filteredConversations = useMemo(() => {
    let list = conversations.filter((c) => showArchived ? c.isArchived : !c.isArchived);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((c) => {
        if (c.type === "group") {
          return c.title?.toLowerCase().includes(q);
        }
        return c.otherParticipants.some((p) =>
          p.user_name?.toLowerCase().includes(q) ||
          p.user_callsign?.toLowerCase().includes(q)
        );
      });
    }
    // Sort: pinned first, then by last_message_at desc
    return list.sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return new Date(b.last_message_at || 0) - new Date(a.last_message_at || 0);
    });
  }, [conversations, searchQuery, showArchived]);

  const filteredMessages = useMemo(() => {
    if (!messageSearchQuery.trim()) return messages;
    const q = messageSearchQuery.toLowerCase();
    return messages.filter((m) => m.content?.toLowerCase().includes(q));
  }, [messages, messageSearchQuery]);

  const isUserBlocked = useCallback((otherUserId) => {
    return blockedUsers.some((b) => b.blocked_user_id === otherUserId);
  }, [blockedUsers]);

  return {
    // State
    conversations: filteredConversations,
    allConversations: conversations,
    loading,
    activeConversation,
    activeConversationId,
    messages: filteredMessages,
    allMessages: messages,
    messagesLoading,
    blockedUsers,
    unreadTotal,
    onlineUserIds,
    typingUsers,
    searchQuery,
    messageSearchQuery,
    showArchived,
    user,
    // Actions
    selectConversation,
    setActiveConversationId,
    sendMessage,
    createDirectConversation,
    createGroupConversation,
    markAsRead,
    togglePin,
    toggleArchive,
    toggleMute,
    deleteMessage,
    editMessage,
    blockUser,
    unblockUser,
    setTyping,
    leaveConversation,
    setSearchQuery,
    setMessageSearchQuery,
    setShowArchived,
    isUserBlocked,
    loadConversations,
  };
}