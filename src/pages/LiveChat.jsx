import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useMyBBAuth } from "@/lib/MyBBAuthContext";
import { useChat } from "@/hooks/useChat";
import ChatAvatar from "@/components/chat/ChatAvatar";
import ChatMessageList from "@/components/chat/ChatMessageList";
import ChatComposer from "@/components/chat/ChatComposer";
import ChatMessageActions from "@/components/chat/ChatMessageActions";

const LOGO_URL = "https://media.base44.com/images/public/6a24d788be1af31b2258fab2/5e4366214_insomniacsgmrslogo.png";

export default function LiveChat() {
  const { mybbUser } = useMyBBAuth();
  const {
    messages, loading, typingUsers, onlineUsers,
    sendMessage, deleteMessage, toggleReaction, setTyping,
  } = useChat(mybbUser);

  const [actionMsg, setActionMsg] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [lastSeenTs, setLastSeenTs] = useState(null);

  const myUid = String(mybbUser?.uid || "");

  useEffect(() => {
    const ts = localStorage.getItem("chat_last_seen_ts");
    setLastSeenTs(ts);
    const t = setTimeout(() => {
      localStorage.setItem("chat_last_seen_ts", new Date().toISOString());
    }, 1500);
    return () => clearTimeout(t);
  }, []);

  const handleSend = async (text, imageFile) => {
    await sendMessage({ text, imageFile, replyTo });
    setReplyTo(null);
  };

  const typingNames = typingUsers.map((t) => t.user_name).join(", ");

  return (
    <div className="flex flex-col bg-background" style={{ height: "calc(100dvh - 80px)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-card/80 backdrop-blur-xl shrink-0">
        <Link to="/" className="text-muted-foreground hover:text-foreground -ml-1">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="w-9 h-9 rounded-full overflow-hidden border border-violet-500/30 shrink-0">
          <img src={LOGO_URL} alt="MIST" className="w-full h-full object-contain" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-bold text-foreground">MIST Live Chat</h1>
          <p className="text-[11px] text-emerald-400 flex items-center gap-1 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
            <span className="truncate">
              {typingUsers.length > 0 ? `${typingNames} typing...` : `${onlineUsers.length} online`}
            </span>
          </p>
        </div>
      </div>

      {/* Online members strip */}
      {onlineUsers.length > 0 && (
        <div className="px-4 py-2 border-b border-border bg-background/60 flex items-center gap-3 overflow-x-auto shrink-0 scrollbar-hide">
          {onlineUsers.slice(0, 20).map((m) => (
            <div key={m.user_uid} className="flex flex-col items-center gap-1 shrink-0">
              <ChatAvatar src={m.user_avatar} name={m.user_name} size="w-9 h-9" online showStatus />
              <span className="text-[9px] text-muted-foreground max-w-[42px] truncate">{m.user_name}</span>
            </div>
          ))}
        </div>
      )}

      {/* Messages */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <ChatMessageList
          messages={messages}
          myUid={myUid}
          typingUsers={typingUsers}
          onLongPress={setActionMsg}
          onReaction={toggleReaction}
          lastSeenTs={lastSeenTs}
        />
      )}

      {/* Composer */}
      <ChatComposer
        onSend={handleSend}
        onTyping={setTyping}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
      />

      {/* Message actions sheet */}
      <ChatMessageActions
        msg={actionMsg}
        myUid={myUid}
        onClose={() => setActionMsg(null)}
        onReply={(msg) => { setReplyTo(msg); setActionMsg(null); }}
        onReact={(msg, emoji) => { toggleReaction(msg.id, emoji); setActionMsg(null); }}
        onDelete={(msg) => { deleteMessage(msg.id); setActionMsg(null); }}
      />
    </div>
  );
}