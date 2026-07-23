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
  if (!d) return "UPCOMING";
  if (d.includes(td)) return "TODAY";
  if (d.includes(tm)) return "TOMORROW";
  return "SCHEDULED";
}

const BADGE_STYLES = {
  TODAY: "bg-emerald-500/20 text-emerald-300 border-emerald-400/40",
  TOMORROW: "bg-cyan-500/20 text-cyan-300 border-cyan-400/40",
  SCHEDULED: "bg-violet-500/20 text-violet-300 border-violet-400/40",
  UPCOMING: "bg-violet-500/20 text-violet-300 border-violet-400/40",
};

export default function NextNetCard({ net }) {
  const [countdown, setCountdown] = useState("");
  const badge = net ? dayBadge(net.day_of_week) : "UPCOMING";

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

  return (
    <Link to="/nets" className="block">
      <div className="relative px-4 py-3 rounded-2xl bg-card/60 border border-success/30 backdrop-blur-md overflow-hidden mist-nextnet-glow">
        <div className="absolute inset-0 bg-gradient-to-r from-success/10 via-success/5 to-transparent pointer-events-none" />
        <div className="relative flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-success/15 flex items-center justify-center shrink-0">
            <Radio className="w-5 h-5 text-success" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold tracking-widest text-success/80 uppercase">Next Net</p>
            <p className="text-sm font-semibold text-foreground truncate">{net ? net.name : "No nets scheduled"}</p>
          </div>
          {net && (
            <div className="text-right shrink-0">
              <p className="text-sm font-bold text-foreground">{net.time}</p>
              {countdown && <p className="text-[10px] text-muted-foreground tabular-nums">{countdown}</p>}
            </div>
          )}
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${BADGE_STYLES[badge]}`}>{badge}</span>
        </div>
      </div>
    </Link>
  );
}