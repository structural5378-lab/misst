import { useState, useEffect, useRef, useCallback } from "react";

// useRealtimeFallback — tracks whether a realtime (WebSocket) subscription is
// healthy and gates polling as a fallback.
//
// Returns { healthy, markEvent }:
//   • call markEvent() whenever a subscription delivers an event
//   • `healthy` is true only if an event arrived within `heartbeatMs`
//
// Usage:
//   const { healthy, markEvent } = useRealtimeFallback(15000);
//   refetchInterval: healthy ? false : 5000   // poll only when subscription is silent
//
// When the subscription is live, polling stops entirely. If it goes silent
// (network drop, server issue), polling automatically resumes until events
// flow again — graceful fallback with zero redundant traffic.
export function useRealtimeFallback(heartbeatMs = 15000) {
  const [healthy, setHealthy] = useState(false);
  const lastEvent = useRef(0);
  const markEvent = useCallback(() => {
    lastEvent.current = Date.now();
    setHealthy(true);
  }, []);
  useEffect(() => {
    const t = setInterval(() => {
      setHealthy(Date.now() - lastEvent.current < heartbeatMs);
    }, Math.max(2000, Math.floor(heartbeatMs / 2)));
    return () => clearInterval(t);
  }, [heartbeatMs]);
  return { healthy, markEvent };
}