import React, { useState, useEffect } from "react";

export default function Clock({ temp }) {
  const [dateTime, setDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (d) =>
    d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const formatTime = (d) =>
    d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-col items-end leading-tight">
        <span className="text-[10px] text-muted-foreground">{formatDate(dateTime)}</span>
        <span className="text-[11px] text-violet-400 font-semibold tabular-nums">{formatTime(dateTime)}</span>
      </div>
      {temp != null && <span className="text-xs text-amber-400 shrink-0">{temp}°F</span>}
    </div>
  );
}