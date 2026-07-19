import React from "react";
import { Bell, BellOff, Bookmark, Share2, Flag, Link2, Pin, Lock, Star, Flame, CheckCircle2, Eye, MessageSquare, Clock } from "lucide-react";
import { getCategoryMeta, parseJSON, timeAgo } from "@/lib/forumUtils";

export default function ThreadHeader({ thread, subscribed, bookmarked, onSubscribe, onBookmark, onShare, onCopyLink, onReport, onBack }) {
  const tags = parseJSON(thread.tags, []);
  const { Icon, colors } = getCategoryMeta(thread.category_name);

  const ActionBtn = ({ onClick, active, icon: IconC, label, activeClass }) => (
    <button
      onClick={onClick}
      title={label}
      className={`p-2 rounded-lg border transition-colors ${
        active
          ? activeClass || "bg-primary/15 border-primary/30 text-primary"
          : "border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/40"
      }`}
    >
      <IconC className="w-4 h-4" />
    </button>
  );

  return (
    <div className="bg-card/60 border-b border-border px-4 py-3">
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-2">
        <button onClick={onBack} className="hover:text-primary">Community</button>
        <span>/</span>
        <span className={`${colors.text} flex items-center gap-0.5`}>
          <Icon className="w-3 h-3" />
          {thread.category_name || "General"}
        </span>
      </div>
      <h1 className="text-base font-bold text-foreground leading-snug">{thread.title}</h1>

      <div className="flex items-center gap-1.5 flex-wrap mt-2">
        {thread.is_pinned && <StatusChip icon={Pin} label="Pinned" className="text-amber-400 bg-amber-500/10 border-amber-500/30" />}
        {thread.is_locked && <StatusChip icon={Lock} label="Locked" className="text-muted-foreground bg-muted/30 border-border" />}
        {thread.is_featured && <StatusChip icon={Star} label="Featured" className="text-yellow-400 bg-yellow-500/10 border-yellow-500/30" />}
        {thread.is_announcement && <StatusChip icon={Flame} label="Announcement" className="text-rose-400 bg-rose-500/10 border-rose-500/30" />}
        {tags.some((t) => String(t).toLowerCase() === "solved") && (
          <StatusChip icon={CheckCircle2} label="Solved" className="text-emerald-400 bg-emerald-500/10 border-emerald-500/30" />
        )}
      </div>

      {tags.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap mt-1.5">
          {tags.map((t, i) => (
            <span key={i} className="text-[10px] text-muted-foreground bg-muted/30 px-1.5 py-0.5 rounded">#{t}</span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 mt-2.5 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{thread.reply_count || 0}</span>
        <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{thread.view_count || 0}</span>
        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(thread.created_date)}</span>
      </div>

      <div className="flex items-center gap-1.5 mt-3">
        <ActionBtn onClick={onSubscribe} active={subscribed} icon={subscribed ? Bell : BellOff} label="Subscribe" />
        <ActionBtn onClick={onBookmark} active={bookmarked} icon={Bookmark} label="Bookmark" activeClass="bg-amber-500/15 border-amber-500/30 text-amber-400" />
        <ActionBtn onClick={onShare} icon={Share2} label="Share" />
        <ActionBtn onClick={onCopyLink} icon={Link2} label="Copy link" />
        <ActionBtn onClick={onReport} icon={Flag} label="Report" />
      </div>
    </div>
  );
}

function StatusChip({ icon: Icon, label, className }) {
  return (
    <span className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${className}`}>
      <Icon className="w-2.5 h-2.5" />{label}
    </span>
  );
}