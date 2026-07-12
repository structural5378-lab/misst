import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, Clock, MessageSquare, Send, Bell, BellOff } from "lucide-react";
import { useMyBBAuth } from "@/lib/MyBBAuthContext";
import { Button } from "@/components/ui/button";

function renderBBCode(text) {
  if (!text) return "";
  return text
    .replace(/\[b\]([\s\S]*?)\[\/b\]/gi, "<strong>$1</strong>")
    .replace(/\[i\]([\s\S]*?)\[\/i\]/gi, "<em>$1</em>")
    .replace(/\[u\]([\s\S]*?)\[\/u\]/gi, "<u>$1</u>")
    .replace(/\[s\]([\s\S]*?)\[\/s\]/gi, "<s>$1</s>")
    .replace(/\[color=([^\]]+)\]([\s\S]*?)\[\/color\]/gi, "<span style='color:$1'>$2</span>")
    .replace(/\[size=([^\]]+)\]([\s\S]*?)\[\/size\]/gi, "<span style='font-size:$1px'>$2</span>")
    .replace(/\[url=([^\]]+)\]([\s\S]*?)\[\/url\]/gi, "<a href='$1' target='_blank' rel='noopener noreferrer' class='text-violet-400 underline hover:text-violet-300'>$2</a>")
    .replace(/\[url\]([\s\S]*?)\[\/url\]/gi, "<a href='$1' target='_blank' rel='noopener noreferrer' class='text-violet-400 underline hover:text-violet-300'>$1</a>")
    .replace(/\[img\]([\s\S]*?)\[\/img\]/gi, "<img src='$1' alt='image' class='max-w-full rounded-lg my-1' />")
    .replace(/\[quote(?:='[^']*')?\]([\s\S]*?)\[\/quote\]/gi, "<blockquote class='border-l-2 border-violet-500/40 pl-3 my-2 text-muted-foreground text-xs italic'>$1</blockquote>")
    .replace(/\[code\]([\s\S]*?)\[\/code\]/gi, "<pre class='bg-secondary/60 rounded p-2 text-xs overflow-x-auto my-1 font-mono'>$1</pre>")
    .replace(/\[list\]([\s\S]*?)\[\/list\]/gi, "<ul class='list-disc list-inside my-1 space-y-0.5'>$1</ul>")
    .replace(/\[\*\]/g, "<li>")
    .replace(/\n/g, "<br>");
}

function PostBubble({ post, isOP }) {
  const initials = post.author ? post.author.slice(0, 2).toUpperCase() : "?";
  const avatarUrl = post.avatar ? `https://insomniacsgmrs.com/${post.avatar}` : null;

  return (
    <div className={`rounded-xl border p-4 ${isOP ? "border-violet-500/30 bg-violet-500/5" : "border-white/[0.07] bg-white/[0.03]"}`}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-full bg-violet-900/60 border border-violet-500/30 overflow-hidden flex items-center justify-center text-xs font-bold text-violet-300 shrink-0">
          {avatarUrl ? (
            <img src={avatarUrl} alt={post.author} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = "none"; }} />
          ) : initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground">{post.author || "Unknown"}</p>
          {post.date && (
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" />
              {post.date}
            </p>
          )}
        </div>
        {isOP && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 font-medium">OP</span>
        )}
      </div>
      <div
        className="text-sm text-foreground/90 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: renderBBCode(post.content) }}
      />
    </div>
  );
}

export default function ThreadReader({ thread, onBack }) {
  const { mybbUser } = useMyBBAuth();
  const queryClient = useQueryClient();
  const [replyText, setReplyText] = useState("");
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState("");
  const [followId, setFollowId] = useState(null);
  const [followLoading, setFollowLoading] = useState(false);

  // Check if already following on mount
  useEffect(() => {
    (async () => {
      const me = await base44.auth.me().catch(() => null);
      if (!me) return;
      const existing = await base44.entities.FollowedThread.filter({
        user_id: me.id,
        thread_id: String(thread.threadId),
      });
      if (existing?.length > 0) setFollowId(existing[0].id);
    })();
  }, [thread.threadId]);

  const handleFollowToggle = async () => {
    setFollowLoading(true);
    const me = await base44.auth.me().catch(() => null);
    if (!me) { setFollowLoading(false); return; }
    if (followId) {
      await base44.entities.FollowedThread.delete(followId);
      setFollowId(null);
    } else {
      const record = await base44.entities.FollowedThread.create({
        user_id: me.id,
        thread_id: String(thread.threadId),
        thread_title: thread.title,
        last_known_reply_count: thread.replies || 0,
      });
      setFollowId(record.id);
    }
    setFollowLoading(false);
  };

  const { data, isLoading } = useQuery({
    queryKey: ["mybb-posts", thread.threadId],
    queryFn: async () => {
      const res = await base44.functions.invoke("fetchMyBBForums", {
        action: "thread_posts",
        tid: thread.threadId,
      });
      return res.data;
    },
    staleTime: 30000,
  });

  const posts = data?.posts || [];
  const threadTitle = data?.threadTitle || thread.title;

  const handleReply = async () => {
    if (!replyText.trim() || !mybbUser) return;
    setPosting(true);
    setPostError("");
    const res = await base44.functions.invoke("fetchMyBBForums", {
      action: "reply",
      tid: thread.threadId,
      message: replyText.trim(),
      username: mybbUser.username,
      password: mybbUser.password,
    });
    if (res.data?.ok) {
      setReplyText("");
      queryClient.invalidateQueries({ queryKey: ["mybb-posts", thread.threadId] });
    } else {
      setPostError(res.data?.error || res.data?.result?.error || "Failed to post reply. The forum bridge may not support replies yet.");
    }
    setPosting(false);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="text-violet-400 hover:text-violet-300 p-1 -ml-1">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-sm font-bold text-foreground flex-1 line-clamp-1">{threadTitle}</h2>
        <button
          onClick={handleFollowToggle}
          disabled={followLoading}
          className={`p-1.5 rounded-lg transition-colors ${followId ? "text-violet-400 bg-violet-500/10" : "text-muted-foreground hover:text-violet-400 hover:bg-violet-500/10"}`}
          title={followId ? "Unfollow thread" : "Follow thread"}
        >
          {followId ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
        </button>
        {thread.link && (
          <a
            href={thread.link}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-violet-400 hover:bg-violet-500/10 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>

      {/* Post count banner */}
      {posts.length > 0 && (
        <div className="px-4 pt-3 pb-1">
          <p className="text-xs text-muted-foreground">{posts.length} post{posts.length !== 1 ? "s" : ""}</p>
        </div>
      )}

      <div className="flex-1 px-4 py-2 space-y-3 pb-20">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
            No posts found
          </div>
        ) : (
          posts.map((post, i) => (
            <PostBubble key={post.pid || i} post={post} isOP={i === 0} />
          ))
        )}

        {mybbUser && !mybbUser.password && (
          <p className="text-center text-xs text-muted-foreground py-3">Re-login to enable posting replies.</p>
        )}
      </div>

      {/* Sticky reply bar */}
      {mybbUser?.password && (
        <div className="sticky bottom-16 z-30 bg-background/95 backdrop-blur-xl border-t border-border px-4 py-3">
          {postError && <p className="text-xs text-red-400 mb-2">{postError}</p>}
          <div className="flex items-end gap-2">
            <div className="w-7 h-7 rounded-full bg-violet-900/60 border border-violet-500/30 flex items-center justify-center text-[10px] font-bold text-violet-300 shrink-0 mb-1">
              {mybbUser.username.slice(0, 2).toUpperCase()}
            </div>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write a reply..."
              rows={replyText.split("\n").length > 1 ? Math.min(replyText.split("\n").length + 1, 5) : 1}
              className="flex-1 bg-secondary/50 border border-white/[0.10] rounded-2xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-all"
            />
            <button
              onClick={handleReply}
              disabled={posting || !replyText.trim()}
              className="w-9 h-9 rounded-full bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shrink-0 transition-colors mb-0.5"
            >
              {posting ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4 text-white" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}