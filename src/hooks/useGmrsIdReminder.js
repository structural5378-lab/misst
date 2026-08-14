import { useCallback, useEffect, useRef, useState } from "react";
import { normalizeCallsign, isValidGmrsCallsign } from "@/lib/gmrsCallsign";

// useGmrsIdReminder — FCC 47 CFR §95.1751 GMRS station identification reminder.
//
// The 15-minute (900 s) interval is fixed and exact. All timing is derived from
// real timestamps (sessionStartedAt / lastIdentificationAt / nextIdentificationAt)
// persisted to localStorage, so the countdown survives navigation, background
// suspension, and full app restarts — it never relies solely on setInterval.
// On resume, remaining time is recomputed from the stored nextIdentificationAt;
// if the reminder came due while the app was closed, the identification alert
// fires immediately.

const STORAGE_KEY = "mist_gmrs_id_reminder_v1";
const SOUND_KEY = "mist_gmrs_id_sound_enabled";
const SMART_KEY = "mist_gmrs_id_smart_mode";
export const GMRS_INTERVAL_MS = 15 * 60 * 1000; // exactly 900,000 ms

function loadState() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") || {}; } catch { return {}; }
}
function saveState(s) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

function fireBrowserNotification(callSign, unit) {
  try {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    const cs = callSign || "your call sign";
    const u = unit ? ` ${unit}` : "";
    new Notification("📻 GMRS ID REQUIRED", {
      body: `It's time to identify your station.\nTransmit your GMRS call sign: ${cs}${u}\nNext reminder in 15:00`,
      tag: "mist-gmrs-id-reminder",
    });
  } catch { /* ignore */ }
}

function playAlertSound(enabled) {
  if (!enabled) return;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = "sine"; osc.frequency.value = 880;
    const t = ctx.currentTime;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.25, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
    osc.start(t); osc.stop(t + 0.45);
    osc.onended = () => { try { ctx.close(); } catch { /* ignore */ } };
  } catch { /* ignore */ }
}

export function useGmrsIdReminder(initialCallsign = "") {
  const persisted = loadState();
  const [callSign, setCallSign] = useState(persisted.callSign || "");
  const [unit, setUnit] = useState(persisted.unit || "");
  const [active, setActive] = useState(!!persisted.active);
  const [due, setDue] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [sessionStartedAt, setSessionStartedAt] = useState(persisted.sessionStartedAt || null);
  const [lastIdentificationAt, setLastIdentificationAt] = useState(persisted.lastIdentificationAt || null);
  const [nextIdentificationAt, setNextIdentificationAt] = useState(persisted.nextIdentificationAt || null);
  const [repeater, setRepeater] = useState(persisted.repeater || null);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try { return localStorage.getItem(SOUND_KEY) !== "false"; } catch { return true; }
  });

  // Populate from the user's MISST profile if nothing is saved locally yet.
  useEffect(() => {
    if (!callSign && initialCallsign && isValidGmrsCallsign(initialCallsign)) {
      setCallSign(normalizeCallsign(initialCallsign));
    }
  }, [initialCallsign, callSign]);

  // Persist session state so it survives navigation, backgrounding, and restarts.
  useEffect(() => {
    saveState({ callSign, unit, active, sessionStartedAt, lastIdentificationAt, nextIdentificationAt, repeater });
  }, [callSign, unit, active, sessionStartedAt, lastIdentificationAt, nextIdentificationAt, repeater]);
  useEffect(() => {
    try { localStorage.setItem(SOUND_KEY, soundEnabled ? "true" : "false"); } catch { /* ignore */ }
  }, [soundEnabled]);

  // 1-second tick for the countdown display, plus immediate recompute on resume.
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    const onVis = () => { if (document.visibilityState === "visible") setNow(Date.now()); };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", onVis);
    };
  }, [active]);

  // Timestamp-based due check — fires once per 15-minute period, then auto-
  // advances to the next window so the reminder repeats every 15 minutes.
  const lastFiredRef = useRef(0);
  useEffect(() => {
    if (!active || !nextIdentificationAt) return;
    if (now >= nextIdentificationAt && lastFiredRef.current < nextIdentificationAt) {
      lastFiredRef.current = nextIdentificationAt;
      setDue(true);
      fireBrowserNotification(callSign, unit);
      playAlertSound(soundEnabled);
      setNextIdentificationAt(Date.now() + GMRS_INTERVAL_MS);
    }
  }, [now, active, nextIdentificationAt, callSign, unit, soundEnabled]);

  const remaining = active && nextIdentificationAt
    ? Math.max(0, Math.ceil((nextIdentificationAt - now) / 1000))
    : 0;

  const start = useCallback(() => {
    const t = Date.now();
    setActive(true); setDue(false);
    setSessionStartedAt(t); setLastIdentificationAt(t);
    setNextIdentificationAt(t + GMRS_INTERVAL_MS); setNow(t);
  }, []);
  const stop = useCallback(() => {
    setActive(false); setDue(false);
    setSessionStartedAt(null); setLastIdentificationAt(null);
    setNextIdentificationAt(null); setRepeater(null);
  }, []);
  const identify = useCallback(() => {
    const t = Date.now();
    setDue(false); setLastIdentificationAt(t); setNextIdentificationAt(t + GMRS_INTERVAL_MS);
  }, []);

  const updateCallSign = useCallback((v) => setCallSign(normalizeCallsign(v)), []);
  const updateUnit = useCallback((v) => setUnit(v), []);

  const startRepeaterSession = useCallback((info) => setRepeater({ ...info, startedAt: Date.now() }), []);
  const stopRepeaterSession = useCallback(() => setRepeater(null), []);

  const requestNotificationPermission = useCallback(async () => {
    if (!("Notification" in window)) return "unsupported";
    try { return await Notification.requestPermission(); } catch { return "denied"; }
  }, []);

  return {
    callSign, unit, active, due, remaining,
    sessionStartedAt, lastIdentificationAt, nextIdentificationAt,
    repeater, soundEnabled, setSoundEnabled,
    updateCallSign, updateUnit, start, stop, identify,
    startRepeaterSession, stopRepeaterSession, requestNotificationPermission,
    isValid: isValidGmrsCallsign(callSign),
  };
}

// Lightweight read for the Toolbox badge — returns true when a reminder is due.
export function readGmrsReminderDue() {
  try {
    const s = loadState();
    return !!s.active && !!s.nextIdentificationAt && Date.now() >= s.nextIdentificationAt;
  } catch { return false; }
}

export function readGmrsReminderActive() {
  try { return !!loadState().active; } catch { return false; }
}