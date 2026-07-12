import React, { useMemo } from "react";
import { Search, Radio, UserCircle } from "lucide-react";

const FILTERS = [
  { id: "online", label: "Online" },
  { id: "club", label: "Club" },
  { id: "emergency", label: "Emergency" },
  { id: "repeaters", label: "Repeaters" },
];

export default function RadioScopeSearch({
  searchQuery, onSearchChange, activeFilter, onFilterChange, repeaters, onlineUsers, onResultClick,
}) {
  const results = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];
    const q = searchQuery.toLowerCase();
    const repResults = repeaters
      .filter((r) => r.latitude && r.longitude)
      .filter((r) =>
        r.callsign?.toLowerCase().includes(q) ||
        String(r.frequency || "").includes(q) ||
        r.location?.toLowerCase().includes(q) ||
        r.community_name?.toLowerCase().includes(q)
      )
      .slice(0, 5)
      .map((r) => ({ ...r, type: "repeater", label: r.callsign, sub: `${r.frequency?.toFixed(4) || ""} MHz · ${r.location || ""}` }));
    const userResults = onlineUsers
      .filter((u) => u.user_name?.toLowerCase().includes(q))
      .slice(0, 5)
      .map((u) => ({ ...u, type: "user", label: u.user_name, sub: u.status || "online" }));
    return [...repResults, ...userResults];
  }, [searchQuery, repeaters, onlineUsers]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-black/80 backdrop-blur border border-cyan-500/20">
        <Search className="w-5 h-5 text-cyan-500/70 shrink-0" />
        <input
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search repeaters, users, clubs..."
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide px-1">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => onFilterChange(activeFilter === f.id ? null : f.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-colors ${
              activeFilter === f.id
                ? "bg-cyan-600 text-white border-cyan-500"
                : "bg-black/60 text-muted-foreground border-cyan-500/20 backdrop-blur"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {results.length > 0 && (
        <div className="bg-black/90 backdrop-blur rounded-2xl border border-cyan-500/20 overflow-hidden shadow-xl">
          {results.map((r, i) => (
            <button
              key={`${r.type}-${r.id || r.user_uid || i}`}
              onClick={() => onResultClick(r)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-cyan-500/10 transition-colors text-left border-b border-border/30 last:border-0"
            >
              {r.type === "repeater" ? (
                <Radio className="w-5 h-5 text-violet-400 shrink-0" />
              ) : (
                <UserCircle className="w-5 h-5 text-cyan-400 shrink-0" />
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{r.label}</p>
                <p className="text-xs text-muted-foreground truncate">{r.sub}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}