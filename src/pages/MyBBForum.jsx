import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, MessageSquare, Clock, ChevronRight, RefreshCw, User, Eye, LogIn, Plus, X, Send } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import PageHeader from "@/components/layout/PageHeader";
import ThreadReader from "@/components/forum/ThreadReader";
import { useMyBBAuth } from "@/lib/MyBBAuthContext";
import { Button } from "@/components/ui/button";

export default function MyBBForum() {
  const [activeFid, setActiveFid] = useState(null);
  const [selectedThread, setSelectedThread] = useState(null);
  const [showNewThread, setShowNewThread] = useState(false);
  const { mybbUser } = useMyBBAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // New thread form state
  const [newSubject, setNewSubject] = useState("");
  const [newBody, setNewBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState("");

  const { data: forumsData } = useQuery({
    queryKey: ["mybb-forums"],
    queryFn: async () => {
      const res = await base44.functions.invoke("fetchMyBBForums", { action: "forums" });
      return res.data?.forums || [];
    },
    staleTime: 300000,
  });

  const forums = (forumsData || []).filter(f => parseInt(f.threads) > 0 || parseInt(f.posts) > 0);

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

  const handleNewThread = async () => {
    if (!newSubject.trim() || !newBody.trim() || !mybbUser?.password) return;
    const targetFid = activeFid || (forums[0] ? parseInt(forums[0].fid) : null);
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
      setNewSubject("");
      setNewBody("");
      setShowNewThread(false);
      queryClient.invalidateQueries({ queryKey: ["mybb-threads", activeFid] });
    } else {
      setPostError(res.data?.result?.error || "Failed to create thread.");
    }
    setPosting(false);
  };

  if (selectedThread) {
    return (
      <div className="min-h-screen bg-background">
        <ThreadReader thread={selectedThread} onBack={() => setSelectedThread(null)} />
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader
        title="Community Forum"
        showBack
        rightAction={
          <div className="flex items-center gap-1">
            {mybbUser?.password && (
              <button onClick={() => setShowNewThread(true)} className="p-2 text-violet-400 hover:text-violet-300">
                <Plus className="w-5 h-5" />
              </button>
            )}
            <button onClick={() => refetch()} className="p-2 text-violet-400 hover:text-violet-300">
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        }
      />

      {/* New Thread Modal */}
      {showNewThread && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-lg bg-card rounded-2xl border border-border/60 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">New Thread</h3>
              <button onClick={() => { setShowNewThread(false); setPostError(""); }} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground mb-1">Posting in: <span className="text-violet-300">{activeFid ? forums.find(f => parseInt(f.fid) === activeFid)?.name : forums[0]?.name}</span></p>
              <input
                type="text"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                placeholder="Thread title..."
                className="w-full bg-secondary/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-violet-500/50"
              />
            </div>
            <textarea
              value={newBody}
              onChange={(e) => setNewBody(e.target.value)}
              placeholder="Write your post... BBCode supported"
              rows={6}
              className="w-full bg-secondary/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-violet-500/50"
            />
            {postError && <p className="text-xs text-red-400">{postError}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => { setShowNewThread(false); setPostError(""); }}>Cancel</Button>
              <Button
                size="sm"
                onClick={handleNewThread}
                disabled={posting || !newSubject.trim() || !newBody.trim()}
                className="bg-violet-600 hover:bg-violet-700 text-white gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                {posting ? "Posting..." : "Post Thread"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Category tabs */}
      <div className="overflow-x-auto px-4 pt-3 pb-2" style={{ scrollbarWidth: "none" }}>
        <div className="flex gap-2 w-max">
          <button
            onClick={() => setActiveFid(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              activeFid === null ? "bg-violet-600 text-white" : "bg-white/[0.05] text-muted-foreground hover:text-foreground border border-white/[0.08]"
            }`}
          >
            Recent
          </button>
          {forums.map((forum) => (
            <button
              key={forum.fid}
              onClick={() => setActiveFid(parseInt(forum.fid))}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                activeFid === parseInt(forum.fid) ? "bg-violet-600 text-white" : "bg-white/[0.05] text-muted-foreground hover:text-foreground border border-white/[0.08]"
              }`}
            >
              {forum.name}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 space-y-2">
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
                      <span className="flex items-center gap-1"><User className="w-2.5 h-2.5" />{thread.author}</span>
                    )}
                    {thread.replies !== undefined && (
                      <span className="flex items-center gap-1"><MessageSquare className="w-2.5 h-2.5" />{thread.replies} replies</span>
                    )}
                    {thread.views !== undefined && (
                      <span className="flex items-center gap-1"><Eye className="w-2.5 h-2.5" />{thread.views} views</span>
                    )}
                  </div>
                  {thread.pubDate && (
                    <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />{thread.pubDate}
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
          Open Full Forum in Browser
        </a>
      </div>
    </div>
  );
}