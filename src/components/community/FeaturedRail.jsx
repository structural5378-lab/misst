import React from "react";
import { useNavigate } from "react-router-dom";
import { Star, Flame } from "lucide-react";
import { timeAgo } from "@/lib/forumUtils";

export default function FeaturedRail({ threads = [] }) {
  const navigate = useNavigate();
  const featured = threads.filter((t) => t.is_featured).slice(0, 6);
  const trending = [...threads]
    .sort((a, b) => (b.reply_count || 0) * 3 + (b.view_count || 0) - ((a.reply_count || 0) * 3 + (a.view_count || 0)))
    .slice(0, 6);

  return (
    <div className="pt-3 space-y-3">
      {featured.length > 0 && (
        <Rail icon={Star} title="Featured" items={featured} accent="text-yellow-400" navigate={navigate} />
      )}
      {trending.length > 0 && (
        <Rail icon={Flame} title="Trending" items={trending} accent="text-orange-400" navigate={navigate} />
      )}
    </div>
  );
}

function Rail({ icon: Icon, title, items, accent, navigate }) {
  return (
    <div>
      <div className={`flex items-center gap-1.5 text-xs font-semibold ${accent} mb-1.5 px-4`}>
        <Icon className="w-3.5 h-3.5" /> {title}
      </div>
      <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4">
        {items.map((t) => (
          <button
            key={t.id}
            onClick={() => navigate(`/community/thread/${t.id}`)}
            className="shrink-0 w-44 text-left p-3 rounded-xl bg-card border border-border hover:border-primary/40 transition-colors"
          >
            <p className="text-xs font-semibold text-foreground line-clamp-2 leading-snug">{t.title}</p>
            <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
              <span className="truncate max-w-[80px]">{t.author_name || "Unknown"}</span>
              <span>·</span>
              <span>{timeAgo(t.last_reply_date || t.created_date)}</span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
              <span>{t.reply_count || 0} replies</span>
              <span>·</span>
              <span>{t.view_count || 0} views</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}