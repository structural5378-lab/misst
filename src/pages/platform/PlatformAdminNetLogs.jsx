import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, ChevronDown, Download } from "lucide-react";
import AdminSection from "@/components/platform/AdminSection";

function fmtDuration(start, end) {
  if (!start || !end) return "—";
  const ms = new Date(end) - new Date(start);
  const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000);
  return h ? `${h}h ${m}m` : `${m}m`;
}

function NetLogRow({ s, open, onToggle }) {
  const { data: checkins = [] } = useQuery({
    queryKey: ["admin-net-log-attendance", s.id],
    queryFn: () => base44.entities.NetLog.filter({ session_id: s.id }, "checkin_number", 500),
    enabled: open,
  });

  const exportCsv = () => {
    const header = "#,Callsign,Name,Location,Status,Signal,Distance,Notes\n";
    const rows = checkins.map((c) =>
      [c.checkin_number || "", c.callsign || "", c.name || "", c.location || "", c.status || "", c.signal_report || "", c.distance || "", (c.notes || "").replace(/[\n,]/g, " ")].join(",")
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `netlog-${(s.net_name || s.id).replace(/\s+/g, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-xl bg-card border border-border overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center justify-between p-3 text-left">
        <div className="min-w-0">
          <p className="text-sm font-bold text-foreground truncate">{s.net_name}</p>
          <p className="text-xs text-muted-foreground">
            {s.net_control ? `NC: ${s.net_control} · ` : ""}
            {s.ended_at ? new Date(s.ended_at).toLocaleString() : ""} · {fmtDuration(s.started_at, s.ended_at)} · {s.checkin_count || 0} check-ins
            {s.visitors ? ` · ${s.visitors} visitors` : ""}
            {s.emergency_count ? ` · ${s.emergency_count} emergency` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {s.report_generated && <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">REPORT</span>}
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition ${open ? "rotate-180" : ""}`} />
        </div>
      </button>
      {open && (
        <div className="border-t border-border">
          <div className="flex justify-end px-4 pt-2">
            <button onClick={exportCsv} disabled={!checkins.length} className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 disabled:opacity-50">
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>
          {checkins.length === 0 ? (
            <p className="text-xs text-muted-foreground px-4 py-3">No attendance records.</p>
          ) : (
            <div className="overflow-x-auto px-4 pb-3 pt-2">
              <table className="w-full text-xs">
                <thead className="text-muted-foreground border-b border-border">
                  <tr>
                    <th className="text-left py-1.5 px-2">#</th>
                    <th className="text-left px-2">Callsign</th>
                    <th className="text-left px-2">Location</th>
                    <th className="text-left px-2">Status</th>
                    <th className="text-left px-2">Signal</th>
                    <th className="text-left px-2">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {checkins.map((c) => (
                    <tr key={c.id} className="border-b border-border/40">
                      <td className="py-1.5 px-2 text-muted-foreground">{c.checkin_number || "—"}</td>
                      <td className="px-2 font-semibold text-foreground">{c.callsign}</td>
                      <td className="px-2 text-muted-foreground">{c.location || "—"}</td>
                      <td className="px-2 capitalize">{(c.status || "checked_in").replace("_", " ")}</td>
                      <td className="px-2 text-muted-foreground">{c.signal_report || "—"}</td>
                      <td className="px-2 text-muted-foreground max-w-[200px] truncate">{c.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PlatformAdminNetLogs() {
  const [expanded, setExpanded] = useState(null);
  const { data: logs = [] } = useQuery({
    queryKey: ["admin-net-logs"],
    queryFn: () => base44.entities.NetSession.filter({ status: "closed" }, "-ended_at", 200),
  });

  return (
    <AdminSection title="Net Logs" description="After-action session records with full attendance rosters and CSV export.">
      {logs.length === 0 ? (
        <div className="rounded-xl bg-card border border-border p-8 text-center">
          <ClipboardList className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No closed net sessions yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((s) => (
            <NetLogRow key={s.id} s={s} open={expanded === s.id} onToggle={() => setExpanded(expanded === s.id ? null : s.id)} />
          ))}
        </div>
      )}
    </AdminSection>
  );
}