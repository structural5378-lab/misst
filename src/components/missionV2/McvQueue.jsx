import React from "react";
import { Phone } from "lucide-react";
import McvSignalIcon from "./McvSignalIcon";
import { fmtWait } from "./runtime";

// McvQueue — "Waiting to Transmit" panel (left column bottom). Numbered list of
// queued stations with wait time + signal, estimated wait, and Next Station.
export default function McvQueue({ v2 }) {
  const { activeQueue, isOperator, now, callNext, callEntry } = v2;
  const waiting = activeQueue;
  const estWait = waiting.length * 12;
  return (
    <div className="rounded-xl bg-[#15191e] border border-white/[0.06] p-3">
      <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">Waiting to Transmit ({waiting.length})</h3>
      {waiting.length === 0 ? <p className="text-xs text-muted-foreground py-3 text-center">Queue is empty.</p> : (
        <div className="space-y-1.5">
          {waiting.map((q, i) => (
            <div key={q.id} className={`flex items-center gap-2 p-2 rounded-lg ${q.status === "called" ? "bg-emerald-500/10 ring-1 ring-emerald-500/30" : "bg-white/[0.03]"}`}>
              <span className="w-5 text-center text-xs font-bold text-violet-300">{i + 1}</span>
              {q.avatar ? <img src={q.avatar} className="w-6 h-6 rounded-full object-cover" /> : <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center text-[10px] font-bold text-violet-300">{(q.callsign || "?").charAt(0)}</div>}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold truncate">{q.callsign}</p>
                <p className="text-[10px] text-muted-foreground">{fmtWait(q.requested_at ? now - new Date(q.requested_at).getTime() : 0)}{q.priority !== "normal" ? ` · ${q.priority}` : ""}</p>
              </div>
              <McvSignalIcon report={q.priority === "emergency" ? "5" : "4"} />
              {isOperator && q.status !== "called" && <button onClick={() => callEntry(q)} className="text-[10px] text-emerald-400 font-semibold">Call</button>}
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/[0.06]">
        <span className="text-[10px] text-muted-foreground">Estimated wait: {estWait}s</span>
        {isOperator && <button onClick={callNext} disabled={!waiting.some((q) => q.status === "waiting")} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-violet-500/20 text-violet-200 border border-violet-500/30 text-[11px] font-bold disabled:opacity-40"><Phone className="w-3 h-3" /> Next Station</button>}
      </div>
    </div>
  );
}