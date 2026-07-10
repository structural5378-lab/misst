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
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <span>{formatDate(dateTime)}</span>
      <span className="text-violet-400">{formatTime(dateTime)}</span>
      {temp != null && <span className="text-amber-400">{temp}°F</span>}
    </div>
  );
}