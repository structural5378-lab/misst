import { useEffect, useRef, useState } from "react";

// useCountUp — animate a number from its previous value to the new target
// over `duration` ms with an ease-out cubic. Returns the current animated value.
export function useCountUp(target, duration = 600) {
  const [val, setVal] = useState(target);
  const fromRef = useRef(target);
  useEffect(() => {
    const from = fromRef.current;
    if (from === target) return;
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(from + (target - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else { setVal(target); fromRef.current = target; }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

// useSparkline — samples `value` every `interval` ms, keeping a rolling buffer
// of the last `max` samples for mini sparkline rendering.
export function useSparkline(value, max = 24, interval = 5000) {
  const [data, setData] = useState([value]);
  const valRef = useRef(value);
  valRef.current = value;
  useEffect(() => {
    const id = setInterval(() => {
      setData((d) => {
        const next = [...d, valRef.current];
        return next.length > max ? next.slice(next.length - max) : next;
      });
    }, interval);
    return () => clearInterval(id);
  }, [max, interval]);
  return data;
}

// useLocalStorage — persisted state helper for panel collapse / layout prefs.
export function useLocalStorage(key, initial) {
  const [val, setVal] = useState(() => {
    try { const v = localStorage.getItem(key); return v != null ? JSON.parse(v) : initial; } catch { return initial; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }, [key, val]);
  return [val, setVal];
}

// useNow — ticking clock for the server-time display.
export function useNow(interval = 1000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const id = setInterval(() => setNow(new Date()), interval); return () => clearInterval(id); }, [interval]);
  return now;
}

// useHeartbeat — increments a counter every `interval` ms (drives the sync pill pulse).
export function useHeartbeat(interval = 5000) {
  const [beat, setBeat] = useState(0);
  useEffect(() => { const id = setInterval(() => setBeat((b) => b + 1), interval); return () => clearInterval(id); }, [interval]);
  return beat;
}