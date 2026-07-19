import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  MessageSquare, Reply, Users, Pin, Flame, Activity, ChevronDown,
} from "lucide-react";

function Widget({ id, title, icon: Icon, collapsed, onToggle, children }) {
  return (
    <div className="rounded-xl border border-border bg-card/60 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-secondary/40 transition-colors"
      >
        <Icon className="w-4 h-4 text-primary shrink-0" />
        <span className="text-xs font-bold uppercase tracking-wide text-foreground flex-1 text-left">
          {title}
        </span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${collapsed ? "-rotate-90" : ""}`} />
      </button>
      {!collapsed && <div className="px-3 pb-3 pt-1">{children}</div>}
    </div>
  );
}

export function StatsWidget({ collapsed, onToggle }) {
  const { data: threads = [] } = useQuery({
    queryKey: ["forum-threads"],
    queryFn: () => base44.entities.ForumThread.filter({ is_deleted: false }, "-last_reply_date", 100),
    staleTime: 30000,
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["forum-categories"],
    queryFn: () => base44.entities.ForumCategory.list("sort_order", 50),
    staleTime: 60000,
  });
  const { data: online = [] } = useQuery({
    queryKey: ["presence-online"],
    queryFn: () => base44.entities.UserPresence.filter({ status: "online" }),
    staleTime: 15000,
  });
  const posts = threads.reduce((s, t) => s + (t.reply_count || 0), 0);
  const stats = [
    { label: "Discussions", value: threads.length, icon: MessageSquare },
    { label: "Replies", value: posts, icon: Reply },
    { label: "Categories", value: categories.length, icon: Activity },
    { label: "Online", value: online.length, icon: Users },
  ];
  return (
    <Widget id="stats" title="Community Statistics" icon={Activity} collapsed={collapsed} onToggle={onToggle}>
      <div className="grid grid-cols-2 gap-2">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg bg-secondary/40 border border-border/50 px-2.5 py-2">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <s.icon className="w-3 h-3" />
              <span className="text-[10px] uppercase tracking-wide">{s.label}</span>
            </div>
            <p className="text-lg font-bold text-foreground leading-tight">{s.value}</p>
          </div>
        ))}
      </div>
    </Widget>
  );
}

export function OnlineWidget({ collapsed, onToggle }) {
  const { data: online = [] } = useQuery({
    queryKey: ["presence-online"],
    queryFn: () => base44.entities.UserPresence.filter({ status: "online" }),
    staleTime: 15000,
  });
  return (
    <Widget id="online" title="Who's Online" icon={Users} collapsed={collapsed} onToggle={onToggle}>
      {online.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">No members online.</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {online.slice(0, 24).map((u) => (
            <div key={u.id} className="relative" title={u.user_name}>
              <div className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center text-[11px] font-bold border border-primary/20">
                {(u.user_name || "?").charAt(0)}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-card" />
            </div>
          ))}
        </div>
      )}
      {online.length > 24 && <p className="text-[10px] text-muted-foreground mt-2">+{online.length - 24} more</p>}
    </Widget>
  );
}

export function TrendingWidget({ collapsed, onToggle }) {
  const { data: threads = [] } = useQuery({
    queryKey: ["forum-threads"],
    queryFn: () => base44.entities.ForumThread.filter({ is_deleted: false }, "-last_reply_date", 50),
    staleTime: 30000,
  });
  const trending = [...threads]
    .sort((a, b) => (b.reply_count || 0) * 3 + (b.view_count || 0) - ((a.reply_count || 0) * 3 + (a.view_count || 0)))
    .slice(0, 5);
  return (
    <Widget id="trending" title="Trending Discussions" icon={Flame} collapsed={collapsed} onToggle={onToggle}>
      <div className="space-y-1.5">
        {trending.length === 0 && <p className="text-xs text-muted-foreground py-1">No discussions yet.</p>}
        {trending.map((t) => (
          <Link
            key={t.id}
            to={`/community/thread/${t.id}`}
            className="block rounded-lg px-2 py-1.5 hover:bg-secondary/40 transition-colors"
          >
            <p className="text-xs font-medium text-foreground line-clamp-2 leading-snug">{t.title}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {t.reply_count || 0} replies · {t.author_name || "Unknown"}
            </p>
          </Link>
        ))}
      </div>
    </Widget>
  );
}

export function PinnedWidget({ collapsed, onToggle }) {
  const { data: threads = [] } = useQuery({
    queryKey: ["forum-threads"],
    queryFn: () => base44.entities.ForumThread.filter({ is_announcement: true }, "-created_date", 10),
    staleTime: 60000,
  });
  const pinned = (threads || []).filter((t) => !t.is_deleted).slice(0, 3);
  if (pinned.length === 0) return null;
  return (
    <Widget id="pinned" title="Pinned Announcements" icon={Pin} collapsed={collapsed} onToggle={onToggle}>
      <div className="space-y-1.5">
        {pinned.map((t) => (
          <Link
            key={t.id}
            to={`/community/thread/${t.id}`}
            className="block rounded-lg px-2 py-1.5 border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 transition-colors"
          >
            <p className="text-xs font-medium text-foreground line-clamp-2 leading-snug">{t.title}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{t.author_name || "Staff"}</p>
          </Link>
        ))}
      </div>
    </Widget>
  );
}