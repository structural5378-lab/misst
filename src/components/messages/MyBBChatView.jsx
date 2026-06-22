import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Send } from "lucide-react";

function renderMessage(text) {
  if (!text) return "";
  return text
    .replace(/\[b\]([\s\S]*?)\[\/b\]/gi, "<strong>$1</strong>")
    .replace(/\[i\]([\s\S]*?)\[\/i\]/gi, "<em>$1</em>")
    .replace(/\[u\]([\s\S]*?)\[\/u\]/gi, "<u>$1</u>")
    .replace(/\[url=([^\]]+)\]([\s\S]*?)\[\/url\]/gi, "<a href='$1' target='_blank' rel='noopener noreferrer' class='text-violet-400 underline'>$2</a>")
    .replace(/\[url\]([\s\S]*?)\[\/url\]/gi, "<a href='$1' target='_blank' rel='noopener noreferrer' class='text-violet-400 underline'>$1</a>")
    .replace(/\n/g, "<br>");
}

export default function MyBBChatView({ pmid, fromUsername, subject, mybbUser, onBack }) {
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const bottomRef = useRef(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["mybb-pm-thread", pmid],
    queryFn: async () => {
      const res = await base44.functions.invoke("mybbMessages", {
        action: "get_pm_thread",
        username: mybbUser.username,
        password: mybbUser.password,
        pmid,
      });
      // Also mark as read
      base44.functions.invoke("mybbMessages", {
        action: "mark_pm_read",
        username: mybbUser.username,
        password: mybbUser.password,
        pmid,
      }).catch(() => {});
      if (res.data?.error) throw new Error(res.data.error);
      const thread = res.data?.thread || [];
      if (thread.length > 0) return thread;
      return res.data?.pm ? [res.data.pm] : [];
    },
    staleTime: 10000,
    refetchInterval: 15000,
  });

  const messages = data || [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    setSendError("");
    try {
      const res = await base44.functions.invoke("mybbMessages", {
        action: "send_pm",
        username: mybbUser.username,
        password: mybbUser.password,
        to_username: fromUsername,
        subject: subject?.startsWith("Re:") ? subject : `Re: ${subject || ""}`,
        message: replyText.trim(),
      });
      if (res.data?.ok || res.data?.success) {
        setReplyText("");
        queryClient.invalidateQueries({ queryKey: ["mybb-pms", mybbUser?.username] });
        queryClient.invalidateQueries({ queryKey: ["mybb-pm-thread", pmid] });
        queryClient.invalidateQueries({ queryKey: ["unread-pms-badge"] });
      } else {
        setSendError(res.data?.error || "Failed to send.");
      }
    } catch (e) {
      setSendError("Send failed: " + e.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-white/[0.06] px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="text-violet-400 hover:text-violet-300 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-8 h-8 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-violet-400">{(fromUsername || "?")[0].toUpperCase()}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">{fromUsername}</p>
          {subject && <p className="text-[10px] text-muted-foreground truncate">{subject}</p>}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-24">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">No messages in this thread.</p>
        ) : (
          messages.map((msg, i) => {
            const isMine = (msg.fromusername || msg.fromuser || "").toLowerCase() === mybbUser.username.toLowerCase();
            const date = msg.dateline
              ? new Date(parseInt(msg.dateline) * 1000).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
              : "";
            return (
              <div key={msg.pmid || i} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                  isMine
                    ? "bg-violet-600 text-white rounded-br-sm"
                    : "bg-white/[0.07] text-foreground rounded-bl-sm border border-white/[0.08]"
                }`}>
                  {!isMine && (
                    <p className="text-[10px] font-semibold text-violet-300 mb-1">{msg.fromusername || msg.fromuser}</p>
                  )}
                  <div
                    className="leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: renderMessage(msg.message || msg.content || "") }}
                  />
                  {date && (
                    <p className={`text-[10px] mt-1 ${isMine ? "text-violet-200/70" : "text-muted-foreground"}`}>{date}</p>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-t border-white/[0.06] px-4 py-3">
        {sendError && <p className="text-xs text-red-400 mb-2">{sendError}</p>}
        <div className="flex items-center gap-2 max-w-lg mx-auto">
          <input
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Reply..."
            className="flex-1 bg-white/[0.06] border border-white/[0.1] rounded-full px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-violet-500/50 transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={!replyText.trim() || sending}
            className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center shrink-0 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {sending
              ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <Send className="w-4 h-4 text-white" />
            }
          </button>
        </div>
      </div>
    </div>
  );
}