import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Mic, Activity, MapPin } from "lucide-react";
import MissionMap from "@/components/mission/MissionMap";
import { TIMELINE_ICONS } from "@/components/mission/helpers";

function fmtDur(ms) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h ? h + ":" : ""}${h ? String(m).padStart(2, "0") : m}:${String(sec).padStart(2, "0")}`;
}

export default function MissionDisplay() {
  const { netId } = useParams();
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);

  const { data: net } = useQuery({ queryKey: ["net", netId], queryFn: () => base44.entities.Net.filter({ id: netId }), select: (d) => d[0], enabled: !!netId });
  const { data: sessions = [] } = useQuery({ queryKey: ["net-sessions", netId], queryFn: () => base44.entities.NetSession.filter({ net_id: netId }, "-started_at", 20), enabled: !!netId, refetchInterval: 4000 });
  const session = sessions.find((s) => s.status === "active" || s.status === "paused");
  const sid = session?.id;
  const { data: checkins = [] } = useQuery({ queryKey: ["net-log", sid], queryFn: () => base44.entities.NetLog.filter({ session_id: sid }, "checkin_number", 500), enabled: !!sid, refetchInterval: 4000 });
  const { data: queue = [] } = useQuery({ queryKey: ["net-queue", sid], queryFn: () => base44.entities.NetQueueEntry.filter({ session_id: sid }, "position", 200), enabled: !!sid, refetchInterval: 4000 });
  const { data: incidents = [] } = useQuery({ queryKey: ["net-incidents", sid], queryFn: () => base44.entities.NetIncident.filter({ session_id: sid }, "-timestamp", 30), enabled: !!sid, refetchInterval: 4000 });
  const { data: timeline = [] } = useQuery({ queryKey: ["net-timeline", sid], queryFn: () => base44.entities.NetTimeline.filter({ session_id: sid }, "-created_date", 30), enabled: !!sid, refetchInterval: 4000 });
  const { data: repeater } = useQuery({ queryKey: ["net-repeater", net?.repeater_callsign], queryFn: () => base44.entities.Repeater.filter({ callsign: net.repeater_callsign }), select: (d) => d[0], enabled: !!net?.repeater_callsign });

  const approved = checkins.filter((c) => c.approved !== false);
  const attendance = approved.length;
  const visitors = approved.filter((c) => c.status === "visitor").length;
  const priority = approved.filter((c) => c.status === "priority").length;
  const emergency = approved.filter((c) => c.status === "emergency").length;
  const activeQueue = queue.filter((q) => q.status === "waiting" || q.status === "called").sort((a, b) => (a.position || 0) - (b.position || 0));

  const durMs = session?.started_at ? (session.status === "closed" && session.ended_at ? new Date(session.ended_at) - new Date(session.started_at) : now - new Date(session.started_at) - (session.paused_total || 0)) : 0;

  const statusBadge = session ? (session.status === "active" ? { label: "LIVE", cls: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40", pulse: true } : { label: "PAUSED", cls: "bg-amber-500/20 text-amber-300 border-amber-500/40", pulse: false }) : { label: "STANDBY", cls: "bg-slate-500/20 text-slate-300 border-slate-500/40", pulse: false };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 lg:p-6 overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Link to={`/nets/${netId}/control`} className="p-2 rounded-lg bg-card/60 border border-white/[0.06] text-muted-foreground hover:text-foreground"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-xl lg:text-2xl font-extrabold tracking-tight">{net?.name || "Mission Control"}</h1>
            <p className="text-xs text-muted-foreground">{session?.community_name || net?.community_name || ""} {session?.net_control ? `· NC: ${session.net_control}` : ""}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className={`px-4 py-2 rounded-xl border text-sm font-extrabold tracking-widest ${statusBadge.cls} ${statusBadge.pulse ? "animate-pulse" : ""}`}>{statusBadge.label}</div>
          <div className="text-right">
            <p className="text-3xl lg:text-4xl font-extrabold tabular-nums tracking-tight">{now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</p>
            <p className="text-xs text-muted-foreground">{now.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })}</p>
          </div>
        </div>
      </div>

      {/* Big timer + stats */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-4">
        <div className="lg:col-span-2 rounded-2xl bg-gradient-to-br from-violet-500/15 to-fuchsia-500/5 border border-violet-500/20 p-5 flex flex-col justify-center">
          <p className="text-xs uppercase tracking-widest text-violet-300/80 font-bold">Net Timer</p>
          <p className="text-4xl lg:text-5xl font-extrabold tabular-nums mt-1">{fmtDur(durMs)}</p>
        </div>
        <Stat label="Attendance" value={attendance} color="text-violet-300" />
        <Stat label="Visitors" value={visitors} color="text-fuchsia-300" />
        <Stat label="Priority" value={priority} color="text-orange-300" />
        <Stat label="Emergency" value={emergency} color="text-rose-300" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Queue */}
        <div className="rounded-2xl bg-card/60 border border-white/[0.06] p-4">
          <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2"><Mic className="w-4 h-4 text-primary" /> Live Queue</h2>
          {activeQueue.length === 0 ? <p className="text-sm text-muted-foreground">Queue is empty.</p> : (
            <div className="space-y-2">
              {activeQueue.slice(0, 6).map((q, i) => (
                <div key={q.id} className={`flex items-center gap-3 p-2.5 rounded-xl border ${q.status === "called" ? "border-emerald-500/40 bg-emerald-500/[0.06]" : q.priority === "emergency" ? "border-rose-500/40" : q.priority === "priority" ? "border-orange-500/40" : "border-white/[0.06]"}`}>
                  <span className="w-6 text-center text-lg font-extrabold text-primary">{i + 1}</span>
                  {q.avatar ? <img src={q.avatar} className="w-9 h-9 rounded-full object-cover" /> : <div className="w-9 h-9 rounded-full bg-violet-500/20 flex items-center justify-center font-bold text-violet-300">{(q.callsign || "?").charAt(0)}</div>}
                  <div className="min-w-0 flex-1">
                    <p className="font-bold truncate">{q.callsign}</p>
                    {q.location && <p className="text-xs text-muted-foreground truncate">{q.location}</p>}
                  </div>
                  {q.status === "called" && <span className="text-xs font-bold text-emerald-400 animate-pulse">UP</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Incidents */}
        <div className="rounded-2xl bg-card/60 border border-white/[0.06] p-4">
          <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2"><Activity className="w-4 h-4 text-rose-400" /> Incident Log</h2>
          {incidents.length === 0 ? <p className="text-sm text-muted-foreground">No incidents.</p> : (
            <div className="space-y-2">
              {incidents.slice(0, 6).map((inc) => (
                <div key={inc.id} className={`p-2.5 rounded-xl border-l-4 ${inc.severity === "critical" ? "border-l-rose-500" : inc.severity === "warning" ? "border-l-amber-500" : "border-l-slate-500"} bg-background/40`}>
                  <p className="text-xs font-bold capitalize">{inc.category?.replace("_", " ")}</p>
                  <p className="text-sm truncate">{inc.notes}</p>
                  <p className="text-[10px] text-muted-foreground">{inc.timestamp ? new Date(inc.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""} · {inc.operator || ""}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className="rounded-2xl bg-card/60 border border-white/[0.06] p-4">
          <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2"><Activity className="w-4 h-4 text-primary" /> Recent Activity</h2>
          {timeline.length === 0 ? <p className="text-sm text-muted-foreground">No activity yet.</p> : (
            <div className="space-y-2">
              {timeline.slice(0, 8).map((e) => {
                const ti = TIMELINE_ICONS[e.event_type] || TIMELINE_ICONS.note;
                return (
                  <div key={e.id} className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-lg ${ti.bg} flex items-center justify-center shrink-0`}><ti.Icon className={`w-3.5 h-3.5 ${ti.color}`} /></div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm truncate">{e.message}</p>
                      <p className="text-[10px] text-muted-foreground">{e.created_date ? new Date(e.created_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Map */}
      <div className="mt-3 rounded-2xl overflow-hidden border border-white/[0.06]">
        <div className="p-3 bg-card/60 border-b border-white/[0.06] flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold text-foreground">Live Map</h2>
          <span className="text-xs text-muted-foreground ml-auto">{repeater?.callsign || net?.repeater_callsign || "No repeater"} {repeater?.location ? `· ${repeater.location}` : ""}</span>
        </div>
        <MissionMap checkins={approved} repeater={repeater} netControlUid={session?.net_control_uid} />
      </div>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div className="rounded-2xl bg-card/60 border border-white/[0.06] p-4 flex flex-col justify-center">
      <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold">{label}</p>
      <p className={`text-3xl lg:text-4xl font-extrabold mt-1 ${color}`}>{value}</p>
    </div>
  );
}