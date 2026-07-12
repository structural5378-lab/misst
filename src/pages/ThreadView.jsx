import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/layout/PageHeader";
import { format } from "date-fns";

export default function ThreadView() {
  const { id } = useParams();
  const [reply, setReply] = useState("");
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: thread } = useQuery({
    queryKey: ["thread", id],
    queryFn: async () => {
      const list = await base44.entities.ForumThread.filter({ id });
      return list[0];
    },
  });

  const { data: posts } = useQuery({
    queryKey: ["thread-posts", id],
    queryFn: () => base44.entities.ForumPost.filter({ thread_id: id }, "created_date", 100),
    initialData: [],
  });

  const replyMutation = useMutation({
    mutationFn: (data) => base44.entities.ForumPost.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["thread-posts", id] });
      setReply("");
      if (thread) {
        base44.entities.ForumThread.update(thread.id, { reply_count: (thread.reply_count || 0) + 1 });
      }
    },
  });

  const handleReply = () => {
    if (!reply.trim()) return;
    replyMutation.mutate({
      thread_id: id,
      body: reply,
      author_name: user?.full_name || "Anonymous",
      author_callsign: user?.callsign || "",
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <PageHeader title={thread?.title || "Thread"} showBack />
      
      <div className="flex-1 px-4 py-3 space-y-3 pb-32">
        {/* Original post */}
        {thread && (
          <div className="p-4 rounded-xl bg-card border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-bold text-primary">
                  {(thread.author_name || "A")[0]}
                </span>
              </div>
              <div>
                <span className="text-sm font-semibold text-foreground">{thread.author_name}</span>
                {thread.author_callsign && (
                  <span className="text-xs text-primary ml-1">{thread.author_callsign}</span>
                )}
              </div>
            </div>
            <p className="text-sm text-foreground/90 leading-relaxed">{thread.body}</p>
            <p className="text-xs text-muted-foreground mt-2">
              {thread.created_date && format(new Date(thread.created_date), "MMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
        )}

        {/* Replies */}
        {posts.map((post) => (
          <div key={post.id} className="p-3 rounded-xl bg-secondary/30 border border-border/30">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center">
                <span className="text-xs font-bold text-accent-foreground">
                  {(post.author_name || "A")[0]}
                </span>
              </div>
              <span className="text-sm font-medium text-foreground">{post.author_name}</span>
              {post.author_callsign && (
                <span className="text-xs text-primary">{post.author_callsign}</span>
              )}
            </div>
            <p className="text-sm text-foreground/80">{post.body}</p>
            <p className="text-xs text-muted-foreground mt-1.5">
              {post.created_date && format(new Date(post.created_date), "MMM d 'at' h:mm a")}
            </p>
          </div>
        ))}
      </div>

      {/* Reply bar — fixed above bottom nav */}
      <div
        className="fixed left-0 right-0 z-30 border-t border-border p-3 bg-card/95 backdrop-blur-xl"
        style={{ bottom: "calc(4rem + env(safe-area-inset-bottom))" }}
      >
        <div className="flex gap-2 max-w-2xl mx-auto">
          <Input
            placeholder="Write a reply..."
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            className="bg-secondary/50 border-border/50"
            onKeyDown={(e) => e.key === "Enter" && handleReply()}
          />
          <Button
            size="icon"
            onClick={handleReply}
            disabled={!reply.trim() || replyMutation.isPending}
            className="bg-primary hover:bg-primary/90 shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}