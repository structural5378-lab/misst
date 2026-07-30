import React from "react";
import { Users, Radio, UserCheck, Signal, Gauge, Timer, ListOrdered, Siren, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { fmtRuntime } from "../missionV2/runtime";
import { useCountUp, useSparkline } from "./mcvV3Utils";

// McvKpiDashboard — enterprise KPI cards with animated count-up, mini
// sparklines (rolling 24-sample buffer), and trend arrows. Replaces the old
// static analytics strip in the desktop bottom row.
function sigBars(r) { if (!r) return 3; const m = String(r).match(/(\d)/); return m ? Math.min(5, Math.max(0, parseInt(m[1], 10))) : 3; }

function Sparkline({ data, color, width = 72, height = 22 }) {
  if (!data || data.length < 2) return <svg width={width} height={height} />;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * height}`).join(" ");
  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function KpiCard({ label, value, raw, icon: Icon, color, sparkColor, spark, trend, mono }) {
  const num = Number(value);
  const animate = Number.isFinite(num);
  const v = useCountUp(animate ? num : 0, 600);
  const display = animate ? Math.round(v) : raw;
  return (
    <div className="relative rounded-xl bg-white/[0.03] border border-white/[0.06] px-3 py-2.5 flex flex-col gap-1.5 min-w-0 overflow-hidden hover:bg-white/[0.05] transition-colors">
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-wide">
        <Icon className={`w-3 h-3 ${color}`} /> {label}
        {trend != null && (
          <span className={`ml-auto flex items-center text-[10px] ${trend > 0 ? "text-emerald-400" : trend < 0 ? "text-rose-400" : "text-muted-foreground"}`}>
            {trend > 0 ? <ArrowUp className="w-3 h-3" /> : trend < 0 ? <ArrowDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
          </span>
        )}
      </div>
      <div className="flex items-end gap-2">
        <p className={`text-xl font-extrabold leading-none ${color} ${mono ? "tabular-nums" : ""} truncate`}>{String(display)}</p>
        {spark && <div className="ml-auto mb-0.5"><Sparkline data={spark} color={sparkColor} /></div>}
      </div>
    </div>
  );
}

export default function McvKpiDashboard({ v2 }) {
  const { approved, activeQueue, repeater, runtimeMs, metrics, incidents } = v2;
  const avg = approved.length ? Math.round(approved.reduce((s, c) => s + sigBars(c.signal_report), 0) / approved.length) : 0;
  const emergency = incidents.filter((i) => i.category === "emergency").length;
  const priority = activeQueue.filter((q) => q.priority).length;
  const onlineSpark = useSparkline(approved.length);
  const checkinSpark = useSparkline(metrics.total);
  const queueSpark = useSparkline(activeQueue.length);
  const trend = (arr) => (arr.length >= 2 ? arr[arr.length - 1] - arr[arr.length - 2] : 0);
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 p-2 h-full">
      <KpiCard label="Users Online" value={approved.length} icon={Users} color="text-emerald-400" sparkColor="#34d399" spark={onlineSpark} trend={trend(onlineSpark)} />
      <KpiCard label="Check-ins" value={metrics.total} icon={UserCheck} color="text-violet-300" sparkColor="#c4b5fd" spark={checkinSpark} trend={trend(checkinSpark)} />
      <KpiCard label="Avg Signal" value={avg} raw={`${avg}/5`} icon={Signal} color="text-cyan-300" />
      <KpiCard label="Repeaters" value={repeater ? 1 : 0} icon={Radio} color="text-fuchsia-300" />
      <KpiCard label="Priority Queue" value={priority} icon={ListOrdered} color="text-amber-300" sparkColor="#fcd34d" spark={queueSpark} trend={trend(queueSpark)} />
      <KpiCard label="Emergency" value={emergency} icon={Siren} color="text-rose-300" />
      <KpiCard label="Coverage" raw="—" icon={Gauge} color="text-teal-300" />
      <KpiCard label="Duration" raw={fmtRuntime(runtimeMs)} icon={Timer} color="text-sky-300" mono />
    </div>
  );
}