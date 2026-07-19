import React from "react";
import { Link } from "react-router-dom";
import { UserPlus } from "lucide-react";
import { timeAgo } from "@/lib/forumUtils";

const INTRO_KEYWORDS = ["introduce", "welcome", "new member", "hello", "about me", "new here"];

export default function NewMembersStrip({ threads = [] }) {
  const intros = threads
    .filter(
      (t) =>
        INTRO_KEYWORDS.some((k) => (t.category_name || "").toLowerCase().includes(k)) ||
        INTRO_KEYWORDS.some((k) => (t.title || "").toLowerCase().includes(k))
    )
    .slice(0, 8);

  return (
    <div className="px-4 pt-3">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 mb-1.5 px-1">
        <UserPlus className="w-3.5 h-3.5" /> New Member Intros
      </div>
      {intros.length === 0 ? (
        <p className="text-xs text-muted-foreground px-1">No introductions yet — say hello in the Introductions category.</p>
      ) : (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {intros.map((t) => (
            <Link
              key={t.id}
              to={`/community/thread/${t.id}`}
              className="shrink-0 w-40 flex items-center gap-2 p-2.5 rounded-xl bg-card border border-border hover:border-emerald-500/40 transition-colors"
            >
              {t.author_avatar ? (
                <img src={t.author_avatar} alt="" className="w-8 h-8 rounded-full object-cover border border-border shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center text-[10px] font-bold text-emerald-400 shrink-0">
                  {(t.author_name || "?")[0]}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{t.author_name || "New Member"}</p>
                <p className="text-[10px] text-muted-foreground truncate">{timeAgo(t.created_date)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}