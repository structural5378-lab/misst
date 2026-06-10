import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, Clock, MessageSquare, Send } from "lucide-react";
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
      setPostError(res.data?.result?.error || "Failed to post reply. Check your forum credentials.");
    }
    setPosting(false);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-xl border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="text-violet-400 hover:text-violet-300">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-sm font-bold text-foreground flex-1 line-clamp-1">{threadTitle}</h2>
        <a
          href={thread.link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-violet-400 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      <div className="flex-1 px-4 py-4 space-y-3 pb-4">
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

        {/* Reply Box */}
        {mybbUser?.password && (
          <div className="mt-4 rounded-xl border border-white/[0.10] bg-white/[0.03] p-3">
            <p className="text-xs text-muted-foreground mb-2 font-medium">Reply as <span className="text-violet-300">{mybbUser.username}</span></p>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write your reply... BBCode supported"
              rows={4}
              className="w-full bg-transparent border border-white/[0.10] rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-violet-500/50"
            />
            {postError && <p className="text-xs text-red-400 mt-1">{postError}</p>}
            <div className="flex justify-end mt-2">
              <Button
                size="sm"
                onClick={handleReply}
                disabled={posting || !replyText.trim()}
                className="bg-violet-600 hover:bg-violet-700 text-white gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                {posting ? "Posting..." : "Post Reply"}
              </Button>
            </div>
          </div>
        )}
        {mybbUser && !mybbUser.password && (
          <p className="text-center text-xs text-muted-foreground py-3">Re-login to enable posting replies.</p>
        )}
      </div>
    </div>
  );
}