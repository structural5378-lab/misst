import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Pause, Play, Square, FileText, ListChecks, Megaphone, Loader2 } from "lucide-react";

// ActiveNetCard — large status card for a currently-running net. Shows live
// elapsed time, participants/visitors/emergency/priority, net control + assistant,
// and control buttons (Pause/Resume, End, Open Log, View Check-ins, Broadcast).
export default function ActiveNetCard({ session, net, onChanged }) {
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState("");
  const [broadcast, setBroadcast] = useState("");
  const [showBc, setShowBc] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const { data: checkins = [] } = useQuery({
    queryKey: ["net-log", session.id],
    queryFn: () => base44.entities.NetLog.filter({ session_id: session.id }, "checkin_number", 500),
    refetchInterval: 8000,
  });
  const approved = (checkins || []).filter((c) => c.approved !== false);
  const participants = approved.length;
  const visitors = approved.filter((c) => c.status === "visitor").length;
  const emergency = approved.filter((c) => c.status === "emergency").length;
  const priority = approved.filter((c) => c.status === "priority").length;

  const elapsedMs = now - new Date(session.started_at).getTime() - (session.paused_total || 0) - (session.status === "paused" && session.paused_at ? now - new Date(session.paused_at).getTime() : 0);
  const elapsed = formatElapsed(Math.max(0, elapsedMs));
  const paused = session.status === "paused";

  const run = async (action, extra = {}) => {
    setBusy(action);
    try {
      await base44.functions.invoke("manageNet", { action, session_id: session.id, ...extra });
      onChanged?.();
    } catch (e) { console.error(e); }
    setBusy("");
  };

  const sendBroadcast = async () => {
    if (!broadcast.trim()) return;
    await run("broadcast", { message: broadcast.trim() });
    setBroadcast(""); setShowBc(false);
  };

  return (
    <div className={`rounded-2xl border p-4 ${paused ? "bg-amber-500/5 border-amber-500/30" : "bg-emerald-500/5 border-emerald-500/30"}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-foreground">{net?.name || session.net_name}</h3>
          <p className="text-xs text-muted-foreground">{net?.community_name || session.community_name || ""}</p>
        </div>
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase ${paused ? "bg-amber-500/15 text-amber-400" : "bg-emerald-500/15 text-emerald-400"}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${paused ? "bg-amber-400" : "bg-emerald-400 animate-pulse"}`} /> {paused ? "Paused" : "Live"}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-3">
        <Metric label="Elapsed" value={elapsed} />
        <Metric label="Participants" value={participants} />
        <Metric label="Visitors" value={visitors} />
        <Metric label="Emergency" value={emergency} accent={emergency > 0 ? "text-rose-400" : ""} />
        <Metric label="Priority" value={priority} accent={priority > 0 ? "text-amber-400" : ""} />
        <Metric label="Net Control" value={session.net_control || "—"} />
      </div>
      {session.co_host && <p className="text-[11px] text-muted-foreground mt-2">Assistant Net Control: {session.co_host}</p>}

      <div className="flex flex-wrap gap-2 mt-3">
        <button onClick={() => run(paused ? "resume" : "pause")} disabled={!!busy} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold active:scale-95 disabled:opacity-50 ${paused ? "bg-emerald-500 text-white" : "bg-amber-500/20 text-amber-300"}`}>
          {busy === (paused ? "resume" : "pause") ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />} {paused ? "Resume" : "Pause"}
        </button>
        <button onClick={() => run("end")} disabled={!!busy} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/20 text-rose-300 text-xs font-semibold active:scale-95">
          {busy === "end" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Square className="w-3.5 h-3.5" />} End Net
        </button>
        <Link to={`/nets/${session.net_id}/control`} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary text-secondary-foreground text-xs font-semibold active:scale-95">
          <FileText className="w-3.5 h-3.5" /> Open Log
        </Link>
        <Link to={`/nets/${session.net_id}/control`} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary text-secondary-foreground text-xs font-semibold active:scale-95">
          <ListChecks className="w-3.5 h-3.5" /> Check-ins
        </Link>
        <button onClick={() => setShowBc((v) => !v)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-violet-500/20 text-violet-200 text-xs font-semibold active:scale-95">
          <Megaphone className="w-3.5 h-3.5" /> Broadcast
        </button>
      </div>

      {showBc && (
        <div className="mt-3 flex gap-2">
          <input value={broadcast} onChange={(e) => setBroadcast(e.target.value)} placeholder="Announcement to log…" className="flex-1 px-3 py-2 rounded-xl bg-background border border-border text-sm" />
          <button onClick={sendBroadcast} disabled={!!busy || !broadcast.trim()} className="px-3 py-2 rounded-xl bg-violet-500 text-white text-xs font-semibold disabled:opacity-50">Send</button>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, accent }) {
  return (
    <div className="rounded-lg bg-background/40 p-2 text-center">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className={`text-sm font-bold ${accent || "text-foreground"} truncate`}>{value}</p>
    </div>
  );
}

function formatElapsed(ms) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}` : `${m}:${String(sec).padStart(2, "0")}`;
}