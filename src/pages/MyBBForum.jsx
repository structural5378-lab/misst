import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ExternalLink, MessageSquare, ChevronRight, RefreshCw,
  Eye, LogIn, Plus, X, Send, TrendingUp, ArrowLeft, Hash,
  Radio, Wrench, Users, Star, Globe, BookOpen, Megaphone, HelpCircle
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import PageHeader from "@/components/layout/PageHeader";
import ThreadReader from "@/components/forum/ThreadReader";
import { useMyBBAuth } from "@/lib/MyBBAuthContext";
import { Button } from "@/components/ui/button";

// Map forum names to icons & accent colors
const CATEGORY_META = [
  { keywords: ["general", "chat", "talk", "lounge"], icon: MessageSquare, color: "violet" },
  { keywords: ["radio", "gmrs", "frequency", "rf", "antenna", "tech"], icon: Radio, color: "cyan" },
  { keywords: ["repair", "build", "diy", "equipment", "gear"], icon: Wrench, color: "amber" },
  { keywords: ["member", "introduce", "about", "new"], icon: Users, color: "emerald" },
  { keywords: ["news", "announce", "alert", "notice"], icon: Megaphone, color: "rose" },
  { keywords: ["net", "activity", "on-air", "checkin"], icon: Star, color: "yellow" },
  { keywords: ["help", "support", "question", "faq"], icon: HelpCircle, color: "orange" },
  { keywords: ["digital", "internet", "app", "software"], icon: Globe, color: "blue" },
];

const COLOR_MAP = {
  violet: { bg: "bg-violet-500/10", border: "border-violet-500/20", icon: "text-violet-400", badge: "bg-violet-500/10 text-violet-300 border-violet-500/20" },
  cyan:   { bg: "bg-cyan-500/10",   border: "border-cyan-500/20",   icon: "text-cyan-400",   badge: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20" },
  amber:  { bg: "bg-amber-500/10",  border: "border-amber-500/20",  icon: "text-amber-400",  badge: "bg-amber-500/10 text-amber-300 border-amber-500/20" },
  emerald:{ bg: "bg-emerald-500/10",border: "border-emerald-500/20",icon: "text-emerald-400",badge: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" },
  rose:   { bg: "bg-rose-500/10",   border: "border-rose-500/20",   icon: "text-rose-400",   badge: "bg-rose-500/10 text-rose-300 border-rose-500/20" },
  yellow: { bg: "bg-yellow-500/10", border: "border-yellow-500/20", icon: "text-yellow-400", badge: "bg-yellow-500/10 text-yellow-300 border-yellow-500/20" },
  orange: { bg: "bg-orange-500/10", border: "border-orange-500/20", icon: "text-orange-400", badge: "bg-orange-500/10 text-orange-300 border-orange-500/20" },
  blue:   { bg: "bg-blue-500/10",   border: "border-blue-500/20",   icon: "text-blue-400",   badge: "bg-blue-500/10 text-blue-300 border-blue-500/20" },
};

function getCategoryMeta(name = "") {
  const lower = name.toLowerCase();
  for (const m of CATEGORY_META) {
    if (m.keywords.some(k => lower.includes(k))) {
      return { Icon: m.icon, colors: COLOR_MAP[m.color] };
    }
  }
  return { Icon: BookOpen, colors: COLOR_MAP["violet"] };
}

export default function MyBBForum() {
  // view: "home" | "category" | "thread"
  const [view, setView] = useState("home");
  const [activeCategory, setActiveCategory] = useState(null); // full forum object
  const [selectedThread, setSelectedThread] = useState(null);
  const [showNewThread, setShowNewThread] = useState(false);
  const { mybbUser } = useMyBBAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [newSubject, setNewSubject] = useState("");
  const [newBody, setNewBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState("");

  const { data: forumsData, isLoading: forumsLoading } = useQuery({
    queryKey: ["mybb-forums"],
    queryFn: async () => {
      const res = await base44.functions.invoke("fetchMyBBForums", { action: "forums" });
      return res.data?.forums || [];
    },
    staleTime: 300000,
  });

  const forums = forumsData || [];

  const { data: recentData, isLoading: recentLoading, refetch: refetchRecent } = useQuery({
    queryKey: ["mybb-threads-recent"],
    queryFn: async () => {
      const res = await base44.functions.invoke("fetchMyBBForums", { action: "recent" });
      return res.data?.threads || [];
    },
    staleTime: 60000,
    enabled: view === "home",
  });

  const { data: categoryThreadsData, isLoading: categoryLoading, refetch: refetchCategory } = useQuery({
    queryKey: ["mybb-threads", activeCategory?.fid],
    queryFn: async () => {
      const res = await base44.functions.invoke("fetchMyBBForums", {
        action: "threads",
        fid: parseInt(activeCategory.fid),
      });
      return res.data?.threads || [];
    },
    staleTime: 60000,
    enabled: view === "category" && !!activeCategory,
  });

  const handleNewThread = async () => {
    if (!newSubject.trim() || !newBody.trim() || !mybbUser?.password) return;
    const targetFid = activeCategory ? parseInt(activeCategory.fid) : (forums[0] ? parseInt(forums[0].fid) : null);
    if (!targetFid) { setPostError("Please select a forum category first."); return; }
    setPosting(true);
    setPostError("");
    const res = await base44.functions.invoke("fetchMyBBForums", {
      action: "create_thread",
      fid: targetFid,
      subject: newSubject.trim(),
      message: newBody.trim(),
      username: mybbUser.username,
      password: mybbUser.password,
    });
    if (res.data?.ok) {
      setNewSubject(""); setNewBody(""); setShowNewThread(false);
      queryClient.invalidateQueries({ queryKey: ["mybb-threads", activeCategory?.fid] });
      queryClient.invalidateQueries({ queryKey: ["mybb-threads-recent"] });
    } else {
      setPostError(res.data?.result?.error || "Failed to create thread.");
    }
    setPosting(false);
  };

  // Thread view
  if (view === "thread" && selectedThread) {
    return (
      <div className="min-h-screen bg-background">
        <ThreadReader
          thread={selectedThread}
          onBack={() => { setSelectedThread(null); setView(activeCategory ? "category" : "home"); }}
        />
      </div>
    );
  }

  // Not logged in
  if (!mybbUser) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <PageHeader title="Community Forum" showBack />
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-16 h-16 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center mb-4">
            <LogIn className="w-8 h-8 text-violet-400" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Sign In Required</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs">
            Please sign in to access the Insomniacs GMRS community forum
          </p>
          <button
            onClick={() => navigate("/login")}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors mb-3"
          >
            <LogIn className="w-4 h-4" />
            Sign In
          </button>
          <Link to="/community-forum/register" className="text-sm text-violet-400 hover:text-violet-300">
            Don't have an account? Register
          </Link>
        </div>
      </div>
    );
  }

  const openThread = (thread) => {
    setSelectedThread(thread);
    setView("thread");
  };

  // ── CATEGORY VIEW ──────────────────────────────────────────────
  if (view === "category" && activeCategory) {
    const threads = categoryThreadsData || [];
    const { Icon, colors } = getCategoryMeta(activeCategory.name);
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-xl border-b border-border">
          <div className="flex items-center gap-3 h-14 px-4">
            <button onClick={() => { setView("home"); setActiveCategory(null); }} className="text-primary p-1 -ml-1">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className={`w-7 h-7 rounded-lg ${colors.bg} ${colors.border} border flex items-center justify-center`}>
              <Icon className={`w-3.5 h-3.5 ${colors.icon}`} />
            </div>
            <h1 className="text-base font-bold text-foreground flex-1 line-clamp-1">{activeCategory.name}</h1>
            <div className="flex items-center gap-1">
              {mybbUser?.password && (
                <button onClick={() => setShowNewThread(true)} className="p-2 text-violet-400 hover:text-violet-300">
                  <Plus className="w-5 h-5" />
                </button>
              )}
              <button onClick={() => refetchCategory()} className="p-2 text-muted-foreground hover:text-foreground">
                <RefreshCw className={`w-4 h-4 ${categoryLoading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>
          {activeCategory.description && (
            <p className="text-xs text-muted-foreground px-4 pb-2.5">{activeCategory.description}</p>
          )}
        </div>

        <div className="px-4 pt-3 space-y-2">
          {categoryLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : threads.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
              <p className="text-sm text-muted-foreground">No threads yet</p>
            </div>
          ) : (
            threads.map((thread, i) => <ThreadCard key={thread.threadId || i} thread={thread} onClick={() => openThread(thread)} />)
          )}
        </div>

        {showNewThread && (
          <NewThreadModal
            forumName={activeCategory.name}
            newSubject={newSubject} setNewSubject={setNewSubject}
            newBody={newBody} setNewBody={setNewBody}
            posting={posting} postError={postError}
            onSubmit={handleNewThread}
            onClose={() => { setShowNewThread(false); setPostError(""); }}
          />
        )}
      </div>
    );
  }

  // ── HOME VIEW ──────────────────────────────────────────────────
  const recentThreads = recentData || [];

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader
        title="Community Forum"
        showBack
        rightAction={
          <button onClick={() => refetchRecent()} className="p-2 text-muted-foreground hover:text-foreground">
            <RefreshCw className={`w-4 h-4 ${recentLoading ? "animate-spin" : ""}`} />
          </button>
        }
      />

      {/* Categories section */}
      <div className="px-4 pt-4 pb-2">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Categories</h2>
        {forumsLoading ? (
          <div className="grid grid-cols-2 gap-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-white/[0.04] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {forums.map((forum) => {
              const { Icon, colors } = getCategoryMeta(forum.name);
              return (
                <button
                  key={forum.fid}
                  onClick={() => { setActiveCategory(forum); setView("category"); }}
                  className="flex flex-col items-start p-4 rounded-2xl bg-white/[0.03] border border-white/[0.07] hover:border-white/[0.14] hover:bg-white/[0.06] active:scale-[0.97] transition-all text-left group"
                >
                  <div className={`w-9 h-9 rounded-xl ${colors.bg} ${colors.border} border flex items-center justify-center mb-2.5`}>
                    <Icon className={`w-4.5 h-4.5 ${colors.icon}`} />
                  </div>
                  <p className="text-sm font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-violet-200 transition-colors">{forum.name}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] text-muted-foreground">{parseInt(forum.threads || 0)} threads</span>
                    <span className="text-[10px] text-muted-foreground">·</span>
                    <span className="text-[10px] text-muted-foreground">{parseInt(forum.posts || 0)} posts</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent activity */}
      <div className="px-4 pt-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recent Activity</h2>
          <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
        {recentLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-white/[0.04] animate-pulse" />
            ))}
          </div>
        ) : recentThreads.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No recent activity</p>
        ) : (
          <div className="space-y-2">
            {recentThreads.slice(0, 8).map((thread, i) => (
              <ThreadCard key={thread.threadId || i} thread={thread} onClick={() => openThread(thread)} />
            ))}
          </div>
        )}
      </div>

      <div className="px-4 mt-4">
        <a
          href="https://insomniacsgmrs.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-violet-500/20 text-sm text-violet-400 hover:bg-violet-500/5 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Open Full Forum in Browser
        </a>
      </div>
    </div>
  );
}

function ThreadCard({ thread, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.07] hover:border-violet-500/30 hover:bg-violet-500/5 transition-all active:scale-[0.99] group"
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-violet-900/40 border border-violet-500/20 flex items-center justify-center shrink-0 text-[10px] font-bold text-violet-300 mt-0.5">
          {thread.author ? thread.author.slice(0, 2).toUpperCase() : "?"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground line-clamp-1 group-hover:text-violet-200 transition-colors">{thread.title}</p>
          <div className="flex items-center gap-2 mt-1">
            {thread.author && <span className="text-[11px] text-violet-300/70 font-medium">{thread.author}</span>}
            {thread.pubDate && <span className="text-[10px] text-muted-foreground">· {thread.pubDate}</span>}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {thread.replies !== undefined && (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <MessageSquare className="w-3 h-3" />{thread.replies}
            </span>
          )}
          {thread.views !== undefined && (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Eye className="w-3 h-3" />{thread.views}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function NewThreadModal({ forumName, newSubject, setNewSubject, newBody, setNewBody, posting, postError, onSubmit, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-lg bg-card rounded-2xl border border-border/60 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground">New Thread</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground">Posting in: <span className="text-violet-300">{forumName}</span></p>
        <input
          type="text"
          value={newSubject}
          onChange={(e) => setNewSubject(e.target.value)}
          placeholder="Thread title..."
          className="w-full bg-secondary/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-violet-500/50"
        />
        <textarea
          value={newBody}
          onChange={(e) => setNewBody(e.target.value)}
          placeholder="Write your post... BBCode supported"
          rows={6}
          className="w-full bg-secondary/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-violet-500/50"
        />
        {postError && <p className="text-xs text-red-400">{postError}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button
            size="sm"
            onClick={onSubmit}
            disabled={posting || !newSubject.trim() || !newBody.trim()}
            className="bg-violet-600 hover:bg-violet-700 text-white gap-2"
          >
            <Send className="w-3.5 h-3.5" />
            {posting ? "Posting..." : "Post Thread"}
          </Button>
        </div>
      </div>
    </div>
  );
}