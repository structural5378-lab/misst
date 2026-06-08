import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Send } from "lucide-react";
import { format } from "date-fns";

export default function ChatView({ otherUserId, otherName, currentUser, onBack }) {
  const [text, setText] = useState("");
  const bottomRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: messages = [] } = useQuery({
    queryKey: ["chat", otherUserId],
    queryFn: async () => {
      const sent = await base44.entities.DirectMessage.filter({ sender_id: currentUser.id, receiver_id: otherUserId });
      const received = await base44.entities.DirectMessage.filter({ sender_id: otherUserId, receiver_id: currentUser.id });
      return [...sent, ...received].sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    },
    refetchInterval: 5000,
  });

  // Mark received messages as read
  useEffect(() => {
    messages
      .filter((m) => m.receiver_id === currentUser.id && !m.is_read)
      .forEach((m) => base44.entities.DirectMessage.update(m.id, { is_read: true }));
  }, [messages, currentUser.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMutation = useMutation({
    mutationFn: () =>
      base44.entities.DirectMessage.create({
        sender_id: currentUser.id,
        receiver_id: otherUserId,
        sender_name: currentUser.full_name || currentUser.callsign || "Member",
        receiver_name: otherName,
        content: text.trim(),
        is_read: false,
      }),
    onSuccess: () => {
      setText("");
      queryClient.invalidateQueries({ queryKey: ["chat", otherUserId] });
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
  });

  const handleSend = () => {
    if (!text.trim()) return;
    sendMutation.mutate();
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-white/[0.06] px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="text-violet-400 hover:text-violet-300 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-8 h-8 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
          <span className="text-xs font-bold text-violet-400">{(otherName || "?")[0].toUpperCase()}</span>
        </div>
        <span className="text-sm font-semibold text-foreground">{otherName}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-24">
        {messages.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-8">No messages yet. Say hello!</p>
        )}
        {messages.map((msg) => {
          const isMine = msg.sender_id === currentUser.id;
          return (
            <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                isMine
                  ? "bg-violet-600 text-white rounded-br-sm"
                  : "bg-white/[0.07] text-foreground rounded-bl-sm border border-white/[0.08]"
              }`}>
                <p className="leading-relaxed">{msg.content}</p>
                <p className={`text-[10px] mt-1 ${isMine ? "text-violet-200/70" : "text-muted-foreground"}`}>
                  {msg.created_date && format(new Date(msg.created_date), "h:mm a")}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-t border-white/[0.06] px-4 py-3 pb-safe">
        <div className="flex items-center gap-2 max-w-lg mx-auto">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Message..."
            className="flex-1 bg-white/[0.06] border border-white/[0.1] rounded-full px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-violet-500/50 transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || sendMutation.isPending}
            className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center shrink-0 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}