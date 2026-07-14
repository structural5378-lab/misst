import React from "react";
import { ChevronRight, MessageSquare } from "lucide-react";
import { getCategoryMeta, timeAgo } from "@/lib/forumUtils";

export default function CategoryCard({ category, onClick }) {
  const { Icon, colors } = getCategoryMeta(category.name, category.color);
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.03] active:bg-white/[0.05] transition-colors text-left"
    >
      <div className={`w-11 h-11 rounded-xl ${colors.bg} ${colors.border} border flex items-center justify-center shrink-0`}>
        <Icon className={`w-5 h-5 ${colors.icon}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{category.name}</p>
        {category.description && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{category.description}</p>
        )}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
            <MessageSquare className="w-2.5 h-2.5" />{category.thread_count || 0} threads
          </span>
          {category.last_reply_date && (
            <>
              <span className="text-[10px] text-muted-foreground/50">·</span>
              <span className="text-[10px] text-muted-foreground">{timeAgo(category.last_reply_date)}</span>
            </>
          )}
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
    </button>
  );
}