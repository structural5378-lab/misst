import React from "react";
import { X, FileDown, Printer, Share2, Send, Radio } from "lucide-react";
import { format } from "date-fns";
import DurationTimer from "./DurationTimer";

export default function AfterActionReport({ session, checkins = [], timeline = [], onClose, onPostForum, posting }) {
  const approved = checkins.filter((c) => c.approved !== false);
  const visitors = approved.filter((c) => c.status === "visitor").length;
  const distances = approved.map((c) => c.distance).filter((d) => d != null);
  const longest = distances.length ? Math.max(...distances) : null;
  const start = session?.started_at ? new Date(session.started_at) : null;
  const end = session?.ended_at ? new Date(session.ended_at) : null;

  const exportCSV = () => {
    const rows = [["#", "Callsign", "Name", "Location", "Distance", "Status", "Signal", "Notes", "Time"]];
    approved.forEach((c) => {
      rows.push([
        c.checkin_number || "",
        c.callsign,
        c.name || "",
        c.location || "",
        c.distance || "",
        c.status || "",
        c.signal_report || "",
        (c.notes || "").replace(/"/g, "'"),
        c.checked_in_at || "",
      ]);
    });
    const csv = rows.map((r) => r.map((v) => `"${String(v)}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `net-log-${(session?.net_name || "net").replace(/\s+/g, "-").toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const share = async () => {
    const text = `Net Log: ${session?.net_name}\nDate: ${start ? format(start, "MMM d, yyyy") : ""}\nDuration: ${end && start ? Math.round((end - start) / 60000) : 0} mins\nOperators: ${approved.length}`;
    try {
      if (navigator.share) await navigator.share({ title: `Net Log — ${session?.net_name}`, text });
      else await navigator.clipboard?.writeText(text);
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-[85] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg bg-card border border-violet-500/20 rounded-t-3xl sm:rounded-3xl p-5 sheet-up max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-violet-400" />
            <h3 className="text-base font-bold text-foreground">After Action Report</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"><X className="w-5 h-5" /></button>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-violet-950/40 to-card border border-violet-500/20 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center font-black text-white text-lg">
              {(session?.net_name || "N").charAt(0)}
            </div>
            <div>
              <h4 className="text-lg font-bold text-foreground">{session?.net_name}</h4>
              <p className="text-xs text-muted-foreground">{start ? format(start, "EEEE, MMM d, yyyy") : ""}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <Row label="Start" value={start ? format(start, "h:mm a") : "—"} />
            <Row label="End" value={end ? format(end, "h:mm a") : "—"} />
            <Row label="Duration" value={session ? <DurationTimer startedAt={session.started_at} endedAt={session.ended_at} pausedAt={session.paused_at} pausedTotal={session.paused_total} status="closed" /> : "—"} />
            <Row label="Operators" value={approved.length} />
            <Row label="Visitors" value={visitors} />
            <Row label="Net Control" value={session?.net_control || "—"} />
            <Row label="Co-Host" value={session?.co_host || "—"} />
            <Row label="Repeater" value={session?.repeater_callsign || "—"} />
            <Row label="Longest Contact" value={longest != null ? `${Math.round(longest)} mi` : "—"} />
            <Row label="Priority Traffic" value={approved.filter((c) => c.status === "priority").length} />
            <Row label="Emergency" value={approved.filter((c) => c.status === "emergency").length} />
            <Row label="Frequency" value={session?.frequency ? `${session.frequency} MHz` : "—"} />
          </div>
        </div>

        <div className="mt-3 rounded-2xl bg-card/60 border border-white/[0.06] p-3 max-h-40 overflow-y-auto">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-2">Roster ({approved.length})</p>
          <div className="space-y-1">
            {approved.map((c) => (
              <div key={c.id} className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground w-5 tabular-nums">{c.checkin_number || "–"}</span>
                <span className="font-semibold text-foreground flex-1 truncate">{c.callsign}</span>
                <span className="text-muted-foreground truncate">{c.location || ""}</span>
              </div>
            ))}
            {approved.length === 0 && <p className="text-xs text-muted-foreground">No check-ins recorded.</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-4">
          <button onClick={exportCSV} className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-500/15 border border-violet-500/30 text-violet-300 text-xs font-bold active:scale-95 transition"><FileDown className="w-4 h-4" /> Export CSV</button>
          <button onClick={() => window.print()} className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-card border border-white/10 text-foreground text-xs font-bold active:scale-95 transition"><Printer className="w-4 h-4" /> Print / PDF</button>
          <button onClick={share} className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-card border border-white/10 text-foreground text-xs font-bold active:scale-95 transition"><Share2 className="w-4 h-4" /> Share</button>
          <button onClick={onPostForum} disabled={posting || !!session?.forum_thread_id} className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-bold active:scale-95 transition disabled:opacity-50"><Send className="w-4 h-4" /> {session?.forum_thread_id ? "Posted" : "Post to Forum"}</button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-black/20 px-2.5 py-1.5">
      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</span>
      <span className="text-xs font-semibold text-foreground">{value}</span>
    </div>
  );
}