import React, { useState, useEffect, useRef } from 'react';
import { useCommunity } from '@/contexts/CommunityContext';
import { base44 } from '@/api/base44Client';
import { useCommunityContent } from '@/hooks/useCommunityContent';
import { Send } from 'lucide-react';

export default function CommunityChat() {
  const { community, permissions, hasPermission } = useCommunity();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  // Community-scoped, membership-validated message stream (polls the gated
  // listCommunityContent function — no open entity reads, no cross-community
  // subscription transit).
  const { data: chatData, isLoading } = useCommunityContent(community.id, 'ChatMessage', {
    sort: '-created_date',
    limit: 50,
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (chatData?.items) {
      setMessages(chatData.items);
    }
  }, [chatData]);

  // Presence: signal that the user is actively viewing this community chat so the
  // notification service suppresses community_chat alerts for new messages here.
  // Heartbeat every 30s keeps the flag fresh. On unmount, clear it. Also mark any
  // pre-existing unread community_chat notifications for this community as read
  // (opening the chat decrements the badge).
  useEffect(() => {
    const uid = permissions.user?.id;
    if (!uid) return;
    let active = true;

    const sync = async () => {
      try {
        const now = new Date().toISOString();
        const mine = await base44.entities.ChatPresence.filter({ user_uid: uid }, "-last_active", 5);
        if (mine.length) {
          await base44.entities.ChatPresence.update(mine[0].id, { active_chat_community_id: community.id, last_active: now, status: "online" });
        } else {
          await base44.entities.ChatPresence.create({ user_uid: uid, user_name: permissions.user?.full_name || "User", active_chat_community_id: community.id, last_active: now, status: "online" });
        }
        await base44.entities.Notification.updateMany(
          { recipient_id: uid, type: "community_chat", community_id: community.id, read: false },
          { $set: { read: true, read_at: now } }
        );
      } catch (e) { /* best-effort */ }
    };
    sync();
    const heartbeat = setInterval(sync, 30000);

    return () => {
      active = false;
      clearInterval(heartbeat);
      (async () => {
        try {
          const mine = await base44.entities.ChatPresence.filter({ user_uid: uid }, "-last_active", 5);
          if (mine.length && mine[0].active_chat_community_id === community.id) {
            await base44.entities.ChatPresence.update(mine[0].id, { active_chat_community_id: "" });
          }
        } catch { /* best-effort */ }
      })();
    };
  }, [community.id, permissions.user?.id]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    const content = input.trim();
    setInput('');
    try {
      await base44.entities.ChatMessage.create({
        sender_uid: permissions.user?.id,
        sender_name: permissions.user?.full_name || permissions.user?.email,
        community_id: community.id,
        community_name: community.name,
        content,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const canPost = hasPermission('community:post_chat');

  return (
    <div className="flex flex-col h-[calc(100dvh-3.5rem-4rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))]">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading && (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" />
          </div>
        )}
        {!isLoading && messages.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-8">
            No messages yet. Start the conversation!
          </p>
        )}
        {messages.map((msg) => {
          const isMine = msg.sender_uid === permissions.user?.id;
          return (
            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                  isMine ? 'bg-primary text-primary-foreground' : 'bg-card border border-border'
                }`}
              >
                {!isMine && (
                  <p className="text-xs font-medium text-primary mb-0.5">{msg.sender_name}</p>
                )}
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>
      {canPost && (
        <div className="flex items-center gap-2 p-3 border-t border-border bg-background">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="flex-1 bg-card border border-border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            onClick={handleSend}
            disabled={sending || !input.trim()}
            className="w-10 h-10 rounded-full bg-primary flex items-center justify-center disabled:opacity-50 shrink-0"
          >
            <Send className="w-4 h-4 text-primary-foreground" />
          </button>
        </div>
      )}
    </div>
  );
}