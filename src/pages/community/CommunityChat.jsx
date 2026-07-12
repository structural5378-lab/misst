import React, { useState, useEffect, useRef } from 'react';
import { useCommunity } from '@/contexts/CommunityContext';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Send } from 'lucide-react';

export default function CommunityChat() {
  const { community, permissions, hasPermission } = useCommunity();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  const { data: initialMessages, isLoading } = useQuery({
    queryKey: ['community-chat', community.id],
    queryFn: async () => {
      return await base44.entities.ChatMessage.filter(
        { community_id: community.id },
        '-created_date',
        50
      );
    },
  });

  useEffect(() => {
    if (initialMessages) setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    const unsubscribe = base44.entities.ChatMessage.subscribe((event) => {
      if (event.data?.community_id === community.id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === event.data.id)) return prev;
          return [...prev, event.data];
        });
      }
    });
    return () => unsubscribe();
  }, [community.id]);

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