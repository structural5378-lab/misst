import React from "react";
import { Users, MessageSquare, Hash, TrendingUp } from "lucide-react";

export default function MemberStats({ threads = 0, posts = 0, members = 0, categories = 0 }) {
  const stats = [
    { label: "Threads", value: threads, icon: Hash, color: "text-violet-400 bg-violet-500/10" },
    { label: "Posts", value: posts, icon: MessageSquare, color: "text-cyan-400 bg-cyan-500/10" },
    { label: "Members", value: members, icon: Users, color: "text-emerald-400 bg-emerald-500/10" },
    { label: "Categories", value: categories, icon: TrendingUp, color: "text-amber-400 bg-amber-500/10" },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 px-4 py-3">
      {stats.map((s) => (
        <div key={s.label} className="flex items-center gap-2 bg-card border border-border/50 rounded-xl px-3 py-2">
          <div className={`w-8 h-8 rounded-lg ${s.color} flex items-center justify-center shrink-0`}>
            <s.icon className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground leading-none">{s.value.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}