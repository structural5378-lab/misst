import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Radio } from "lucide-react";

function parseTime(t) {
  if (!t) return null;
  const m = String(t).match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const ap = m[3]?.toUpperCase();
  if (ap === "PM" && h < 12) h += 12;
  if (ap === "AM" && h === 12) h = 0;
  return { h, min };
}

function dayBadge(dayOfWeek) {
  const days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const now = new Date();
  const td = days[now.getDay()];
  const tm = days[(now.getDay() + 1) % 7];
  const d = String(dayOfWeek || "").toLowerCase();
  if (!d) return "Upcoming";
  if (d.includes(td)) return "Today";
  if (d.includes(tm)) return "Tomorrow";
  return "Scheduled";
}

// NextNetCard — live operational status panel for the next scheduled net.
// Reads as a connected section of the command environment (hairline separator,
// no card). Two presentation variants share identical data/countdown logic:
//   - standalone (default): the operational status row used on the dashboard
//   - embedded: a flush strip for inline use inside other components
export default function NextNetCard({ net, embedded = false }) {
  const [countdown, setCountdown] = useState("");
  const badge = net ? dayBadge(net.day_of_week) : "Upcoming";

  useEffect(() => {
    if (!net) return;
    const t = parseTime(net.time);
    if (!t) return;
    const tick = () => {
      const target = new Date();
      target.setHours(t.h, t.min, 0, 0);
      let diff = target - new Date();
      if (diff < 0) return setCountdown("");
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(`${h}h ${m}m ${s}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [net]);

  if (embedded) {
    return (
      <Link to="/nets" className="block relative border-t border-white/10 bg-black/30 backdrop-blur-sm hover:bg-black/40 transition-colors">
        <div className="relative flex items-center gap-3 px-5 sm:px-6 py-3.5">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0" style={{ boxShadow: "0 0 18px -6px rgba(34,197,94,0.5)" }}>
            <Radio className="w-5 h-5 text-emerald-300" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-emerald-300/80 tracking-widest uppercase">Next Net</p>
            <p className="text-sm font-bold text-white leading-tight truncate">{net ? net.name : "No nets scheduled"}</p>
          </div>
          {net && countdown && <p className="text-xs text-white/45 tabular-nums shrink-0 hidden sm:block">{countdown}</p>}
          {net && <p className="text-sm font-bold text-white tabular-nums shrink-0">{net.time}</p>}
          <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-400/25 shrink-0">{badge}</span>
        </div>
      </Link>
    );
  }

  // Standalone — operational status panel (hairline separator, no card).
  return (
    <Link to="/nets" className="block group">
      <div className="border-t border-white/[0.08] pt-4 mt-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
          <div className="flex items-center gap-2.5 shrink-0">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 opacity-60 animate-ping" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </span>
            <span className="text-[10px] font-bold tracking-[0.25em] text-emerald-300/80 uppercase">Next Net</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-white truncate">{net ? net.name : "No nets scheduled"}</p>
            <p className="text-xs text-white/45 mt-0.5">
              {net ? [net.time, badge, countdown].filter(Boolean).join(" · ") : "Check back soon"}
            </p>
          </div>
          {net && (net.repeater_callsign || net.frequency || net.tone) && (
            <div className="flex items-center gap-4 text-[11px] text-white/50">
              {net.repeater_callsign && <span className="truncate max-w-[120px]"><span className="text-white/30 tracking-wider">RPT </span>{net.repeater_callsign}</span>}
              {net.frequency && <span><span className="text-white/30 tracking-wider">FREQ </span>{net.frequency} MHz</span>}
              {net.tone && <span><span className="text-white/30 tracking-wider">TONE </span>{net.tone}</span>}
            </div>
          )}
          <span className="text-xs font-bold text-emerald-300 px-3.5 py-2 rounded-lg bg-emerald-500/10 border border-emerald-400/20 shrink-0 group-hover:bg-emerald-500/20 transition-colors self-start sm:self-auto">
            {net ? "Details" : "View"} →
          </span>
        </div>
      </div>
    </Link>
  );
}