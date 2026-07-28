import React from "react";

// McvSignalIcon — renders a 5-bar signal meter from a signal report string
// (e.g. "5x5" → 5 bars, "Q3" → 3 bars). Defaults to 3 bars when unknown.
export default function McvSignalIcon({ report, className }) {
  const bars = parseBars(report);
  return (
    <div className={`flex items-end gap-0.5 h-4 ${className || ""}`} aria-label={`Signal ${bars}/5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={`w-1 rounded-sm ${i <= bars ? "bg-emerald-400" : "bg-white/15"}`} style={{ height: `${i * 3 + 2}px` }} />
      ))}
    </div>
  );
}

function parseBars(report) {
  if (!report) return 3;
  const m = String(report).match(/(\d)/);
  if (!m) return 3;
  return Math.min(5, Math.max(0, parseInt(m[1], 10)));
}