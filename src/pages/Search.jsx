import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Search as SearchIcon, X, Clock, ArrowLeft, Hash, MessageSquare, Radio, Calendar, Users, ShoppingBag, User,
} from "lucide-react";
import { timeAgo } from "@/lib/forumUtils";

const TYPES = [
  { id: "all", label: "All", icon: SearchIcon },
  { id: "threads", label: "Threads", icon: MessageSquare },
  { id: "posts", label: "Posts", icon: Hash },
  { id: "members", label: "Members", icon: User },
  { id: "repeaters", label: "Repeaters", icon: Radio },
  { id: "events", label: "Events", icon: Calendar },
  { id: "clubs", label: "Clubs", icon: Users },
  { id: "equipment", label: "Equipment", icon: ShoppingBag },
];

export default function Search() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [activeType, setActiveType] = useState("all");
  const [recent, setRecent] = useState(() => {
    try { return JSON.parse(localStorage.getItem("mist_search_recent") || "[]"); } catch { return []; }
  });

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim().toLowerCase()), 250);
    return () => clearTimeout(t);
  }, [query]);

  const saveRecent = useCallback((q) => {
    if (!q.trim()) return;
    setRecent((prev) => {
      const next = [q.trim(), ...prev.filter((x) => x.toLowerCase() !== q.trim().toLowerCase())].slice(0, 8);
      localStorage.setItem("mist_search_recent", JSON.stringify(next));
      return next;
    });
  }, []);

  const enabled = !!debounced;
  const threads = useQuery({ queryKey: ["gsearch-threads"], queryFn: () => base44.entities.ForumThread.filter({}, "-last_reply_date", 100), enabled, staleTime: 60000 });
  const posts = useQuery({ queryKey: ["gsearch-posts"], queryFn: () => base44.entities.ForumPost.filter({}, "-created_date", 100), enabled, staleTime: 60000 });
  const members = useQuery({ queryKey: ["gsearch-members"], queryFn: () => base44.entities.UserStats.list("-created_date", 100), enabled, staleTime: 60000 });
  const repeaters = useQuery({ queryKey: ["gsearch-repeaters"], queryFn: () => base44.entities.Repeater.list("-created_date", 100), enabled, staleTime: 120000 });
  const events = useQuery({ queryKey: ["gsearch-events"], queryFn: () => base44.entities.Event.list("-created_date", 50), enabled, staleTime: 120000 });
  const clubs = useQuery({ queryKey: ["gsearch-clubs"], queryFn: () => base44.entities.Community.list("-created_date", 50), enabled, staleTime: 120000 });
  const equipment = useQuery({ queryKey: ["gsearch-equip"], queryFn: () => base44.entities.MarketplaceItem.list("-created_date", 50), enabled, staleTime: 120000 });

  const match = useCallback((text) => text && text.toLowerCase().includes(debounced), [debounced]);

  const results = useMemo(() => {
    if (!debounced) return [];
    const r = [];
    const want = (t) => activeType === "all" || activeType === t;
    if (want("threads")) (threads.data || []).forEach((x) => {
      if (match(x.title) || match(x.body)) r.push({ type: "threads", id: x.id, title: x.title, sub: x.category_name || "", date: x.last_reply_date, open: () => navigate(`/community/thread/${x.id}`) });
    });
    if (want("posts")) (posts.data || []).forEach((x) => {
      if (match(x.body)) r.push({ type: "posts", id: x.id, title: (x.body || "").slice(0, 80), sub: x.thread_title || x.author_name, date: x.created_date, open: () => navigate(`/community/thread/${x.thread_id}`) });
    });
    if (want("members")) (members.data || []).forEach((x) => {
      if (match(x.user_callsign) || match(x.user_name)) r.push({ type: "members", id: x.user_id, title: x.user_callsign || x.user_name || "Member", sub: x.user_name || "", date: x.created_date, open: () => navigate(`/profile?user=${x.user_id}`) });
    });
    if (want("repeaters")) (repeaters.data || []).forEach((x) => {
      if (match(x.name) || match(x.callsign) || match(x.location) || match(x.city)) r.push({ type: "repeaters", id: x.id, title: x.name || x.callsign || "Repeater", sub: [x.frequency, x.city, x.location].filter(Boolean).join(" · "), date: x.created_date, open: () => navigate(`/repeaters/${x.id}`) });
    });
    if (want("events")) (events.data || []).forEach((x) => {
      if (match(x.title) || match(x.location) || match(x.description)) r.push({ type: "events", id: x.id, title: x.title || "Event", sub: x.location || x.date, date: x.created_date, open: () => navigate(`/events`) });
    });
    if (want("clubs")) (clubs.data || []).forEach((x) => {
      if (match(x.name) || match(x.description) || match(x.callsign)) r.push({ type: "clubs", id: x.id, title: x.name, sub: x.category || x.callsign || "", date: x.created_date, open: () => navigate(`/c/${x.slug}`) });
    });
    if (want("equipment")) (equipment.data || []).forEach((x) => {
      if (match(x.title) || match(x.description)) r.push({ type: "equipment", id: x.id, title: x.title, sub: x.price ? `$${x.price}` : "", date: x.created_date, open: () => navigate(`/shopping`) });
    });
    return r.slice(0, 60);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced, activeType, threads.data, posts.data, members.data, repeaters.data, events.data, clubs.data, equipment.data, navigate]);

  const anyLoading = [threads, posts, members, repeaters, events, clubs, equipment].some((q) => q.isLoading);
  const typeMeta = (t) => TYPES.find((x) => x.id === t);

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="flex items-center gap-2 h-14 px-4">
          <button onClick={() => navigate(-1)} className="text-primary p-1 -ml-1"><ArrowLeft className="w-5 h-5" /></button>
          <div className="flex-1 flex items-center gap-2 bg-secondary/50 rounded-lg px-3">
            <SearchIcon className="w-4 h-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") saveRecent(query); }}
              autoFocus
              placeholder="Search all of MIST..."
              className="flex-1 bg-transparent py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            {query && <button onClick={() => setQuery("")} className="text-muted-foreground"><X className="w-4 h-4" /></button>}
          </div>
        </div>
        <div className="flex gap-1.5 px-4 pb-2 overflow-x-auto scrollbar-hide">
          {TYPES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveType(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${activeType === id ? "bg-primary/15 text-primary border border-primary/30" : "text-muted-foreground border border-border/40"}`}
            >
              <Icon className="w-3.5 h-3.5" />{label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-3">
        {!debounced ? (
          <div>
            {recent.length > 0 ? (
              <div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2"><Clock className="w-3.5 h-3.5" />Recent searches</div>
                <div className="flex flex-wrap gap-2">
                  {recent.map((q) => (
                    <button key={q} onClick={() => setQuery(q)} className="px-3 py-1.5 rounded-full bg-muted/40 border border-border/50 text-xs text-foreground hover:border-primary/40">{q}</button>
                  ))}
                  <button onClick={() => { setRecent([]); localStorage.removeItem("mist_search_recent"); }} className="text-xs text-muted-foreground hover:text-destructive">Clear</button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">Search threads, members, repeaters, events, clubs and equipment.</p>
            )}
          </div>
        ) : anyLoading ? (
          <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : results.length === 0 ? (
          <div className="text-center py-16">
            <SearchIcon className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-sm text-muted-foreground">No results for "{query}"</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">{results.length} result{results.length !== 1 ? "s" : ""}</p>
            {results.map((r) => {
              const TM = typeMeta(r.type);
              const Icon = TM?.icon || SearchIcon;
              return (
                <button key={`${r.type}-${r.id}`} onClick={() => { saveRecent(query); r.open(); }} className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/40 text-left transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Icon className="w-4 h-4 text-primary" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{r.title}</p>
                    {r.sub && <p className="text-xs text-muted-foreground truncate">{r.sub}</p>}
                  </div>
                  {r.date && <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo(r.date)}</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}