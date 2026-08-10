import React, { useEffect, useState } from "react";
import { Shield, Users, Ban, UserX, Megaphone, Lock, Trash2, AlertTriangle, Activity, Loader2, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { mist } from '@/api/mist';
// ModerationDashboard — community-scoped moderation overview for community
// admins. Aggregated server-side by getModerationStats. Shows counts + recent
// moderation activity with quick links to members, audit log, and chat rooms.
function Card({ icon: Icon, label, value, tone = "primary" }) {
  const tones = {
    primary: "bg-primary/10 text-primary",
    amber: "bg-amber-500/10 text-amber-500",
    red: "bg-destructive/10 text-destructive",
    violet: "bg-violet-500/10 text-violet-500",
    cyan: "bg-cyan-500/10 text-cyan-500",
  };
  return (
    <div className="rounded-xl border border-border bg-card/40 p-3 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${tones[tone]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xl font-bold leading-none">{value ?? 0}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{label}</p>
      </div>
    </div>
  );
}

function List({ title, icon: Icon, items, empty = "Nothing yet" }) {
  return (
    <div className="rounded-xl border border-border bg-card/30">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-xs font-semibold text-foreground">{title}</h3>
      </div>
      <div className="p-2 space-y-1 max-h-56 overflow-y-auto">
        {(!items || items.length === 0) ? (
          <p className="text-[11px] text-muted-foreground text-center py-3">{empty}</p>
        ) : items.slice(0, 15).map((it, i) => (
          <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted/40">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-foreground truncate">
                {it.target_user_name || it.room_name || it.admin_name || "—"}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                {it.action} {it.reason ? `· ${it.reason}` : ""}
              </p>
            </div>
            <span className="text-[10px] text-muted-foreground shrink-0">
              {it.created_date ? new Date(it.created_date).toLocaleDateString() : ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ModerationDashboard({ community }) {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await mist.functions.invoke("getModerationStats", { community_id: community.id });
        if (active) setData(res?.data || res || null);
      } catch { /* ignore */ }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [community.id]);

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  const c = data?.counts || {};

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
        <Card icon={AlertTriangle} label="Pending Reports" value={c.pendingReports} tone="amber" />
        <Card icon={Users} label="Muted Members" value={c.muted} tone="amber" />
        <Card icon={UserX} label="Suspended" value={c.suspended} tone="red" />
        <Card icon={Trash2} label="Deleted Messages" value={c.deletedMessages} tone="red" />
        <Card icon={Megaphone} label="Announcements (recent)" value={data?.recentAnnouncements?.length || 0} tone="violet" />
        <Card icon={Activity} label="Total Actions" value={c.totalActions} tone="cyan" />
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => navigate(`/c/${community.slug}/members`)} className="text-xs font-medium px-3 py-1.5 rounded-lg bg-primary/15 text-primary flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" /> Members <ChevronRight className="w-3 h-3" />
        </button>
        <button onClick={() => navigate(`/c/${community.slug}/admin`)} className="text-xs font-medium px-3 py-1.5 rounded-lg bg-secondary/60 text-secondary-foreground flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5" /> Audit Log <ChevronRight className="w-3 h-3" />
        </button>
        <button onClick={() => navigate(`/chat-v2/c/${community.slug}`)} className="text-xs font-medium px-3 py-1.5 rounded-lg bg-secondary/60 text-secondary-foreground flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5" /> Chat Rooms <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <List title="Recent Moderation Actions" icon={Activity} items={data?.recentActions} />
        <List title="Recent Bans" icon={Ban} items={data?.recentBans} />
        <List title="Recent Kicks" icon={UserX} items={data?.recentKicks} />
        <List title="Recent Announcements" icon={Megaphone} items={data?.recentAnnouncements} />
        <List title="Recent Room Locks / Clears" icon={Lock} items={data?.recentRoomLocks} />
        <List title="Recent Deleted Messages" icon={Trash2} items={data?.recentDeleted} />
      </div>
    </div>
  );
}