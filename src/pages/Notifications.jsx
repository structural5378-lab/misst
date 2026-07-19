import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Bell, MessageSquare, AtSign, Mail, AlertTriangle, Calendar, Award,
  Check, CheckCheck, Inbox, ArrowLeft,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { timeAgo, parseJSON } from "@/lib/forumUtils";

const FILTERS = [
  { id: "all", label: "All", icon: Bell },
  { id: "replies", label: "Replies", icon: MessageSquare },
  { id: "mentions", label: "Mentions", icon: AtSign },
  { id: "messages", label: "Messages", icon: Mail },
  { id: "alerts", label: "Alerts", icon: AlertTriangle },
  { id: "events", label: "Events", icon: Calendar },
  { id: "achievements", label: "Awards", icon: Award },
];

export default function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("all");

  const subsQ = useQuery({ queryKey: ["forum-subs", user?.id], queryFn: () => base44.entities.ForumSubscription.filter({ user_id: user.id }, "-created_date", 100), enabled: !!user?.id, staleTime: 15000 });
  const alertsQ = useQuery({ queryKey: ["alerts-unread"], queryFn: () => base44.entities.Alert.filter({ is_read: false }, "-created_date", 50), staleTime: 20000 });
  const partsQ = useQuery({ queryKey: ["dm-parts", user?.id], queryFn: () => base44.entities.ConversationParticipant.filter({ user_id: user.id }, "-updated_date", 100), enabled: !!user?.id, staleTime: 15000 });
  const convsQ = useQuery({ queryKey: ["dm-convs"], queryFn: () => base44.entities.Conversation.list("-last_message_at", 100), staleTime: 15000 });
  const postsQ = useQuery({ queryKey: ["recent-posts-mentions"], queryFn: () => base44.entities.ForumPost.filter({}, "-created_date", 60), enabled: !!user?.id, staleTime: 30000 });
  const eventsQ = useQuery({ queryKey: ["upcoming-events"], queryFn: () => base44.entities.Event.filter({ status: "upcoming" }, "event_time", 30), staleTime: 60000 });
  const achQ = useQuery({ queryKey: ["my-achievements", user?.id], queryFn: () => base44.entities.UserAchievement.filter({ user_id: user.id }, "-unlocked_date", 10), enabled: !!user?.id, staleTime: 30000 });

  // Real-time updates
  useEffect(() => {
    const u1 = base44.entities.ForumSubscription.subscribe(() => subsQ.refetch());
    const u2 = base44.entities.Alert.subscribe(() => alertsQ.refetch());
    const u3 = base44.entities.ConversationParticipant.subscribe(() => partsQ.refetch());
    return () => { u1?.(); u2?.(); u3?.(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const convById = useMemo(() => {
    const m = {};
    (convsQ.data || []).forEach((c) => { m[c.id] = c; });
    return m;
  }, [convsQ.data]);

  const items = useMemo(() => {
    const list = [];
    (subsQ.data || []).filter((s) => (s.unread_count || 0) > 0).forEach((s) => {
      list.push({
        key: "sub-" + s.id, type: "replies", unread: true,
        title: s.thread_title || "Subscribed thread",
        body: `${s.unread_count} new ${s.unread_count === 1 ? "reply" : "replies"} in ${s.category_name || "discussion"}`,
        time: s.last_read_date || s.updated_date,
        open: () => navigate(`/community/thread/${s.thread_id}`),
        read: () => base44.entities.ForumSubscription.update(s.id, { unread_count: 0, last_read_date: new Date().toISOString() }).then(() => subsQ.refetch()),
      });
    });
    (postsQ.data || []).forEach((p) => {
      const mentions = parseJSON(p.mentions, []);
      if (Array.isArray(mentions) && user?.id && mentions.includes(user.id)) {
        list.push({
          key: "mention-" + p.id, type: "mentions", unread: false,
          title: `${p.author_name || "Someone"} mentioned you`,
          body: (p.body || "").slice(0, 120),
          time: p.created_date,
          open: () => navigate(`/community/thread/${p.thread_id}`),
        });
      }
    });
    (partsQ.data || []).filter((p) => (p.unread_count || 0) > 0).forEach((p) => {
      const c = convById[p.conversation_id];
      list.push({
        key: "dm-" + p.id, type: "messages", unread: true,
        title: c?.title || p.user_name || "Direct message",
        body: c?.last_message_preview ? `${c.last_message_sender_name || ""}: ${c.last_message_preview}` : `${p.unread_count} new message${p.unread_count === 1 ? "" : "s"}`,
        time: c?.last_message_at || p.updated_date,
        open: () => navigate("/messages"),
        read: () => base44.entities.ConversationParticipant.update(p.id, { unread_count: 0, last_read_at: new Date().toISOString() }).then(() => partsQ.refetch()),
      });
    });
    (alertsQ.data || []).forEach((a) => {
      list.push({
        key: "alert-" + a.id, type: "alerts", unread: true,
        title: a.title,
        body: a.message || a.community_name || "Alert",
        time: a.created_date,
        open: () => { base44.entities.Alert.update(a.id, { is_read: true }).then(() => alertsQ.refetch()); if (a.link) navigate(a.link); else navigate("/alerts"); },
        read: () => base44.entities.Alert.update(a.id, { is_read: true }).then(() => alertsQ.refetch()),
      });
    });
    const now = Date.now();
    (eventsQ.data || []).forEach((e) => {
      const t = new Date(e.event_time).getTime();
      if (t >= now && t - now < 7 * 86400000) {
        list.push({
          key: "event-" + e.id, type: "events", unread: false,
          title: `Upcoming: ${e.title}`,
          body: [e.location, new Date(e.event_time).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric" })].filter(Boolean).join(" · "),
          time: e.event_time,
          open: () => navigate("/events"),
        });
      }
    });
    (achQ.data || []).slice(0, 5).forEach((a) => {
      list.push({
        key: "ach-" + a.id, type: "achievements", unread: false,
        title: `Achievement unlocked: ${a.achievement_name || a.achievement_id}`,
        body: a.rarity ? a.rarity.charAt(0).toUpperCase() + a.rarity.slice(1) + " badge" : "New badge",
        time: a.unlocked_date,
        open: () => navigate("/achievements"),
      });
    });
    return list.sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subsQ.data, postsQ.data, partsQ.data, alertsQ.data, eventsQ.data, achQ.data, convById, user?.id, navigate]);

  const filtered = filter === "all" ? items : items.filter((i) => i.type === filter);
  const unreadCount = items.filter((i) => i.unread).length;

  const markAllRead = async () => {
    await Promise.allSettled(items.filter((i) => i.unread && i.read).map((i) => i.read()));
    queryClient.invalidateQueries();
  };

  const meta = (t) => FILTERS.find((f) => f.id === t);

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="text-primary p-1 -ml-1"><ArrowLeft className="w-5 h-5" /></button>
            <h1 className="text-base font-bold text-foreground">Notifications</h1>
            {unreadCount > 0 && <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="flex items-center gap-1 text-xs text-primary hover:underline">
              <CheckCheck className="w-3.5 h-3.5" /> Mark all read
            </button>
          )}
        </div>
        <div className="flex gap-1.5 px-4 pb-2 overflow-x-auto scrollbar-hide">
          {FILTERS.map(({ id, label, icon: Icon }) => {
            const count = id === "all" ? items.length : items.filter((i) => i.type === id && i.unread).length;
            return (
              <button key={id} onClick={() => setFilter(id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${filter === id ? "bg-primary/15 text-primary border border-primary/30" : "text-muted-foreground border border-border/40"}`}>
                <Icon className="w-3.5 h-3.5" />{label}
                {count > 0 && <span className="text-[9px] bg-primary/20 text-primary px-1 rounded-full">{count}</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="py-3">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Inbox className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-sm text-muted-foreground">You're all caught up</p>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {filtered.map((n) => {
              const M = meta(n.type) || FILTERS[0];
              const Icon = M.icon;
              return (
                <div key={n.key} className={`flex items-start gap-3 px-4 py-3 fade-in ${n.unread ? "bg-primary/[0.04]" : ""}`}>
                  <button onClick={n.open} className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <button onClick={n.open} className="text-left w-full">
                      <p className="text-sm font-medium text-foreground line-clamp-1">{n.title}</p>
                      {n.body && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.body}</p>}
                      {n.time && <p className="text-[10px] text-muted-foreground/70 mt-1">{timeAgo(n.time)}</p>}
                    </button>
                  </div>
                  {n.unread && <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />}
                  {n.read && (
                    <button onClick={n.read} title="Mark read" className="p-1.5 text-muted-foreground hover:text-primary shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}