import React, { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Check, CheckCheck, Inbox, ArrowLeft, Trash2, Search, X, CheckSquare } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { NOTIF_FILTERS, NOTIF_TYPE_META } from "@/lib/notificationTypes";
import { timeAgo } from "@/lib/forumUtils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const TIME_FILTERS = [
  { id: "all", label: "All" },
  { id: "today", label: "Today" },
  { id: "week", label: "This Week" },
  { id: "month", label: "This Month" },
];

function withinRange(createdDate, range) {
  if (range === "all") return true;
  const d = new Date(createdDate);
  const now = new Date();
  if (range === "today") return d.toDateString() === now.toDateString();
  if (range === "week") return now - d <= 7 * 24 * 60 * 60 * 1000;
  if (range === "month") return now - d <= 30 * 24 * 60 * 60 * 1000;
  return true;
}

export default function Notifications() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [query, setQuery] = useState("");
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const { list, unreadCount, loading, hasMore, loadMore, markRead, markManyRead, markAllRead, remove, removeMany, deleteAll } = useNotifications();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list.filter((n) => {
      if (filter !== "all" && n.type !== filter) return false;
      if (unreadOnly && n.read) return false;
      if (!withinRange(n.created_date, timeFilter)) return false;
      if (q) {
        const hay = `${n.title || ""} ${n.message || ""} ${n.sender_name || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [list, filter, unreadOnly, timeFilter, query]);

  // Infinite scroll sentinel.
  const sentinelRef = useRef(null);
  useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => { if (entries[0].isIntersecting) loadMore(); }, { rootMargin: "200px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loadMore]);

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const clearSelection = () => { setSelected(new Set()); setSelectMode(false); };

  const open = (n) => {
    if (selectMode) { toggleSelect(n.id); return; }
    if (!n.read) markRead.mutate(n.id);
    if (n.link) navigate(n.link);
  };

  const selectedIds = [...selected];

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="text-primary p-1 -ml-1"><ArrowLeft className="w-5 h-5" /></button>
            <h1 className="text-base font-bold text-foreground">Notifications</h1>
            {unreadCount > 0 && (
              <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">{unreadCount}</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setSelectMode((s) => !s); setSelected(new Set()); }}
              className={`flex items-center gap-1 text-xs ${selectMode ? "text-primary" : "text-muted-foreground"}`}
            >
              <CheckSquare className="w-3.5 h-3.5" /> {selectMode ? "Done" : "Select"}
            </button>
            {!selectMode && unreadCount > 0 && (
              <button onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending}
                className="flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50">
                <CheckCheck className="w-3.5 h-3.5" /> Mark all
              </button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="px-4 pb-2 relative">
          <Search className="w-4 h-4 text-muted-foreground absolute left-7 top-1/2 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notifications…"
            className="pl-9 h-9 text-sm bg-muted/30 border-border/40"
          />
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category filters */}
        <div className="flex gap-1.5 px-4 pb-2 overflow-x-auto scrollbar-hide">
          {NOTIF_FILTERS.map(({ id, label, icon: Icon }) => {
            const count = id === "all" ? unreadCount : list.filter((n) => n.type === id && !n.read).length;
            return (
              <button key={id} onClick={() => setFilter(id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
                  filter === id ? "bg-primary/15 text-primary border border-primary/30" : "text-muted-foreground border border-border/40"
                }`}>
                <Icon className="w-3.5 h-3.5" /> {label}
                {count > 0 && <span className="text-[9px] bg-primary/20 text-primary px-1 rounded-full">{count}</span>}
              </button>
            );
          })}
        </div>

        {/* Time + unread filters */}
        <div className="flex gap-1.5 px-4 pb-2 overflow-x-auto scrollbar-hide">
          {TIME_FILTERS.map(({ id, label }) => (
            <button key={id} onClick={() => setTimeFilter(id)}
              className={`px-3 py-1 rounded-full text-[11px] font-medium whitespace-nowrap ${
                timeFilter === id ? "bg-accent/15 text-accent border border-accent/30" : "text-muted-foreground border border-border/40"
              }`}>
              {label}
            </button>
          ))}
          <button onClick={() => setUnreadOnly((v) => !v)}
            className={`px-3 py-1 rounded-full text-[11px] font-medium whitespace-nowrap ${
              unreadOnly ? "bg-primary/15 text-primary border border-primary/30" : "text-muted-foreground border border-border/40"
            }`}>
            Unread only
          </button>
        </div>

        {/* Selection action bar */}
        {selectMode && (
          <div className="flex items-center gap-2 px-4 pb-2 fade-in">
            <span className="text-xs text-muted-foreground">{selectedIds.length} selected</span>
            <Button size="sm" variant="outline" disabled={!selectedIds.length || markManyRead.isPending}
              onClick={() => { markManyRead.mutate(selectedIds); clearSelection(); }}
              className="h-7 text-xs">
              <Check className="w-3.5 h-3.5" /> Mark read
            </Button>
            <Button size="sm" variant="outline" disabled={!selectedIds.length || removeMany.isPending}
              onClick={() => { removeMany.mutate(selectedIds); clearSelection(); }}
              className="h-7 text-xs">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </Button>
            <Button size="sm" variant="ghost" disabled={deleteAll.isPending}
              onClick={() => { if (confirm("Delete ALL notifications? This cannot be undone.")) { deleteAll.mutate(); clearSelection(); } }}
              className="h-7 text-xs text-destructive ml-auto">
              Delete all
            </Button>
          </div>
        )}
      </div>

      <div className="py-3">
        {loading ? (
          <div className="divide-y divide-border/30">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3 animate-pulse">
                <div className="w-9 h-9 rounded-lg bg-muted/40" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-2/3 rounded bg-muted/40" />
                  <div className="h-2.5 w-full rounded bg-muted/30" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 fade-in">
            <Inbox className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-sm text-muted-foreground">
              {query || filter !== "all" || unreadOnly || timeFilter !== "all" ? "No notifications match your filters" : "You're all caught up"}
            </p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-border/30">
              {filtered.map((n) => {
                const M = NOTIF_TYPE_META[n.type] || NOTIF_FILTERS[0];
                const Icon = M.icon;
                const isSel = selected.has(n.id);
                return (
                  <div key={n.id}
                    className={`flex items-start gap-3 px-4 py-3 fade-in ${!n.read ? "bg-primary/[0.04]" : ""} ${isSel ? "bg-primary/10" : ""}`}>
                    {selectMode ? (
                      <button onClick={() => toggleSelect(n.id)} className="mt-1 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0"
                        style={{ borderColor: isSel ? "hsl(var(--primary))" : "hsl(var(--border))", background: isSel ? "hsl(var(--primary))" : "transparent" }}>
                        {isSel && <Check className="w-3 h-3 text-primary-foreground" />}
                      </button>
                    ) : null}
                    <button onClick={() => open(n)} className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: `${M.color || "hsl(var(--primary))"}22`, color: M.color || "hsl(var(--primary))" }}>
                      <Icon className="w-4 h-4" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <button onClick={() => open(n)} className="text-left w-full">
                        <p className={`text-sm line-clamp-1 ${!n.read ? "font-semibold text-foreground" : "font-medium text-foreground/80"}`}>{n.title}</p>
                        {n.message && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.message}</p>}
                        <p className="text-[10px] text-muted-foreground/70 mt-1">
                          {n.sender_name ? `from ${n.sender_name} · ` : ""}{n.created_date ? timeAgo(n.created_date) : ""}
                        </p>
                      </button>
                    </div>
                    {!selectMode && (
                      <div className="flex items-center gap-1 shrink-0 mt-1">
                        {!n.read && (
                          <button onClick={() => markRead.mutate(n.id)} title="Mark read" className="p-1.5 text-muted-foreground hover:text-primary">
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button onClick={() => remove.mutate(n.id)} title="Delete" className="p-1.5 text-muted-foreground hover:text-destructive">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                    {!n.read && !selectMode && <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />}
                  </div>
                );
              })}
            </div>
            {hasMore && <div ref={sentinelRef} className="flex justify-center py-6"><div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}
          </>
        )}
      </div>
    </div>
  );
}