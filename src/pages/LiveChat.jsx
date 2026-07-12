import React, { useState, useEffect, useRef } from "react";
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
  const rootRef = useRef(null);

  const myUid = String(mybbUser?.uid || "");

  useEffect(() => {
    const ts = localStorage.getItem("chat_last_seen_ts");
    setLastSeenTs(ts);
    const t = setTimeout(() => {
      localStorage.setItem("chat_last_seen_ts", new Date().toISOString());
    }, 1500);
    return () => clearTimeout(t);
  }, []);

  // Adjust root height when keyboard opens/closes (visualViewport API)
  // This keeps the composer visible above the keyboard on iOS/Android
  useEffect(() => {
    const updateHeight = () => {
      const vv = window.visualViewport;
      if (rootRef.current && vv) {
        rootRef.current.style.height = `${vv.height}px`;
      }
    };
    updateHeight();
    window.visualViewport?.addEventListener("resize", updateHeight);
    window.visualViewport?.addEventListener("scroll", updateHeight);
    return () => {
      window.visualViewport?.removeEventListener("resize", updateHeight);
      window.visualViewport?.removeEventListener("scroll", updateHeight);
    };
  }, []);

  const handleSend = (text, imageFile) => {
    sendMessage({ text, imageFile, replyTo });
    setReplyTo(null);
  };

  const typingNames = typingUsers.map((t) => t.user_name).join(", ");

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[55] flex flex-col bg-background overflow-hidden"
      style={{ height: "100dvh", paddingBottom: "calc(4rem + env(safe-area-inset-bottom))" }}
    >
      {/* Header — respects top safe-area (notch) */}
      <header
        className="shrink-0 flex items-center gap-3 px-4 py-2.5 border-b border-border bg-card/80 backdrop-blur-xl"
        style={{ paddingTop: "calc(0.625rem + env(safe-area-inset-top))" }}
      >
        <Link to="/" className="text-muted-foreground hover:text-foreground -ml-1 p-1.5">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div className="w-10 h-10 rounded-full overflow-hidden border border-violet-500/30 shrink-0">
          <img src={LOGO_URL} alt="MIST" className="w-full h-full object-contain" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-foreground">MIST Live Chat</h1>
          <p className="text-xs text-emerald-400 flex items-center gap-1.5 truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            <span className="truncate">
              {typingUsers.length > 0 ? `${typingNames} typing...` : `${onlineUsers.length} online`}
            </span>
          </p>
        </div>
      </header>

      {/* Online members strip */}
      {onlineUsers.length > 0 && (
        <div className="px-4 py-2 border-b border-border bg-background/60 flex items-center gap-3 overflow-x-auto shrink-0 scrollbar-hide">
          {onlineUsers.slice(0, 20).map((m) => (
            <div key={m.user_uid} className="flex flex-col items-center gap-1 shrink-0">
              <ChatAvatar src={m.user_avatar} name={m.user_name} size="w-9 h-9" online showStatus />
              <span className="text-[10px] text-muted-foreground max-w-[44px] truncate">{m.user_name}</span>
            </div>
          ))}
        </div>
      )}

      {/* Messages — fills space between header and composer */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center min-h-0">
          <div className="w-7 h-7 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
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

      {/* Composer — fixed at bottom, respects bottom safe-area (home indicator) */}
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