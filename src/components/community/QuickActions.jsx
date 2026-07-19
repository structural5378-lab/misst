import React from "react";
import { useNavigate } from "react-router-dom";
import { PenSquare, Search, FileText, Bookmark, BellRing, ShieldCheck, Globe } from "lucide-react";

export default function QuickActions({ onSearch, isAdmin }) {
  const navigate = useNavigate();
  const actions = [
    { label: "New Post", icon: PenSquare, color: "text-primary bg-primary/10 border-primary/20", onClick: () => navigate("/community/new") },
    { label: "Search", icon: Search, color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20", onClick: onSearch },
    { label: "Global", icon: Globe, color: "text-blue-400 bg-blue-500/10 border-blue-500/20", onClick: () => navigate("/search") },
    { label: "My Posts", icon: FileText, color: "text-violet-400 bg-violet-500/10 border-violet-500/20", onClick: () => navigate("/community?filter=mine") },
    { label: "Bookmarks", icon: Bookmark, color: "text-amber-400 bg-amber-500/10 border-amber-500/20", onClick: () => navigate("/community?filter=bookmarks") },
    { label: "Subscribed", icon: BellRing, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", onClick: () => navigate("/community?filter=subscribed") },
  ];
  if (isAdmin) {
    actions.push({ label: "Mod Queue", icon: ShieldCheck, color: "text-rose-400 bg-rose-500/10 border-rose-500/20", onClick: () => navigate("/community?filter=moderation") });
  }
  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide px-4 py-2">
      {actions.map((a) => (
        <button
          key={a.label}
          onClick={a.onClick}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium whitespace-nowrap shrink-0 ${a.color} hover:opacity-80 transition-opacity`}
        >
          <a.icon className="w-3.5 h-3.5" />
          {a.label}
        </button>
      ))}
    </div>
  );
}