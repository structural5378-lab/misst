import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, MessageSquare, Clock, ChevronRight, RefreshCw } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import ThreadReader from "@/components/forum/ThreadReader";
import { formatDistanceToNow } from "date-fns";

const FORUM_CATEGORIES = [
  { fid: null, label: "Recent" },
  { fid: 4, label: "Announcements" },
  { fid: 1, label: "General" },
  { fid: 5, label: "Introductions" },
  { fid: 6, label: "Repeaters" },
  { fid: 9, label: "Equipment" },
  { fid: 10, label: "Technical" },
  { fid: 13, label: "Outdoors" },
  { fid: 8, label: "Reports" },
  { fid: 7, label: "On-Air" },
];

function timeAgo(dateStr) {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return dateStr;
  }
}

function stripHtmlPreview(html) {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .trim();
}

export default function MyBBForum() {
  const [activeFid, setActiveFid] = useState(null);
  const [selectedThread, setSelectedThread] = useState(null);

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

  // Show inline thread reader
  if (selectedThread) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <ThreadReader thread={selectedThread} onBack={() => setSelectedThread(null)} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Community Forum"
        showBack
        rightAction={
          <button onClick={() => refetch()} className="p-2 text-violet-400 hover:text-violet-300">
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        }
      />

      {/* Category tabs */}
      <div className="overflow-x-auto px-4 pt-3 pb-2" style={{ scrollbarWidth: "none" }}>
        <div className="flex gap-2 w-max">
          {FORUM_CATEGORIES.map(({ fid, label }) => (
            <button
              key={label}
              onClick={() => setActiveFid(fid)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                activeFid === fid
                  ? "bg-violet-600 text-white"
                  : "bg-white/[0.05] text-muted-foreground hover:text-foreground border border-white/[0.08]"
              }`}
            >
              {label}
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
              key={i}
              onClick={() => thread.threadId ? setSelectedThread(thread) : window.open(thread.link, "_blank")}
              className="w-full text-left p-4 rounded-xl bg-white/[0.03] border border-white/[0.07] hover:border-violet-500/30 hover:bg-violet-500/5 transition-all active:scale-[0.99]"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-foreground line-clamp-2">{thread.title}</h4>
                  {thread.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {stripHtmlPreview(thread.description)}
                    </p>
                  )}
                  {thread.pubDate && (
                    <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {timeAgo(thread.pubDate)}
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