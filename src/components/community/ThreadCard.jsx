import React from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Eye, Pin, Lock, Star, Megaphone, Flame, CheckCircle2, Shield } from "lucide-react";
import { getCategoryMeta, timeAgo, parseJSON } from "@/lib/forumUtils";

const STAFF_ROLES = ["platform_owner", "platform_admin", "community_owner", "community_admin", "moderator"];

export default function ThreadCard({ thread, unread = false, onCategoryClick }) {
  const navigate = useNavigate();
  const tags = parseJSON(thread.tags, []);
  const { Icon, colors } = getCategoryMeta(thread.category_name);
  const isHot = (thread.reply_count || 0) >= 15 || (thread.view_count || 0) >= 100;
  const isSolved = tags.some((t) => String(t).toLowerCase() === "solved");
  const isStaff = STAFF_ROLES.includes(thread.author_role);
  const lastPoster = thread.last_reply_author;

  const openThread = () => navigate(`/community/thread/${thread.id}`);
  const openProfile = (e) => {
    e.stopPropagation();
    if (thread.author_id) navigate(`/profile?user=${thread.author_id}`);
  };
  const openLastPoster = (e) => {
    e.stopPropagation();
    if (thread.last_reply_author_id) navigate(`/profile?user=${thread.last_reply_author_id}`);
  };

  return (
    <div
      onClick={openThread}
      className={`relative w-full text-left flex items-start gap-3 px-4 py-3.5 hover:bg-white/[0.03] active:bg-white/[0.05] transition-colors group cursor-pointer ${unread ? "bg-primary/[0.04]" : ""}`}
    >
      {unread && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />}
      <button onClick={openProfile} className="shrink-0 mt-0.5">
        {thread.author_avatar ? (
          <img src={thread.author_avatar} alt="" className="w-9 h-9 rounded-full object-cover border border-border" />
        ) : (
          <div className="w-9 h-9 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary">
            {(thread.author_name || "?")[0]}
          </div>
        )}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          {thread.is_announcement && <Megaphone className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
          {thread.is_pinned && <Pin className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
          {thread.is_featured && <Star className="w-3.5 h-3.5 text-yellow-400 shrink-0 fill-yellow-400/30" />}
          {isHot && <Flame className="w-3.5 h-3.5 text-orange-400 shrink-0" />}
          {isSolved && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
          {thread.is_locked && <Lock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
          <p className="text-sm font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
            {thread.title}
          </p>
        </div>
        {tags.length > 0 && (
          <div className="flex items-center gap-1 mt-1 flex-wrap">
            {tags.filter((t) => String(t).toLowerCase() !== "solved").slice(0, 3).map((t, i) => (
              <span key={i} className="text-[10px] text-muted-foreground bg-muted/30 px-1.5 py-0.5 rounded">#{t}</span>
            ))}
          </div>
        )}
        <div className="flex items-center gap-1.5 mt-1.5">
          <span className="text-[11px] text-primary/80 font-medium truncate">{thread.author_name || "Unknown"}</span>
          {isStaff && <Shield className="w-2.5 h-2.5 text-emerald-400 shrink-0" />}
          {thread.author_callsign && <span className="text-[10px] text-muted-foreground truncate">{thread.author_callsign}</span>}
          <span className="text-[10px] text-muted-foreground/50">·</span>
          <span className="text-[10px] text-muted-foreground">{timeAgo(thread.created_date)}</span>
        </div>
        {lastPoster && (
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[10px] text-muted-foreground">Last by</span>
            <button onClick={openLastPoster} className="flex items-center gap-1 min-w-0">
              {thread.last_reply_avatar && <img src={thread.last_reply_avatar} alt="" className="w-3.5 h-3.5 rounded-full object-cover" />}
              <span className="text-[10px] text-muted-foreground truncate max-w-[90px]">{lastPoster}</span>
            </button>
            <span className="text-[10px] text-muted-foreground/50">·</span>
            <span className="text-[10px] text-muted-foreground">{timeAgo(thread.last_reply_date)}</span>
          </div>
        )}
      </div>
      <div className="flex flex-col items-end gap-1.5 shrink-0 pt-0.5">
        {thread.category_name && (
          <button
            onClick={(e) => { e.stopPropagation(); onCategoryClick?.(thread.category_id, thread.category_name); }}
            className={`flex items-center gap-1 text-[10px] ${colors.text} ${colors.bg} px-1.5 py-0.5 rounded`}
          >
            <Icon className="w-2.5 h-2.5" />
            <span className="max-w-[80px] truncate">{thread.category_name}</span>
          </button>
        )}
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><MessageSquare className="w-3 h-3" />{thread.reply_count || 0}</span>
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><Eye className="w-3 h-3" />{thread.view_count || 0}</span>
        </div>
      </div>
    </div>
  );
}