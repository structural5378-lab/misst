import { useEffect, useState } from "react";

// usePollingGate — returns `true` only when polling should run.
// Polling is paused when:
//   • the document is hidden (tab switched, app minimized, screen locked), OR
//   • the user has been inactive (no mouse/keyboard/touch/scroll) for
//     `idleMs` (default 3 minutes).
// It resumes instantly on the next interaction or visibility change.
//
// Use it to gate `refetchInterval` on non-realtime-critical queries:
//   const active = usePollingGate();
//   refetchInterval: active ? 30000 : false,
//
// Realtime-critical surfaces (live net control, open chat window) should NOT
// use this — they rely on the global refetchIntervalInBackground:false which
// already pauses them only when the tab is truly hidden.
export function usePollingGate(idleMs = 3 * 60 * 1000) {
  const [active, setActive] = useState(true);

  useEffect(() => {
    let idleTimer = null;
    const resetIdle = () => {
      setActive(true);
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => setActive(false), idleMs);
    };
    const onVisibility = () => setActive(!document.hidden && !idleTimer?._idle);
    const onVisibilitySimple = () => {
      if (document.hidden) setActive(false);
      else resetIdle();
    };

    const events = ["mousemove", "keydown", "touchstart", "scroll", "click"];
    events.forEach((e) => window.addEventListener(e, resetIdle, { passive: true }));
    document.addEventListener("visibilitychange", onVisibilitySimple);

    resetIdle();
    return () => {
      clearTimeout(idleTimer);
      events.forEach((e) => window.removeEventListener(e, resetIdle));
      document.removeEventListener("visibilitychange", onVisibilitySimple);
    };
  }, [idleMs]);

  return active;
}