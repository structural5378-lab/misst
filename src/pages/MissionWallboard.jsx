import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useMissionControl } from "@/hooks/useMissionControl";
import MissionMap from "@/components/mission/MissionMap";
import { ArrowLeft, MapPin, Siren, Mic, CloudRain, CalendarClock, QrCode } from "lucide-react";

function fmtDur(ms) {
  if (!ms || ms < 0) return "0:00";
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h ? h + ":" : ""}${h ? String(m).padStart(2, "0") : m}:${String(s % 60).padStart(2, "0")}`;
}

export default function MissionWallboard() {
  const { netId } = useParams();
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);

  const mc = useMissionControl(netId);
  const { net, activeSession, approved, activeQueue, incidents, repeater, timeline } = mc;

  const { data: weather } = useQuery({
    queryKey: ["wallboard-weather"],
    queryFn: async () => { const r = await base44.functions.invoke("getWeatherData", {}); return r.data; },
    staleTime: 15 * 60 * 1000,
  });
  const { data: nets = [] } = useQuery({
    queryKey: ["wallboard-nets"],
    queryFn: () => base44.entities.Net.list("-created_date", 50),
    staleTime: 60 * 1000,
  });
  const upcoming = nets.filter((n) => n.schedule || n.time).slice(0, 5);

  const critical = incidents.filter((i) => i.severity === "critical");
  const currentSpeaker = activeQueue.find((q) => q.status === "called") || activeQueue[0];
  const pending = (mc.checkins || []).filter((c) => c.approved === false).length;
  const durMs = activeSession?.started_at ? (activeSession.status === "closed" && activeSession.ended_at ? new Date(activeSession.ended_at) - new Date(activeSession.started_at) : now - new Date(activeSession.started_at) - (activeSession.paused_total || 0)) : 0;
  const statusBadge = activeSession ? (activeSession.status === "active" ? { label: "LIVE", cls: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40", pulse: true } : { label: "PAUSED", cls: "bg-amber-500/20 text-amber-300 border-amber-500/40", pulse: false }) : { label: "STANDBY", cls: "bg-slate-500/20 text-slate-300 border-slate-500/40", pulse: false };
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(`${window.location.origin}/nets/${netId}/control`)}`;

  return (
    <div className="min-h-screen bg-background text-foreground p-4 lg:p-6 overflow-hidden">
      {/* Emergency banner */}
      {critical.length > 0 && (
        <div className="mb-4 rounded-2xl bg-rose-500/15 border-2 border-rose-500/50 p-4 flex items-center gap-3 animate-pulse">
          <Siren className="w-7 h-7 text-rose-400 shrink-0" />
          <div className="min-w-0">
            <p className="text-lg font-extrabold text-rose-300 uppercase tracking-wide">Emergency Traffic</p>
            <p className="text-sm text-rose-200/90 truncate">{critical[0].notes} — {critical[0].operator} · {critical[0].timestamp ? new Date(critical[0].timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4 gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link to={`/nets/${netId}/ops`} className="p-2 rounded-xl bg-card/60 border border-white/[0.06] text-muted-foreground hover:text-foreground"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="min-w-0">
            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight truncate">{net?.name || "Mission Control"}</h1>
            <p className="text-sm text-muted-foreground truncate">{activeSession?.community_name || net?.community_name || ""} {activeSession?.net_control ? `· Net Control: ${activeSession.net_control}` : ""} {repeater?.callsign || net?.repeater_callsign ? `· ${repeater?.callsign || net.repeater_callsign}` : ""}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className={`px-4 py-2 rounded-xl border text-base font-extrabold tracking-widest ${statusBadge.cls} ${statusBadge.pulse ? "animate-pulse" : ""}`}>{statusBadge.label}</div>
          <div className="text-right">
            <p className="text-4xl lg:text-6xl font-extrabold tabular-nums tracking-tight leading-none">{now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</p>
            <p className="text-sm text-muted-foreground">{now.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })}</p>
          </div>
        </div>
      </div>

      {/* Top stat row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
        <Big label="Net Timer" value={fmtDur(durMs)} color="text-violet-300" wide />
        <Big label="Operators" value={approved.length} color="text-cyan-300" />
        <Big label="Pending" value={pending} color="text-amber-300" />
        <Big label="Priority" value={mc.metrics.priority} color="text-orange-300" />
        <Big label="Emergency" value={mc.metrics.emergency} color="text-rose-300" />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        {/* Current speaker + queue */}
        <div className="rounded-2xl bg-card/60 border border-white/[0.06] p-4 flex flex-col">
          <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2"><Mic className="w-4 h-4 text-primary" /> Current Speaker</h2>
          {currentSpeaker ? (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-violet-500/10 border border-violet-500/30">
              {currentSpeaker.avatar ? <img src={currentSpeaker.avatar} className="w-12 h-12 rounded-full object-cover" /> : <div className="w-12 h-12 rounded-full bg-violet-500/20 flex items-center justify-center text-xl font-bold text-violet-300">{(currentSpeaker.callsign || "?").charAt(0)}</div>}
              <div className="min-w-0">
                <p className="text-lg font-extrabold truncate">{currentSpeaker.callsign}</p>
                {currentSpeaker.location && <p className="text-xs text-muted-foreground truncate">{currentSpeaker.location}</p>}
              </div>
            </div>
          ) : <p className="text-sm text-muted-foreground">No speaker queued.</p>}
          <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mt-4 mb-2">Queue ({activeQueue.length})</h3>
          <div className="space-y-1.5 overflow-y-auto">
            {activeQueue.slice(0, 6).map((q, i) => (
              <div key={q.id} className="flex items-center gap-2 text-sm">
                <span className="w-5 text-center font-bold text-primary">{i + 1}</span>
                <span className="truncate font-semibold">{q.callsign}</span>
                {q.priority === "emergency" && <Siren className="w-3.5 h-3.5 text-rose-400 ml-auto" />}
              </div>
            ))}
            {activeQueue.length === 0 && <p className="text-xs text-muted-foreground">Empty.</p>}
          </div>
        </div>

        {/* Map */}
        <div className="lg:col-span-2 rounded-2xl overflow-hidden border border-white/[0.06] flex flex-col">
          <div className="p-3 bg-card/60 border-b border-white/[0.06] flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground">Live Map</h2>
          </div>
          <div className="flex-1 min-h-[260px]"><MissionMap checkins={approved} repeater={repeater} netControlUid={activeSession?.net_control_uid} /></div>
        </div>

        {/* QR + check-in */}
        <div className="rounded-2xl bg-card/60 border border-white/[0.06] p-4 flex flex-col items-center justify-center text-center">
          <h2 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2"><QrCode className="w-4 h-4 text-primary" /> Check In</h2>
          <img src={qr} alt="QR code to join net" className="w-40 h-40 rounded-xl bg-white p-2" />
          <p className="text-xs text-muted-foreground mt-2">Scan to join &amp; check in</p>
        </div>
      </div>

      {/* Bottom row: weather + upcoming + activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mt-3">
        <div className="rounded-2xl bg-card/60 border border-white/[0.06] p-4">
          <h2 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2"><CloudRain className="w-4 h-4 text-cyan-400" /> Weather</h2>
          {weather?.current ? (
            <div className="flex items-center gap-3">
              <span className="text-4xl font-extrabold">{Math.round(weather.current.temp)}°</span>
              <div>
                <p className="text-sm font-semibold capitalize">{weather.current.condition || weather.current.description || "—"}</p>
                <p className="text-xs text-muted-foreground">{weather.location || activeSession?.community_name || ""}</p>
              </div>
            </div>
          ) : <p className="text-sm text-muted-foreground">No weather data.</p>}
        </div>
        <div className="rounded-2xl bg-card/60 border border-white/[0.06] p-4">
          <h2 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2"><CalendarClock className="w-4 h-4 text-primary" /> Upcoming Nets</h2>
          <div className="space-y-1.5">
            {upcoming.length === 0 ? <p className="text-sm text-muted-foreground">None scheduled.</p> : upcoming.map((n) => (
              <div key={n.id} className="flex items-center justify-between text-sm">
                <span className="truncate font-semibold">{n.name}</span>
                <span className="text-xs text-muted-foreground shrink-0 ml-2">{n.schedule}{n.day_of_week ? ` ${n.day_of_week}` : ""} {n.time || ""}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl bg-card/60 border border-white/[0.06] p-4">
          <h2 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2"><Siren className="w-4 h-4 text-rose-400" /> Recent Incidents</h2>
          <div className="space-y-1.5">
            {incidents.length === 0 ? <p className="text-sm text-muted-foreground">No incidents.</p> : incidents.slice(0, 5).map((inc) => (
              <div key={inc.id} className={`p-2 rounded-lg border-l-4 ${inc.severity === "critical" ? "border-l-rose-500" : inc.severity === "warning" ? "border-l-amber-500" : "border-l-slate-500"}`}>
                <p className="text-xs font-bold capitalize">{inc.category?.replace("_", " ")}</p>
                <p className="text-sm truncate">{inc.notes}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Big({ label, value, color, wide }) {
  return (
    <div className={`rounded-2xl bg-card/60 border border-white/[0.06] p-4 flex flex-col justify-center ${wide ? "lg:col-span-1" : ""}`}>
      <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold">{label}</p>
      <p className={`text-3xl lg:text-4xl font-extrabold tabular-nums mt-1 ${color}`}>{value}</p>
    </div>
  );
}