import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft, Pin, PinOff, Lock, LockOpen, Star, Trash2,
  Bell, BellOff, Bookmark, Send, ImagePlus, Quote, CornerDownRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import PostCard from "@/components/community/PostCard";
import { useAuth } from "@/lib/AuthContext";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { timeAgo, getCategoryMeta } from "@/lib/forumUtils";

export default function CommunityThread() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useAdminAccess();
  const queryClient = useQueryClient();
  const [reply, setReply] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [quotePost, setQuotePost] = useState(null);
  const [posting, setPosting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const viewIncremented = useRef(false);

  const { data: thread } = useQuery({
    queryKey: ["forum-thread", id],
    queryFn: async () => {
      const list = await base44.entities.ForumThread.filter({ id });
      return list[0];
    },
    enabled: !!id,
  });

  const { data: posts = [], refetch: refetchPosts } = useQuery({
    queryKey: ["forum-posts", id],
    queryFn: () => base44.entities.ForumPost.filter({ thread_id: id }, "created_date", 200),
    enabled: !!id,
    staleTime: 10000,
  });

  const { data: sub } = useQuery({
    queryKey: ["forum-sub", user?.id, id],
    queryFn: async () => {
      const list = await base44.entities.ForumSubscription.filter({ user_id: user.id, thread_id: id });
      return list[0];
    },
    enabled: !!user?.id && !!id,
  });

  useEffect(() => {
    if (sub) {
      setSubscribed(!!sub.is_subscribed);
      setBookmarked(!!sub.is_bookmarked);
    }
  }, [sub]);

  // Increment view count once
  useEffect(() => {
    if (thread && !viewIncremented.current) {
      viewIncremented.current = true;
      base44.entities.ForumThread.update(thread.id, { view_count: (thread.view_count || 0) + 1 }).catch(() => {});
    }
  }, [thread]);

  // Mark as read
  useEffect(() => {
    if (user?.id && thread && sub?.unread_count > 0) {
      base44.entities.ForumSubscription.update(sub.id, {
        unread_count: 0,
        last_read_date: new Date().toISOString(),
      }).then(() => queryClient.invalidateQueries({ queryKey: ["forum-subs", user.id] })).catch(() => {});
    }
  }, [user?.id, thread, sub]);

  const handleReply = async () => {
    if (!reply.trim() || !user || !thread) return;
    setPosting(true);
    try {
      const body = quotePost
        ? `> **${quotePost.author_name} said:**\n> ${quotePost.body?.slice(0, 200) || ""}\n\n${reply}`
        : reply;
      await base44.entities.ForumPost.create({
        thread_id: id,
        thread_title: thread.title,
        body,
        author_id: user.id,
        author_name: user.full_name || "Anonymous",
        author_callsign: user.callsign || "",
        author_avatar: user.avatar_url || "",
        reply_to_post_id: replyTo?.id || "",
        reply_to_author: replyTo?.author_name || "",
        quote_of_post_id: quotePost?.id || "",
        quote_of_author: quotePost?.author_name || "",
        quote_of_body: quotePost?.body?.slice(0, 200) || "",
        image_url: imageUrl,
      });
      await base44.entities.ForumThread.update(thread.id, {
        reply_count: (thread.reply_count || 0) + 1,
        last_reply_date: new Date().toISOString(),
        last_reply_author: user.full_name || "Anonymous",
        last_reply_author_id: user.id,
        last_reply_avatar: user.avatar_url || "",
      });
      setReply("");
      setImageUrl("");
      setReplyTo(null);
      setQuotePost(null);
      refetchPosts();
      queryClient.invalidateQueries({ queryKey: ["forum-threads"] });
    } catch {}
    setPosting(false);
  };

  const handleImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      setImageUrl(res.file_url);
    } catch {}
  };

  const toggleSubscribed = async () => {
    if (!user?.id || !thread) return;
    const newVal = !subscribed;
    setSubscribed(newVal);
    try {
      if (sub) {
        await base44.entities.ForumSubscription.update(sub.id, { is_subscribed: newVal });
      } else {
        await base44.entities.ForumSubscription.create({
          user_id: user.id,
          thread_id: id,
          thread_title: thread.title,
          category_name: thread.category_name,
          is_subscribed: newVal,
          is_bookmarked: false,
          unread_count: 0,
        });
      }
    } catch { setSubscribed(!newVal); }
  };

  const toggleBookmarked = async () => {
    if (!user?.id || !thread) return;
    const newVal = !bookmarked;
    setBookmarked(newVal);
    try {
      if (sub) {
        await base44.entities.ForumSubscription.update(sub.id, { is_bookmarked: newVal });
      } else {
        await base44.entities.ForumSubscription.create({
          user_id: user.id, thread_id: id, thread_title: thread.title,
          category_name: thread.category_name, is_subscribed: false, is_bookmarked: newVal, unread_count: 0,
        });
      }
    } catch { setBookmarked(!newVal); }
  };

  const togglePin = async () => {
    if (!thread) return;
    await base44.entities.ForumThread.update(thread.id, { is_pinned: !thread.is_pinned });
    queryClient.invalidateQueries({ queryKey: ["forum-thread", id] });
    queryClient.invalidateQueries({ queryKey: ["forum-threads"] });
  };

  const toggleLock = async () => {
    if (!thread) return;
    await base44.entities.ForumThread.update(thread.id, { is_locked: !thread.is_locked });
    queryClient.invalidateQueries({ queryKey: ["forum-thread", id] });
  };

  const toggleFeature = async () => {
    if (!thread) return;
    await base44.entities.ForumThread.update(thread.id, { is_featured: !thread.is_featured });
    queryClient.invalidateQueries({ queryKey: ["forum-thread", id] });
    queryClient.invalidateQueries({ queryKey: ["forum-threads"] });
  };

  const deleteThread = async () => {
    if (!thread || !confirm("Delete this entire thread?")) return;
    await base44.entities.ForumThread.update(thread.id, { is_deleted: true });
    navigate("/community-forum");
  };

  if (!thread) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex items-center h-14 px-4 border-b border-border">
          <button onClick={() => navigate(-1)} className="text-primary"><ChevronLeft className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 flex justify-center items-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const { Icon, colors } = getCategoryMeta(thread.category_name);
  const opPost = {
    id: thread.id,
    body: thread.body,
    author_id: thread.author_id,
    author_name: thread.author_name,
    author_callsign: thread.author_callsign,
    author_avatar: thread.author_avatar,
    author_role: thread.author_role,
    image_url: thread.image_url,
    created_date: thread.created_date,
    reactions: thread.reaction_counts,
  };

  return (
    <div className="min-h-screen bg-background pb-40">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="flex items-center gap-2 h-14 px-4">
          <button onClick={() => navigate(-1)} className="text-primary p-1 -ml-1">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold text-foreground line-clamp-1">{thread.title}</h1>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span className={`flex items-center gap-0.5 ${colors.text}`}>
                <Icon className="w-2.5 h-2.5" />{thread.category_name}
              </span>
              <span>·</span>
              <span>{timeAgo(thread.created_date)}</span>
              <span>·</span>
              <span>{thread.view_count || 0} views</span>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={toggleSubscribed} className={`p-2 ${subscribed ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
              {subscribed ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
            </button>
            <button onClick={toggleBookmarked} className={`p-2 ${bookmarked ? "text-amber-400" : "text-muted-foreground hover:text-foreground"}`}>
              <Bookmark className={`w-4 h-4 ${bookmarked ? "fill-amber-400/30" : ""}`} />
            </button>
          </div>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-1 px-4 pb-2">
            <AdminBtn active={thread.is_pinned} onClick={togglePin} icon={thread.is_pinned ? Pin : PinOff} label={thread.is_pinned ? "Unpin" : "Pin"} />
            <AdminBtn active={thread.is_locked} onClick={toggleLock} icon={thread.is_locked ? Lock : LockOpen} label={thread.is_locked ? "Unlock" : "Lock"} />
            <AdminBtn active={thread.is_featured} onClick={toggleFeature} icon={Star} label={thread.is_featured ? "Unfeature" : "Feature"} />
            <AdminBtn active={false} onClick={deleteThread} icon={Trash2} label="Delete" danger />
          </div>
        )}
      </div>

      {/* Posts */}
      <div className="px-4 py-3 space-y-3">
        <PostCard post={opPost} thread={thread} user={user} isOP onUpdate={refetchPosts} />
        {posts.filter(p => !p.is_deleted || p.body !== "[deleted]").length === 0 && posts.length > 0 && (
          <p className="text-center text-sm text-muted-foreground py-4">Replies are being loaded...</p>
        )}
        {posts.filter(p => !p.is_deleted).map((post) => (
          <PostCard
            key={post.id}
            post={post}
            thread={thread}
            user={user}
            onReply={(p) => { setReplyTo(p); setQuotePost(null); setReply(`@${p.author_name} `); }}
            onQuote={(p) => { setQuotePost(p); setReplyTo(null); }}
            isAdmin={isAdmin}
            onUpdate={refetchPosts}
          />
        ))}
        {posts.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-4">No replies yet. Be the first!</p>
        )}
      </div>

      {/* Reply bar */}
      {!thread.is_locked && (
        <div className="fixed left-0 right-0 z-30 border-t border-border p-3 bg-card/95 backdrop-blur-xl" style={{ bottom: "calc(4rem + env(safe-area-inset-bottom))" }}>
          {(replyTo || quotePost) && (
            <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
              {replyTo && <span className="flex items-center gap-1"><CornerDownRight className="w-3 h-3" />Replying to {replyTo.author_name}</span>}
              {quotePost && <span className="flex items-center gap-1"><Quote className="w-3 h-3" />Quoting {quotePost.author_name}</span>}
              <button onClick={() => { setReplyTo(null); setQuotePost(null); }} className="text-muted-foreground hover:text-foreground ml-auto">✕</button>
            </div>
          )}
          <div className="flex gap-2 max-w-2xl mx-auto">
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Write a reply..."
              rows={1}
              className="flex-1 bg-secondary/50 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary/50 max-h-24"
            />
            <label className="flex items-center justify-center w-9 rounded-lg border border-border/50 bg-secondary/30 cursor-pointer hover:bg-secondary/50 shrink-0">
              <ImagePlus className="w-4 h-4 text-muted-foreground" />
              <input type="file" accept="image/*" onChange={handleImage} className="hidden" />
            </label>
            <Button size="icon" onClick={handleReply} disabled={!reply.trim() || posting} className="shrink-0">
              <Send className="w-4 h-4" />
            </Button>
          </div>
          {imageUrl && <img src={imageUrl} alt="" className="w-12 h-12 rounded-lg mt-2 object-cover" />}
        </div>
      )}
      {thread.is_locked && (
        <div className="fixed left-0 right-0 z-30 border-t border-border p-3 bg-card/95 backdrop-blur-xl flex items-center justify-center gap-2 text-sm text-muted-foreground" style={{ bottom: "calc(4rem + env(safe-area-inset-bottom))" }}>
          <Lock className="w-4 h-4" /> This thread is locked
        </div>
      )}
    </div>
  );
}

function AdminBtn({ active, onClick, icon: Icon, label, danger }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium border transition-colors ${
        danger ? "text-destructive border-destructive/30 hover:bg-destructive/10"
        : active ? "text-primary bg-primary/10 border-primary/30" : "text-muted-foreground border-border/50 hover:bg-muted/30"
      }`}
    >
      <Icon className="w-3 h-3" /> {label}
    </button>
  );
}