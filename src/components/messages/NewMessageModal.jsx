import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, Search, Loader2 } from "lucide-react";
import { useMyBBAuth } from "@/lib/MyBBAuthContext";

export default function NewMessageModal({ currentUser, onSelect, onClose }) {
  const { mybbUser } = useMyBBAuth();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!search.trim()) return;
    setLoading(true);
    setSearched(true);
    const q = search.toLowerCase().trim();
    const all = await base44.entities.User.list().catch(() => []);
    const filtered = all.filter((u) =>
      u.id !== currentUser.id && (
        u.full_name?.toLowerCase().includes(q) ||
        u.callsign?.toLowerCase().includes(q) ||
        u.mybb_username?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
      )
    );
    setResults(filtered);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full bg-[hsl(210,28%,11%)] border-t border-white/[0.08] rounded-t-2xl max-h-[70vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <span className="text-sm font-semibold text-foreground">New Message</span>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-2 border-b border-white/[0.06]">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search by name, callsign, or username..."
                className="w-full bg-white/[0.05] rounded-lg pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-3 py-2 rounded-lg bg-violet-600 text-white text-xs font-medium hover:bg-violet-700 transition-colors shrink-0"
            >
              Search
            </button>
          </div>
        </div>

        {/* Members list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
            </div>
          ) : searched && results.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">No members found</p>
          ) : !searched ? (
            <p className="text-xs text-muted-foreground text-center py-8">Search for a member to start a conversation</p>
          ) : (
            results.map((u) => (
              <button
                key={u.id}
                onClick={() => onSelect(u)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.04] transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-violet-400">
                    {(u.full_name || u.email || "?")[0].toUpperCase()}
                  </span>
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">{u.full_name || u.email}</p>
                  {u.callsign && <p className="text-xs text-muted-foreground">{u.callsign}</p>}
                  {u.mybb_username && <p className="text-xs text-muted-foreground/60">@{u.mybb_username}</p>}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}