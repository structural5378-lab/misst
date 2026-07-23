import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Mic, Phone, SkipForward, ArrowUp, ArrowDown, Trash2, Flag, Siren, Clock } from "lucide-react";

const PRI = {
  normal: { label: "Normal", cls: "text-slate-400" },
  priority: { label: "Priority", cls: "text-orange-400" },
  emergency: { label: "Emergency", cls: "text-rose-400" },
};

function waitMs(requested_at, now) {
  return requested_at ? now - new Date(requested_at).getTime() : 0;
}
function fmtWait(ms) {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${s % 60}s`;
}

export default function MissionQueue({ session, isOperator, user }) {
  const qc = useQueryClient();
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);

  const { data: queue = [] } = useQuery({
    queryKey: ["net-queue", session?.id],
    queryFn: () => base44.entities.NetQueueEntry.filter({ session_id: session.id }, "position", 200),
    enabled: !!session?.id,
  });

  const active = queue
    .filter((q) => q.status === "waiting" || q.status === "called")
    .sort((a, b) => (a.position || 0) - (b.position || 0) || new Date(a.requested_at) - new Date(b.requested_at));
  const uid = user?.uid || user?.id;
  const myEntry = active.find((q) => q.user_id && q.user_id === uid);

  const requestSpeak = async () => {
    await base44.entities.NetQueueEntry.create({
      session_id: session.id, net_id: session.net_id, user_id: uid || "",
      callsign: user?.callsign || user?.username || "Operator",
      name: user?.full_name || user?.username || "", avatar: user?.avatar || "", location: user?.location || "",
      priority: "normal", status: "waiting", requested_at: new Date().toISOString(), position: active.length + 1,
    });
    qc.invalidateQueries({ queryKey: ["net-queue", session.id] });
  };

  const update = async (id, patch) => {
    await base44.entities.NetQueueEntry.update(id, patch);
    qc.invalidateQueries({ queryKey: ["net-queue", session.id] });
  };
  const remove = (id) => update(id, { status: "removed" });

  const callNext = async () => {
    const next = active.find((q) => q.status === "waiting");
    if (!next) return;
    await base44.entities.NetQueueEntry.update(next.id, { status: "called", called_at: new Date().toISOString() });
    try {
      await base44.entities.NetTimeline.create({
        session_id: session.id, net_id: session.net_id, event_type: "note",
        message: `Called ${next.callsign} to speak`, actor_name: next.callsign, actor_avatar: next.avatar, actor_id: next.user_id,
      });
    } catch {}
    qc.invalidateQueries({ queryKey: ["net-queue", session.id] });
  };

  const move = async (q, dir) => {
    const idx = active.findIndex((x) => x.id === q.id);
    const swap = dir === "up" ? active[idx - 1] : active[idx + 1];
    if (!swap) return;
    await base44.entities.NetQueueEntry.bulkUpdate([
      { id: q.id, position: swap.position },
      { id: swap.id, position: q.position },
    ]);
    qc.invalidateQueries({ queryKey: ["net-queue", session.id] });
  };

  if (!isOperator) {
    return (
      <div className="space-y-3">
        {myEntry ? (
          <div className="rounded-2xl bg-violet-500/10 border border-violet-500/30 p-5 text-center">
            <p className="text-sm text-violet-200 font-semibold">You're in the queue</p>
            <p className="text-4xl font-extrabold text-foreground mt-1">#{active.findIndex((x) => x.id === myEntry.id) + 1}</p>
            <p className="text-xs text-muted-foreground mt-1">Waiting {fmtWait(waitMs(myEntry.requested_at, now))}</p>
            {myEntry.status === "called" && <p className="text-base font-bold text-emerald-400 mt-2 animate-pulse">🎙 You're up!</p>}
          </div>
        ) : (
          <button onClick={requestSpeak} className="w-full flex items-center justify-center gap-2 py-6 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-bold text-lg shadow-[0_0_28px_rgba(168,85,247,0.5)] active:scale-[0.98] transition">
            <Mic className="w-6 h-6" /> Request to Speak
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">{active.length} in queue</p>
        <button onClick={callNext} disabled={!active.some((q) => q.status === "waiting")} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold disabled:opacity-50">
          <Phone className="w-3.5 h-3.5" /> Call Next
        </button>
      </div>
      {active.length === 0 ? (
        <div className="rounded-2xl bg-card/60 border border-white/[0.06] p-8 text-center">
          <Mic className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No one in the queue.</p>
        </div>
      ) : (
        active.map((q, i) => (
          <div key={q.id} className={`rounded-2xl bg-card/60 border p-3 ${q.status === "called" ? "border-emerald-500/40 bg-emerald-500/[0.06]" : q.priority === "emergency" ? "border-rose-500/40" : q.priority === "priority" ? "border-orange-500/40" : "border-white/[0.06]"}`}>
            <div className="flex items-center gap-3">
              <span className="w-6 text-center text-sm font-bold text-primary">{i + 1}</span>
              {q.avatar ? <img src={q.avatar} className="w-8 h-8 rounded-full object-cover" /> : <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center text-xs font-bold text-violet-300">{(q.callsign || "?").charAt(0)}</div>}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-foreground truncate">{q.callsign} {q.name && <span className="text-muted-foreground font-normal">· {q.name}</span>}</p>
                <p className="text-xs text-muted-foreground">{q.location ? `${q.location} · ` : ""}<Clock className="w-2.5 h-2.5 inline -mt-0.5" /> {fmtWait(waitMs(q.requested_at, now))} {q.priority !== "normal" && <span className={PRI[q.priority].cls}>· {PRI[q.priority].label}</span>}</p>
              </div>
              {q.status === "called" && <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">CALLED</span>}
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <button onClick={() => update(q.id, { status: "called", called_at: new Date().toISOString() })} className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 text-[11px] font-semibold border border-emerald-500/20"><Phone className="w-3 h-3 inline" /> Call</button>
              <button onClick={() => update(q.id, { status: "skipped" })} className="px-2 py-1 rounded-lg bg-muted text-muted-foreground text-[11px] font-semibold border border-border"><SkipForward className="w-3 h-3 inline" /> Skip</button>
              <button onClick={() => move(q, "up")} className="px-2 py-1 rounded-lg bg-muted text-muted-foreground text-[11px] border border-border"><ArrowUp className="w-3 h-3" /></button>
              <button onClick={() => move(q, "down")} className="px-2 py-1 rounded-lg bg-muted text-muted-foreground text-[11px] border border-border"><ArrowDown className="w-3 h-3" /></button>
              <button onClick={() => update(q.id, { priority: "priority" })} className="px-2 py-1 rounded-lg bg-orange-500/10 text-orange-300 text-[11px] font-semibold border border-orange-500/20"><Flag className="w-3 h-3 inline" /> Priority</button>
              <button onClick={() => update(q.id, { priority: "emergency" })} className="px-2 py-1 rounded-lg bg-rose-500/10 text-rose-300 text-[11px] font-semibold border border-rose-500/20"><Siren className="w-3 h-3 inline" /> Emergency</button>
              <button onClick={() => remove(q.id)} className="px-2 py-1 rounded-lg bg-destructive/10 text-destructive text-[11px] border border-destructive/20"><Trash2 className="w-3 h-3" /></button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}