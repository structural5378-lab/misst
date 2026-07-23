import React, { useState, useEffect } from "react";

export default function DurationTimer({ startedAt, pausedAt, pausedTotal = 0, status, endedAt }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!startedAt) return;
    const start = new Date(startedAt).getTime();
    const end = status === "closed" && endedAt ? new Date(endedAt).getTime() : null;
    const tick = () => {
      const now = end ?? Date.now();
      let e = now - start - (pausedTotal || 0);
      if (status === "paused" && pausedAt && !end) e -= Date.now() - new Date(pausedAt).getTime();
      setElapsed(Math.max(0, e));
    };
    tick();
    const id = end ? null : setInterval(tick, 1000);
    return () => { if (id) clearInterval(id); };
  }, [startedAt, pausedAt, pausedTotal, status, endedAt]);

  const h = Math.floor(elapsed / 3600000);
  const m = Math.floor((elapsed % 3600000) / 60000);
  const s = Math.floor((elapsed % 60000) / 1000);
  const pad = (n) => String(n).padStart(2, "0");
  return <span className="tabular-nums tracking-wider">{pad(h)}:{pad(m)}:{pad(s)}</span>;
}