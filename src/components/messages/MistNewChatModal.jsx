import React, { useState } from "react";
import { Search, Loader2, UserPlus, Check, X, Users } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

export default function MistNewChatModal({ onClose, onConversationCreated, onGroupCreated }) {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("direct"); // "direct" | "group"
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupTitle, setGroupTitle] = useState("");
  const [creating, setCreating] = useState(false);

  const search = async (q) => {
    setQuery(q);
    if (q.trim().length < 1) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await base44.functions.invoke("searchUsers", { query: q });
      setResults(res.data?.users || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectUser = (u) => {
    setSelectedUsers((prev) => {
      const exists = prev.find((p) => p.id === u.id);
      if (exists) return prev.filter((p) => p.id !== u.id);
      return [...prev, u];
    });
  };

  const handleStartDirect = async (u) => {
    setCreating(true);
    try {
      const convId = await onConversationCreated(u.id, u.full_name || u.email, u.avatar_url, u.callsign);
      if (convId) onClose();
    } catch {}
    setCreating(false);
  };

  const handleCreateGroup = async () => {
    if (selectedUsers.length < 1 || !groupTitle.trim()) return;
    setCreating(true);
    try {
      const convId = await onGroupCreated(groupTitle.trim(), selectedUsers);
      if (convId) onClose();
    } catch {}
    setCreating(false);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-card border border-border rounded-t-2xl sm:rounded-2xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-4 z-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-foreground">New Conversation</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>
          {/* Mode toggle */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setMode("direct")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                mode === "direct" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
              }`}
            >
              <Search className="w-3.5 h-3.5" /> Direct
            </button>
            <button
              onClick={() => setMode("group")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                mode === "group" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
              }`}
            >
              <Users className="w-3.5 h-3.5" /> Group
            </button>
          </div>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => search(e.target.value)}
              autoFocus
              placeholder="Search by name, callsign, or email..."
              className="w-full bg-secondary border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>

        {/* Group title input */}
        {mode === "group" && (
          <div className="p-3 border-b border-border">
            <input
              value={groupTitle}
              onChange={(e) => setGroupTitle(e.target.value)}
              placeholder="Group name..."
              className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            {selectedUsers.length > 0 && (
              <p className="text-xs text-muted-foreground mt-2">{selectedUsers.length} member(s) selected</p>
            )}
          </div>
        )}

        {/* Selected users (group mode) */}
        {mode === "group" && selectedUsers.length > 0 && (
          <div className="flex gap-2 overflow-x-auto p-3 border-b border-border scrollbar-hide">
            {selectedUsers.map((u) => (
              <div key={u.id} className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 rounded-full pl-1 pr-2 py-1 shrink-0">
                {u.avatar_url ? (
                  <img src={u.avatar_url} alt="" className="w-6 h-6 rounded-full" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-[10px] font-bold">
                    {(u.full_name || "?")[0]}
                  </div>
                )}
                <span className="text-xs font-medium text-foreground">{u.full_name || u.email}</span>
                <button onClick={() => toggleSelectUser(u)} className="text-muted-foreground hover:text-destructive">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Search results */}
        <div className="p-2">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                {query ? "No users found" : "Start typing to search for members"}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {results.map((u) => {
                const isSelected = selectedUsers.some((p) => p.id === u.id);
                return (
                  <div
                    key={u.id}
                    onClick={() => mode === "group" ? toggleSelectUser(u) : handleStartDirect(u)}
                    className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-colors ${
                      isSelected ? "bg-primary/10 border border-primary/20" : "hover:bg-secondary"
                    }`}
                  >
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold">
                        {(u.full_name || u.email || "?")[0].toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{u.full_name || u.email}</p>
                      {u.callsign && <p className="text-xs text-muted-foreground">{u.callsign}</p>}
                    </div>
                    {mode === "group" && isSelected && <Check className="w-5 h-5 text-primary" />}
                    {mode === "direct" && creating && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Create group button */}
        {mode === "group" && (
          <div className="sticky bottom-0 bg-card border-t border-border p-3">
            <button
              onClick={handleCreateGroup}
              disabled={!groupTitle.trim() || selectedUsers.length < 1 || creating}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-xl text-sm font-semibold disabled:opacity-40 hover:bg-primary/90 transition-colors"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              Create Group ({selectedUsers.length})
            </button>
          </div>
        )}
      </div>
    </div>
  );
}