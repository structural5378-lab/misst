import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Lock, Pin, PinOff, LockOpen, Star, Trash2, FolderInput, Check } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import ThreadHeader from "@/components/community/ThreadHeader";
import PostCard from "@/components/community/PostCard";
import QuickReply from "@/components/community/QuickReply";
import ThreadNavDock from "@/components/community/ThreadNavDock";
import ProfilePopup from "@/components/community/ProfilePopup";

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
  const [multiQuotePosts, setMultiQuotePosts] = useState([]);
  const [posting, setPosting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [profile, setProfile] = useState(null);
  const [toast, setToast] = useState("");
  const viewIncremented = useRef(false);
  const topRef = useRef(null);
  const bottomRef = useRef(null);
  const replyRef = useRef(null);

  const { data: thread } = useQuery({
    queryKey: ["forum-thread", id],
    queryFn: async () => (await base44.entities.ForumThread.filter({ id }))[0],
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
    queryFn: async () => (await base44.entities.ForumSubscription.filter({ user_id: user.id, thread_id: id }))[0],
    enabled: !!user?.id && !!id,
  });

  useEffect(() => {
    if (sub) {
      setSubscribed(!!sub.is_subscribed);
      setBookmarked(!!sub.is_bookmarked);
    }
  }, [sub]);

  useEffect(() => {
    if (thread && !viewIncremented.current) {
      viewIncremented.current = true;
      base44.entities.ForumThread.update(thread.id, { view_count: (thread.view_count || 0) + 1 }).catch(() => {});
    }
  }, [thread]);

  useEffect(() => {
    if (user?.id && thread && sub?.unread_count > 0) {
      base44.entities.ForumSubscription.update(sub.id, { unread_count: 0, last_read_date: new Date().toISOString() })
        .then(() => queryClient.invalidateQueries({ queryKey: ["forum-subs", user.id] }))
        .catch(() => {});
    }
  }, [user?.id, thread, sub]);

  const showToast = (m) => { setToast(m); setTimeout(() => setToast(""), 2000); };

  const participants = useMemo(() => {
    const map = new Map();
    if (thread) map.set(thread.author_id, { id: thread.author_id, name: thread.author_name });
    posts.forEach((p) => { if (p.author_id) map.set(p.author_id, { id: p.author_id, name: p.author_name }); });
    return Array.from(map.values()).filter((p) => p.id && p.name);
  }, [thread, posts]);

  const openProfile = (authorId, role, name) => setProfile({ id: authorId, role, name });

  const handleSend = async () => {
    if (!reply.trim() || !user || !thread) return;
    setPosting(true);
    try {
      let body = reply;
      if (multiQuotePosts.length) {
        const q = multiQuotePosts
          .map((p) => `> **${p.author_name} said:**\n> ${(p.body || "").slice(0, 160).replace(/\n/g, "\n> ")}\n`)
          .join("\n");
        body = `${q}\n${reply}`;
      } else if (quotePost) {
        body = `> **${quotePost.author_name} said:**\n> ${(quotePost.body || "").slice(0, 200)}\n\n${reply}`;
      }
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
      setMultiQuotePosts([]);
      localStorage.removeItem(`mist_draft_thread_${id}`);
      refetchPosts();
      queryClient.invalidateQueries({ queryKey: ["forum-threads"] });
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch {}
    setPosting(false);
  };

  const handleImage = async (file) => {
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      setImageUrl(res.file_url);
      showToast("Image attached");
    } catch {}
  };

  const toggleMultiQuote = (post) => {
    setMultiQuotePosts((prev) =>
      prev.find((p) => p.id === post.id) ? prev.filter((p) => p.id !== post.id) : [...prev, post]
    );
  };

  const copyLink = async (post) => {
    const url = `${window.location.origin}/community/thread/${id}${post ? `#post-${post.id}` : ""}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast("Link copied");
    } catch {}
  };

  const share = async () => {
    try {
      await navigator.share({ title: thread?.title, url: window.location.href });
    } catch {}
  };
  const report = () => showToast("Report submitted");

  const toggleSubscribed = async () => {
    if (!user?.id || !thread) return;
    const newVal = !subscribed;
    setSubscribed(newVal);
    try {
      if (sub) await base44.entities.ForumSubscription.update(sub.id, { is_subscribed: newVal });
      else
        await base44.entities.ForumSubscription.create({
          user_id: user.id, thread_id: id, thread_title: thread.title, category_name: thread.category_name,
          is_subscribed: newVal, is_bookmarked: false, unread_count: 0,
        });
    } catch { setSubscribed(!newVal); }
  };
  const toggleBookmarked = async () => {
    if (!user?.id || !thread) return;
    const newVal = !bookmarked;
    setBookmarked(newVal);
    try {
      if (sub) await base44.entities.ForumSubscription.update(sub.id, { is_bookmarked: newVal });
      else
        await base44.entities.ForumSubscription.create({
          user_id: user.id, thread_id: id, thread_title: thread.title, category_name: thread.category_name,
          is_subscribed: false, is_bookmarked: newVal, unread_count: 0,
        });
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

  const jumpNewest = () => bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  const jumpOldest = () => topRef.current?.scrollIntoView({ behavior: "smooth" });
  const jumpReply = () => replyRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });

  if (!thread) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex items-center h-14 px-4 border-b border-border">
          <button onClick={() => navigate(-1)} className="text-primary text-sm">← Back</button>
        </div>
        <div className="flex-1 flex justify-center items-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

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
  const visiblePosts = posts.filter((p) => !p.is_deleted || p.body !== "[deleted]");
  const hasUnread = !!sub?.unread_count;

  return (
    <div className="min-h-screen bg-background" style={{ paddingBottom: "9rem" }}>
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl">
        <ThreadHeader
          thread={thread}
          subscribed={subscribed}
          bookmarked={bookmarked}
          onSubscribe={toggleSubscribed}
          onBookmark={toggleBookmarked}
          onShare={share}
          onCopyLink={() => copyLink(null)}
          onReport={report}
          onBack={() => navigate("/community-forum")}
        />
        {isAdmin && (
          <div className="flex items-center gap-1 px-4 py-1.5 border-b border-border/50 overflow-x-auto scrollbar-hide">
            <ModBtn active={thread.is_pinned} onClick={togglePin} icon={thread.is_pinned ? Pin : PinOff} label={thread.is_pinned ? "Unpin" : "Pin"} />
            <ModBtn active={thread.is_locked} onClick={toggleLock} icon={thread.is_locked ? Lock : LockOpen} label={thread.is_locked ? "Unlock" : "Lock"} />
            <ModBtn active={thread.is_featured} onClick={toggleFeature} icon={Star} label={thread.is_featured ? "Unfeature" : "Feature"} />
            <ModBtn active={false} onClick={() => showToast("Move thread — coming soon")} icon={FolderInput} label="Move" />
            <ModBtn active={false} onClick={deleteThread} icon={Trash2} label="Delete" danger />
          </div>
        )}
      </div>

      <div className="px-3 py-3 space-y-3">
        <div ref={topRef} />
        <PostCard
          post={opPost}
          thread={thread}
          user={user}
          isOP
          onReply={(p) => { setReplyTo(p); setQuotePost(null); setReply(`@${p.author_name} `); }}
          onQuote={(p) => { setQuotePost(p); setReplyTo(null); }}
          onMultiQuote={toggleMultiQuote}
          multiQuoted={multiQuotePosts.some((p) => p.id === opPost.id)}
          isAdmin={isAdmin}
          onUpdate={refetchPosts}
          onOpenProfile={openProfile}
          onCopyLink={copyLink}
          onReport={report}
        />
        {visiblePosts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            thread={thread}
            user={user}
            onReply={(p) => { setReplyTo(p); setQuotePost(null); setReply(`@${p.author_name} `); }}
            onQuote={(p) => { setQuotePost(p); setReplyTo(null); }}
            onMultiQuote={toggleMultiQuote}
            multiQuoted={multiQuotePosts.some((p) => p.id === post.id)}
            isAdmin={isAdmin}
            onUpdate={refetchPosts}
            onOpenProfile={openProfile}
            onCopyLink={copyLink}
            onReport={report}
          />
        ))}
        {posts.length === 0 && <p className="text-center text-sm text-muted-foreground py-4">No replies yet. Be the first!</p>}
        <div ref={bottomRef} />
      </div>

      <div ref={replyRef} className="fixed left-0 right-0 z-40" style={{ bottom: "calc(4rem + env(safe-area-inset-bottom))" }}>
        {thread.is_locked ? (
          <div className="border-t border-border bg-card/95 backdrop-blur-xl p-3 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Lock className="w-4 h-4" /> This thread is locked
          </div>
        ) : (
          <>
            {(replyTo || quotePost || multiQuotePosts.length > 0) && (
              <div className="flex items-center gap-2 px-3 pt-2 text-[11px] text-muted-foreground">
                {replyTo && <span className="flex items-center gap-1"><Check className="w-3 h-3" />Replying to {replyTo.author_name}</span>}
                {quotePost && <span>Quoting {quotePost.author_name}</span>}
                {multiQuotePosts.length > 0 && <span>{multiQuotePosts.length} quoted</span>}
                <button onClick={() => { setReplyTo(null); setQuotePost(null); setMultiQuotePosts([]); }} className="text-muted-foreground hover:text-foreground ml-auto">✕</button>
              </div>
            )}
            <QuickReply
              value={reply}
              onChange={setReply}
              onSend={handleSend}
              onImage={handleImage}
              posting={posting}
              disabled={!reply.trim()}
              participants={participants}
              threadId={id}
            />
          </>
        )}
      </div>

      <ThreadNavDock
        onBack={() => navigate("/community-forum")}
        onNewest={jumpNewest}
        onOldest={jumpOldest}
        onReply={jumpReply}
        hasUnread={hasUnread}
        onUnread={jumpNewest}
      />

      {profile && <ProfilePopup authorId={profile.id} role={profile.role} name={profile.name} onClose={() => setProfile(null)} />}

      {toast && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-[90] bg-foreground text-background text-xs font-medium px-3 py-1.5 rounded-full shadow-lg"
          style={{ bottom: "calc(7rem + env(safe-area-inset-bottom))" }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}

function ModBtn({ active, onClick, icon: Icon, label, danger }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium border transition-colors whitespace-nowrap ${
        danger
          ? "text-destructive border-destructive/30 hover:bg-destructive/10"
          : active
          ? "text-primary bg-primary/10 border-primary/30"
          : "text-muted-foreground border-border/50 hover:bg-muted/30"
      }`}
    >
      <Icon className="w-3 h-3" /> {label}
    </button>
  );
}