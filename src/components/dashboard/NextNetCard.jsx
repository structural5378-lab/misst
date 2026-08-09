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

// NextNetCard — premium next-net banner. Two presentation variants:
//   - standalone (default): the original emerald-accent card
//   - embedded: a flush strip designed to sit as a connected footer inside
//     the Operator Hero, reading as "here is what your community is doing next."
// All data/countdown logic is identical between variants.
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

  return (
    <Link to="/nets" className="block">
      <div className="relative rounded-2xl bg-card/50 border border-emerald-500/20 backdrop-blur-md overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400/60 to-emerald-500/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/[0.06] via-transparent to-transparent pointer-events-none" />
        <div className="relative flex items-center gap-3.5 px-5 py-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/12 flex items-center justify-center shrink-0" style={{ boxShadow: "0 0 22px -6px rgba(34,197,94,0.5)" }}>
            <Radio className="w-5 h-5 text-emerald-300" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold text-emerald-300/70 tracking-widest uppercase">Next Net</p>
            <p className="text-base font-bold text-white leading-tight line-clamp-1 break-words mt-0.5">{net ? net.name : "No nets scheduled"}</p>
          </div>
          {net && (
            <div className="text-right shrink-0">
              <p className="text-lg font-black text-white leading-none tabular-nums">{net.time}</p>
              {countdown && <p className="text-[10px] text-white/40 tabular-nums mt-1">{countdown}</p>}
            </div>
          )}
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-400/25 shrink-0">{badge}</span>
        </div>
      </div>
    </Link>
  );
}