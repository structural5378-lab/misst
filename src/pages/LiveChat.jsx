import React, { useState, useEffect, useRef, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useMyBBAuth } from "@/lib/MyBBAuthContext";
import { Send, Image, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { format, isToday, isYesterday, subMinutes } from "date-fns";

const LOGO_URL = "https://media.base44.com/images/public/6a24d788be1af31b2258fab2/5e4366214_insomniacsgmrslogo.png";

function formatTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isToday(d)) return format(d, "h:mm a");
  if (isYesterday(d)) return "Yesterday " + format(d, "h:mm a");
  return format(d, "MMM d, h:mm a");
}

function Avatar({ src, name, size = "w-8 h-8" }) {
  const [err, setErr] = useState(false);
  if (src && !err) {
    return <img src={src} alt={name} className={`${size} rounded-full object-cover shrink-0`} onError={() => setErr(true)} />;
  }
  return (
    <div className={`${size} rounded-full bg-violet-700/50 flex items-center justify-center text-violet-200 font-bold text-sm shrink-0`}>
      {(name || "?").charAt(0).toUpperCase()}
    </div>
  );
}

export default function LiveChat() {
  const { mybbUser } = useMyBBAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const bottomRef = useRef(null);
  const fileRef = useRef(null);
  const inputRef = useRef(null);
  const myUidRef = useRef("");

  useEffect(() => { myUidRef.current = String(mybbUser?.uid || ""); }, [mybbUser]);

  // Load initial messages
  useEffect(() => {
    base44.entities.ChatMessage.list("-created_date", 60).then((msgs) => {
      setMessages(msgs.reverse());
    });
  }, []);

  // Real-time subscription (skip own messages — added optimistically; dedup by id)
  useEffect(() => {
    const unsub = base44.entities.ChatMessage.subscribe((event) => {
      if (event.type === "create") {
        if (String(event.data?.sender_uid || "") === myUidRef.current) return;
        setMessages((prev) => {
          if (prev.some((m) => m.id === event.data.id)) return prev;
          return [...prev, event.data];
        });
      } else if (event.type === "delete") {
        setMessages((prev) => prev.filter((m) => m.id !== event.id));
      }
    });
    return unsub;
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text && !imageFile) return;
    if (!mybbUser) return;
    setSending(true);
    try {
      let image_url = undefined;
      if (imageFile) {
        const res = await base44.integrations.Core.UploadFile({ file: imageFile });
        image_url = res.file_url;
      }
      // Optimistic: show message immediately
      setMessages((prev) => [...prev, {
        id: `temp-${Date.now()}`,
        sender_uid: String(mybbUser.uid),
        sender_name: mybbUser.username,
        sender_avatar: mybbUser.avatar || "",
        content: text || "",
        ...(image_url ? { image_url } : {}),
        created_date: new Date().toISOString(),
      }]);
      setInput("");
      setImageFile(null);
      await base44.entities.ChatMessage.create({
        sender_uid: String(mybbUser.uid),
        sender_name: mybbUser.username,
        sender_avatar: mybbUser.avatar || "",
        content: text || "",
        ...(image_url ? { image_url } : {}),
      });
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const myUid = String(mybbUser?.uid);

  // Derive "online" members from messages sent in the last 10 minutes
  const onlineMembers = useMemo(() => {
    const cutoff = subMinutes(new Date(), 5);
    const seen = new Map();
    messages.forEach((msg) => {
      if (new Date(msg.created_date) >= cutoff) {
        if (!seen.has(msg.sender_uid)) {
          seen.set(msg.sender_uid, { uid: msg.sender_uid, name: msg.sender_name, avatar: msg.sender_avatar });
        }
      }
    });
    return Array.from(seen.values());
  }, [messages]);

  // Group messages: show avatar/name only when sender changes
  const grouped = useMemo(() => messages.map((msg, i) => {
    const prev = messages[i - 1];
    const isMe = String(msg.sender_uid) === myUid;
    const showMeta = !prev || prev.sender_uid !== msg.sender_uid;
    return { ...msg, isMe, showMeta };
  }), [messages, myUid]);

  return (
    <div className="flex flex-col bg-background" style={{ height: "calc(100vh - 76px)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card shrink-0">
        <Link to="/" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="w-9 h-9 rounded-full overflow-hidden border border-violet-500/30">
          <img src={LOGO_URL} alt="GMRS" className="w-full h-full object-contain" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">GMRS Live Chat</p>
          <p className="text-[11px] text-emerald-400">● Live</p>
        </div>
      </div>

      {/* Online members strip */}
      {onlineMembers.length > 0 && (
        <div className="px-4 py-2 border-b border-border bg-background/60 flex items-center gap-2 overflow-x-auto shrink-0">
          <span className="text-[11px] text-muted-foreground shrink-0">Active:</span>
          {onlineMembers.map((m) => (
            <div key={m.uid} className="flex items-center gap-1.5 shrink-0">
              <div className="relative">
                <Avatar src={m.avatar} name={m.name} size="w-6 h-6" />
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-background" />
              </div>
              <span className="text-[11px] text-foreground font-medium">{m.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {grouped.map((msg) => (
          <div key={msg.id} className={`flex ${msg.isMe ? "justify-end" : "justify-start"} items-end gap-2`}>
            {!msg.isMe && (
              <div className="w-7 shrink-0">
                {msg.showMeta && <Avatar src={msg.sender_avatar} name={msg.sender_name} size="w-7 h-7" />}
              </div>
            )}
            <div className={`max-w-[75%] flex flex-col ${msg.isMe ? "items-end" : "items-start"}`}>
              {msg.showMeta && !msg.isMe && (
                <span className="text-[11px] text-muted-foreground mb-1 ml-1">{msg.sender_name}</span>
              )}
              <div
                className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                  msg.isMe
                    ? "bg-violet-600 text-white rounded-br-sm"
                    : "bg-card border border-border text-foreground rounded-bl-sm"
                }`}
              >
                {msg.image_url && (
                  <img src={msg.image_url} alt="shared" className="rounded-xl max-w-full mb-1 max-h-52 object-cover" />
                )}
                {msg.content && <span>{msg.content}</span>}
              </div>
              <span className="text-[10px] text-muted-foreground mt-0.5 px-1">{formatTime(msg.created_date)}</span>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Image preview */}
      {imageFile && (
        <div className="px-4 py-2 flex items-center gap-2 bg-card border-t border-border">
          <img src={URL.createObjectURL(imageFile)} alt="preview" className="h-14 w-14 rounded-lg object-cover" />
          <button onClick={() => setImageFile(null)} className="text-xs text-red-400">Remove</button>
        </div>
      )}

      {/* Input bar */}
      <div className="px-3 py-3 border-t border-border bg-card shrink-0 flex items-end gap-2">
        <button
          onClick={() => fileRef.current?.click()}
          className="p-2 rounded-full text-muted-foreground hover:text-violet-400 hover:bg-violet-500/10 transition-colors shrink-0"
        >
          <Image className="w-5 h-5" />
        </button>
        <input type="file" accept="image/*" ref={fileRef} className="hidden" onChange={(e) => setImageFile(e.target.files[0] || null)} />
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Message..."
          rows={1}
          className="flex-1 resize-none bg-secondary rounded-2xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-violet-500/50 transition-colors max-h-28"
          style={{ overflowY: input.split("\n").length > 3 ? "auto" : "hidden" }}
        />
        <button
          onClick={sendMessage}
          disabled={sending || (!input.trim() && !imageFile)}
          className="w-10 h-10 rounded-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 flex items-center justify-center transition-colors shrink-0"
        >
          {sending
            ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <Send className="w-4 h-4 text-white" />
          }
        </button>
      </div>
    </div>
  );
}