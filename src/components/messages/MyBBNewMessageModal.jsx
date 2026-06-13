import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MyBBNewMessageModal({ mybbUser, onClose, onSent }) {
  const [toUsername, setToUsername] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const handleSend = async () => {
    if (!toUsername.trim() || !message.trim()) return;
    setSending(true);
    setError("");
    try {
      const res = await base44.functions.invoke("mybbMessages", {
        action: "send_pm",
        username: mybbUser.username,
        password: mybbUser.password,
        to_username: toUsername.trim(),
        subject: subject.trim() || `Message from ${mybbUser.username}`,
        message: message.trim(),
      });
      if (res.data?.ok || res.data?.success) {
        onSent();
      } else {
        setError(res.data?.error || "Failed to send message.");
      }
    } catch (e) {
      setError("Send failed: " + e.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 flex items-end sm:items-center justify-center">
      <div className="w-full max-w-lg bg-card rounded-t-2xl sm:rounded-2xl border border-border/60 p-5 space-y-3 overflow-y-auto pb-safe" style={{paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom, 0px))", maxHeight: "85vh"}}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground">New Message</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <input
          type="text"
          value={toUsername}
          onChange={(e) => setToUsername(e.target.value)}
          placeholder="To: Forum username..."
          className="w-full bg-secondary/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-violet-500/50"
        />
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Subject..."
          className="w-full bg-secondary/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-violet-500/50"
        />
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write your message..."
          rows={4}
          className="w-full bg-secondary/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-violet-500/50"
        />

        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button
            size="sm"
            onClick={handleSend}
            disabled={sending || !toUsername.trim() || !message.trim()}
            className="bg-violet-600 hover:bg-violet-700 text-white gap-2"
          >
            <Send className="w-3.5 h-3.5" />
            {sending ? "Sending..." : "Send"}
          </Button>
        </div>
      </div>
    </div>
  );
}