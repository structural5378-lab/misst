import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, User, Clock, MessageSquare } from "lucide-react";

export default function ThreadReader({ thread, onBack }) {
  const { data, isLoading } = useQuery({
    queryKey: ["mybb-posts", thread.threadId],
    queryFn: async () => {
      const res = await base44.functions.invoke("fetchMyBBForums", {
        action: "thread_posts",
        tid: thread.threadId,
      });
      return res.data;
    },
    staleTime: 60000,
  });

  const posts = data?.posts || [];
  const threadTitle = data?.threadTitle || thread.title;

  return (
    <div className="flex flex-col h-full">
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

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-8">
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
            <div
              key={post.pid || i}
              className={`rounded-xl border p-4 ${
                i === 0
                  ? "border-violet-500/30 bg-violet-500/5"
                  : "border-white/[0.07] bg-white/[0.03]"
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-violet-900/60 border border-violet-500/30 flex items-center justify-center text-xs font-bold text-violet-300">
                  {post.author ? post.author[0].toUpperCase() : "?"}
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
                {i === 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 font-medium">OP</span>
                )}
              </div>
              <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">{post.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}