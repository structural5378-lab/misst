import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, MessageSquare, Clock, ChevronRight, RefreshCw, User, Eye, UserPlus, LogIn } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import PageHeader from "@/components/layout/PageHeader";
import ThreadReader from "@/components/forum/ThreadReader";

export default function MyBBForum() {
  const [activeFid, setActiveFid] = useState(null);
  const [selectedThread, setSelectedThread] = useState(null);
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.isAuthenticated().then((authed) => {
      setIsAuthenticated(authed);
      if (authed) {
        base44.auth.me().then(setUser).catch(() => {});
      }
    });
  }, []);

  // Load forums dynamically
  const { data: forumsData } = useQuery({
    queryKey: ["mybb-forums"],
    queryFn: async () => {
      const res = await base44.functions.invoke("fetchMyBBForums", { action: "forums" });
      return res.data?.forums || [];
    },
    staleTime: 300000,
  });

  const forums = forumsData || [];

  // Load threads for active category (or all recent)
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["mybb-threads", activeFid],
    queryFn: async () => {
      const res = await base44.functions.invoke("fetchMyBBForums", {
        action: activeFid ? "threads" : "recent",
        fid: activeFid,
      });
      return res.data;
    },
    staleTime: 60000,
  });

  const threads = data?.threads || [];

  if (selectedThread) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <ThreadReader thread={selectedThread} onBack={() => setSelectedThread(null)} />
      </div>
    );
  }

  // Not authenticated - show sign-in prompt
  if (isAuthenticated === false) {
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
          <Link
            to="/community-forum/register"
            className="text-sm text-violet-400 hover:text-violet-300 transition-colors"
          >
            Don't have an account? Register
          </Link>
        </div>
      </div>
    );
  }

  // Loading auth state
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Community Forum"
        showBack
        rightAction={
          <div className="flex items-center gap-1">
            <Link to="/community-forum/register" className="p-2 text-violet-400 hover:text-violet-300">
              <UserPlus className="w-4 h-4" />
            </Link>
            <button onClick={() => refetch()} className="p-2 text-violet-400 hover:text-violet-300">
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        }
      />

      {/* Category tabs */}
      <div className="overflow-x-auto px-4 pt-3 pb-2" style={{ scrollbarWidth: "none" }}>
        <div className="flex gap-2 w-max">
          <button
            onClick={() => setActiveFid(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              activeFid === null
                ? "bg-violet-600 text-white"
                : "bg-white/[0.05] text-muted-foreground hover:text-foreground border border-white/[0.08]"
            }`}
          >
            Recent
          </button>
          {forums
            .filter(f => parseInt(f.threads) > 0 || parseInt(f.posts) > 0)
            .map((forum) => (
              <button
                key={forum.fid}
                onClick={() => setActiveFid(parseInt(forum.fid))}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  activeFid === parseInt(forum.fid)
                    ? "bg-violet-600 text-white"
                    : "bg-white/[0.05] text-muted-foreground hover:text-foreground border border-white/[0.08]"
                }`}
              >
                {forum.name}
              </button>
            ))}
        </div>
      </div>

      <div className="px-4 space-y-2 pb-24">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : threads.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-sm text-muted-foreground">No threads found</p>
          </div>
        ) : (
          threads.map((thread, i) => (
            <button
              key={thread.threadId || i}
              onClick={() => setSelectedThread(thread)}
              className="w-full text-left p-4 rounded-xl bg-white/[0.03] border border-white/[0.07] hover:border-violet-500/30 hover:bg-violet-500/5 transition-all active:scale-[0.99]"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-foreground line-clamp-2">{thread.title}</h4>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                    {thread.author && (
                      <span className="flex items-center gap-1">
                        <User className="w-2.5 h-2.5" />
                        {thread.author}
                      </span>
                    )}
                    {thread.replies !== undefined && (
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-2.5 h-2.5" />
                        {thread.replies} replies
                      </span>
                    )}
                    {thread.views !== undefined && (
                      <span className="flex items-center gap-1">
                        <Eye className="w-2.5 h-2.5" />
                        {thread.views} views
                      </span>
                    )}
                  </div>
                  {thread.pubDate && (
                    <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {thread.pubDate}
                    </p>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              </div>
            </button>
          ))
        )}

        <a
          href="https://insomniacsgmrs.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full mt-2 py-3 rounded-xl border border-violet-500/20 text-sm text-violet-400 hover:bg-violet-500/5 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Open Full Forum
        </a>
      </div>
    </div>
  );
}