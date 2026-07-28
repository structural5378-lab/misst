import React from "react";
import { Link } from "react-router-dom";
import { Radio, MapPin, CloudRain, Calendar, Users, FileDown, Square, X } from "lucide-react";

// McvPanels — shared small panels for the footer-nav views: Panel wrapper,
// ResourcesPanel, ReportsPanel, SettingsPanel, and the After-Action ReportPanel.

export function Panel({ title, children, right }) {
  return (
    <div className="rounded-xl bg-[#15191e] border border-white/[0.06] flex flex-col">
      {title && (
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06]">
          <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{title}</h3>
          {right}
        </div>
      )}
      <div className="p-3">{children}</div>
    </div>
  );
}

export function ResourcesPanel() {
  const links = [
    { to: "/repeaters", label: "Repeater Directory", icon: Radio },
    { to: "/radioscope", label: "RadioScope Map", icon: MapPin },
    { to: "/weather", label: "Weather", icon: CloudRain },
    { to: "/nets", label: "Net Schedule", icon: Calendar },
    { to: "/members", label: "Members", icon: Users },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {links.map((l) => (
        <Link key={l.to} to={l.to} className="flex items-center gap-2 p-3 rounded-xl bg-[#15191e] border border-white/[0.06] hover:border-primary/40">
          <l.icon className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">{l.label}</span>
        </Link>
      ))}
    </div>
  );
}

export function ReportsPanel({ v2, onExport }) {
  const { approved, metrics } = v2;
  const Stat = (l, v, c) => (
    <div className="rounded-lg bg-[#15191e] border border-white/[0.06] p-3">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{l}</p>
      <p className={`text-2xl font-extrabold ${c || ""}`}>{v}</p>
    </div>
  );
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {Stat("Total Check-ins", metrics.total, "text-violet-300")}
        {Stat("Late", metrics.late, "text-amber-300")}
        {Stat("Priority", metrics.priority, "text-orange-300")}
        {Stat("Emergency", metrics.emergency, "text-rose-300")}
      </div>
      <button onClick={onExport} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-500/20 text-violet-200 border border-violet-500/30 text-sm font-bold"><FileDown className="w-4 h-4" /> Export Log (PDF)</button>
      <div className="rounded-xl bg-[#15191e] border border-white/[0.06] p-3">
        <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">Attendance ({approved.length})</h3>
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {approved.map((c) => (
            <div key={c.id} className="flex items-center gap-2 text-xs">
              <span className="w-6 text-muted-foreground">#{c.checkin_number || ""}</span>
              <span className="font-semibold">{c.callsign}</span>
              <span className="text-muted-foreground truncate">{c.location || ""}</span>
            </div>
          ))}
          {approved.length === 0 && <p className="text-xs text-muted-foreground">No check-ins.</p>}
        </div>
      </div>
    </div>
  );
}

export function SettingsPanel({ v2, onEnd }) {
  const { net, activeSession, isOperator } = v2;
  const Row = (l, v) => (
    <div className="flex justify-between py-1.5 border-b border-white/[0.04] text-sm gap-2">
      <span className="text-muted-foreground shrink-0">{l}</span>
      <span className="font-semibold text-right truncate">{v || "—"}</span>
    </div>
  );
  return (
    <div className="max-w-md mx-auto space-y-3">
      <div className="rounded-xl bg-[#15191e] border border-white/[0.06] p-3">
        <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">Net Info</h3>
        {Row("Name", net?.name)}
        {Row("Frequency", net?.frequency ? `${net.frequency} MHz` : "")}
        {Row("Tone", net?.tone)}
        {Row("Repeater", net?.repeater_callsign)}
        {Row("Net Control", activeSession?.net_control)}
        {Row("Assistant NCS", net?.assistant_net_control || activeSession?.co_host)}
        {Row("Community", activeSession?.community_name || net?.community_name)}
        {Row("Status", activeSession?.status)}
      </div>
      {isOperator && <button onClick={onEnd} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-500/15 text-rose-300 border border-rose-500/30 text-sm font-bold"><Square className="w-4 h-4" /> End Net</button>}
    </div>
  );
}

export function ReportPanel({ report, checkins, onClose }) {
  const approved = checkins.filter((c) => c.approved !== false);
  return (
    <div className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl bg-card border border-border p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold">After-Action Report</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
          <Info label="Net" value={report.net_name} />
          <Info label="Net Control" value={report.net_control} />
          <Info label="Check-ins" value={report.checkin_count} />
          <Info label="Visitors" value={report.visitors} />
          <Info label="Late" value={report.late_checkins} />
          <Info label="Priority" value={report.priority_count} />
          <Info label="Emergency" value={report.emergency_count} />
        </div>
        <p className="text-xs text-muted-foreground mb-3">{report.started_at ? `Started ${new Date(report.started_at).toLocaleString()}` : ""}{report.ended_at ? ` · Ended ${new Date(report.ended_at).toLocaleString()}` : ""}</p>
        <div className="max-h-60 overflow-y-auto space-y-1">
          {approved.map((c) => (
            <div key={c.id} className="text-xs flex gap-2">
              <span className="text-muted-foreground">#{c.checkin_number || ""}</span>
              <span className="font-semibold">{c.callsign}</span>
              <span className="text-muted-foreground truncate">{c.location || ""}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return <div><p className="text-[10px] uppercase text-muted-foreground">{label}</p><p className="font-semibold">{value ?? "—"}</p></div>;
}