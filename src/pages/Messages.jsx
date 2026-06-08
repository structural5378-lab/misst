import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Edit2 } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import ConversationList from "@/components/messages/ConversationList";
import ChatView from "@/components/messages/ChatView";
import NewMessageModal from "@/components/messages/NewMessageModal";

export default function Messages() {
  const [user, setUser] = useState(null);
  const [activeChat, setActiveChat] = useState(null); // { userId, name }
  const [showCompose, setShowCompose] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["messages"],
    queryFn: () => base44.entities.DirectMessage.list("-created_date", 100),
    enabled: !!user,
    refetchInterval: 10000,
  });

  // Deduplicate into one conversation per contact (most recent message wins)
  const conversations = useMemo(() => {
    if (!user) return [];
    const seen = new Map();
    for (const msg of messages) {
      const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
      if (!seen.has(otherId)) seen.set(otherId, msg);
    }
    return Array.from(seen.values());
  }, [messages, user]);

  const handleSelectConversation = (conv) => {
    const otherId = conv.sender_id === user.id ? conv.receiver_id : conv.sender_id;
    const otherName = conv.sender_id === user.id ? conv.receiver_name : conv.sender_name;
    setActiveChat({ userId: otherId, name: otherName });
  };

  const handleSelectNewUser = (u) => {
    setShowCompose(false);
    setActiveChat({ userId: u.id, name: u.full_name || u.email });
  };

  if (activeChat) {
    return (
      <ChatView
        otherUserId={activeChat.userId}
        otherName={activeChat.name}
        currentUser={user}
        onBack={() => setActiveChat(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Messages"
        rightAction={
          <button
            onClick={() => setShowCompose(true)}
            className="p-2 text-violet-400 hover:text-violet-300 transition-colors"
          >
            <Edit2 className="w-5 h-5" />
          </button>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <ConversationList
          conversations={conversations}
          currentUserId={user?.id}
          onSelect={handleSelectConversation}
          onCompose={() => setShowCompose(true)}
        />
      )}

      {showCompose && user && (
        <NewMessageModal
          currentUser={user}
          onSelect={handleSelectNewUser}
          onClose={() => setShowCompose(false)}
        />
      )}
    </div>
  );
}