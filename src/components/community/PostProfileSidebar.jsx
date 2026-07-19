import React from "react";
import { useAuthorProfile } from "@/hooks/useAuthorProfile";
import { getRoleBadge } from "@/lib/forumUtils";
import { Shield, Star, Calendar, MessageSquare } from "lucide-react";

export default function PostProfileSidebar({ post, onOpenProfile }) {
  const { data: profile } = useAuthorProfile(post.author_id);
  const roleBadge = getRoleBadge(post.author_role);
  const stats = profile?.stats || {};
  const online = profile?.online;
  const joinDate = profile?.user?.created_date;
  const open = () => onOpenProfile?.(post.author_id, post.author_role, post.author_name);

  return (
    <div className="flex sm:flex-col items-center sm:items-start gap-3 shrink-0 sm:w-32">
      <button onClick={open} className="relative shrink-0">
        {post.author_avatar ? (
          <img src={post.author_avatar} alt="" className="w-10 h-10 sm:w-14 sm:h-14 rounded-2xl object-cover border border-border" />
        ) : (
          <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center text-sm font-bold text-primary">
            {(post.author_name || "A")[0]}
          </div>
        )}
        {online && <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-card" />}
      </button>
      <div className="min-w-0 sm:text-center">
        <button onClick={open} className="text-sm font-semibold text-foreground hover:text-primary transition-colors truncate block max-w-[120px]">
          {post.author_name || "Unknown"}
        </button>
        {post.author_callsign && <span className="text-[11px] text-primary block truncate">{post.author_callsign}</span>}
        <span className={`mt-1 inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded border ${roleBadge.color}`}>
          <Shield className="w-2.5 h-2.5" /> {roleBadge.label}
        </span>
        <div className="hidden sm:flex flex-col items-center gap-0.5 mt-2 text-[10px] text-muted-foreground">
          {stats.xp != null && (
            <span className="flex items-center gap-1"><Star className="w-2.5 h-2.5 text-yellow-400" />Lv {stats.level || 1}</span>
          )}
          {stats.reputation != null && <span>Rep {stats.reputation || 0}</span>}
          {stats.forum_posts != null && (
            <span className="flex items-center gap-1"><MessageSquare className="w-2.5 h-2.5" />{stats.forum_posts || 0}</span>
          )}
          {joinDate && (
            <span className="flex items-center gap-1"><Calendar className="w-2.5 h-2.5" />{new Date(joinDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
          )}
        </div>
      </div>
    </div>
  );
}