import React, { useEffect, useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Radio, Mic, TowerControl, Volume2, VolumeX, Bell, BellOff,
  Activity, AlertTriangle, CheckCircle2, Square, Play, Info,
} from "lucide-react";
import { useMistUser } from "@/hooks/useMistUser";
import { useGmrsIdReminder } from "@/hooks/useGmrsIdReminder";

const SMART_KEY = "mist_gmrs_id_smart_mode";

function fmtClock(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
function fmtDuration(ms) {
  const t = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
function fmtTime(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function fmtAgo(ts, now) {
  if (!ts) return "—";
  return fmtDuration(now - ts);
}

export default function GmrsCallSignReminder() {
  const { mistUser } = useMistUser();
  const r = useGmrsIdReminder(mistUser.callsign);
  const [smartMode, setSmartMode] = useState(() => {
    try { return localStorage.getItem(SMART_KEY) === "true"; } catch { return false; }
  });
  useEffect(() => {
    try { localStorage.setItem(SMART_KEY, smartMode ? "true" : "false"); } catch { /* ignore */ }
  }, [smartMode]);

  const [rpName, setRpName] = useState(r.repeater?.name || "");
  const [rpFreq, setRpFreq] = useState(r.repeater?.frequency || "");
  const [rpTone, setRpTone] = useState(r.repeater?.tone || "");
  const [notifPerm, setNotifPerm] = useState(() =>
    "Notification" in window ? Notification.permission : "unsupported"
  );
  const [nowTick, setNowTick] = useState(Date.now());
  useEffect(() => {
    if (!r.repeater) return;
    const id = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, [r.repeater]);

  const handleStart = async () => {
    const perm = await r.requestNotificationPermission();
    setNotifPerm(perm);
    r.start();
  };
  const handleStartRepeater = () => {
    r.startRepeaterSession({ name: rpName, frequency: rpFreq, tone: rpTone });
    if (smartMode && !r.active) r.start();
  };

  const canStart = r.callSign.length > 0 && r.isValid;
  const displayCall = r.callSign || "YOUR CALL SIGN";
  const displayUnit = r.unit ? ` ${r.unit}` : "";

  return (
    <div>
      <PageHeader title="GMRS Call Sign Reminder" showBack />
      <div className="px-4 pt-4 space-y-4 pb-10 max-w-2xl mx-auto">

        {/* ── Call Sign Setup ── */}
        <section className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Radio className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-foreground tracking-wide">GMRS CALL SIGN REMINDER</h3>
          </div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Your Call Sign</label>
          <Input
            value={r.callSign}
            onChange={(e) => r.updateCallSign(e.target.value)}
            placeholder="WSEU790"
            maxLength={8}
            className="font-mono text-base uppercase tracking-wider"
          />
          {r.callSign && !r.isValid && (
            <p className="text-[11px] text-warning mt-1.5 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              GMRS call signs start with a letter, include a digit, and are 4–8 characters.
            </p>
          )}
          <label className="block text-xs font-medium text-muted-foreground mb-1.5 mt-3">Unit / Radio (optional)</label>
          <Input
            value={r.unit}
            onChange={(e) => r.updateUnit(e.target.value)}
            placeholder="Mobile / Base / HT / Unit 1"
            className="text-sm"
          />
          <p className="text-[10px] text-muted-foreground mt-2">
            Reference: 47 CFR §95.1751 — identify with your FCC-assigned call sign after transmissions, and at least once every 15 minutes during a series lasting more than 15 minutes.
          </p>
        </section>

        {/* ── Timer Card (state-dependent) ── */}
        {r.due ? (
          <section className="p-5 rounded-xl border-2 border-warning/60 bg-warning/5 mist-emergency-pulse text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              <h3 className="text-base font-bold text-warning tracking-wide">IDENTIFY NOW</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Transmit your GMRS call sign:</p>
            <p className="text-3xl font-mono font-bold text-foreground mb-4">{displayCall}<span className="text-muted-foreground text-lg">{displayUnit}</span></p>
            <Button onClick={r.identify} className="w-full h-12 text-base font-bold" variant="default">
              <CheckCircle2 className="w-5 h-5 mr-2" /> IDENTIFIED
            </Button>
            <p className="text-[11px] text-muted-foreground mt-2">Next reminder in {fmtClock(r.remaining)}</p>
          </section>
        ) : r.active ? (
          <section className="p-5 rounded-xl bg-card border border-cyan-500/30 text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <h3 className="text-sm font-bold text-success tracking-wide">GMRS ID REMINDER ACTIVE</h3>
            </div>
            <div className="font-mono text-6xl font-bold text-foreground tabular-nums my-3">{fmtClock(r.remaining)}</div>
            <p className="text-xs text-muted-foreground mb-4">Next identification reminder</p>
            <Button onClick={r.stop} variant="destructive" className="w-full h-11">
              <Square className="w-4 h-4 mr-2" /> STOP REMINDER
            </Button>
          </section>
        ) : (
          <section className="p-5 rounded-xl bg-card border border-border text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Mic className="w-5 h-5 text-muted-foreground" />
              <h3 className="text-sm font-bold text-muted-foreground tracking-wide">GMRS ID REMINDER OFF</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Start a 15-minute identification reminder. MISST will alert you when it's time to transmit your call sign.
            </p>
            <Button onClick={handleStart} disabled={!canStart} className="w-full h-12 text-base font-bold">
              <Play className="w-5 h-5 mr-2" /> START REMINDER
            </Button>
            {!canStart && (
              <p className="text-[11px] text-muted-foreground mt-2">Enter a valid GMRS call sign above to begin.</p>
            )}
          </section>
        )}

        {/* ── Repeater Session ── */}
        <section className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-2 mb-3">
            <TowerControl className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-bold text-foreground">Repeater Session</h3>
            {r.repeater && <span className="ml-auto text-[10px] font-bold text-success flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />ACTIVE</span>}
          </div>
          {!r.repeater ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Input value={rpName} onChange={(e) => setRpName(e.target.value)} placeholder="Repeater name" className="text-sm" />
                <Input value={rpFreq} onChange={(e) => setRpFreq(e.target.value)} placeholder="462.675 MHz" className="text-sm" />
              </div>
              <Input value={rpTone} onChange={(e) => setRpTone(e.target.value)} placeholder="PL tone (e.g. 141.3)" className="text-sm" />
              <Button onClick={handleStartRepeater} variant="outline" className="w-full">
                <Play className="w-4 h-4 mr-2" /> Start Repeater Session
              </Button>
              {smartMode && (
                <p className="text-[10px] text-muted-foreground">Smart mode is ON — starting a session will also start the ID timer.</p>
              )}
            </div>
          ) : (
            <div className="space-y-1.5 text-sm">
              <Row label="Repeater" value={`${r.repeater.name || "—"} ${r.repeater.frequency || ""}`.trim()} />
              <Row label="Tone" value={r.repeater.tone || "—"} />
              <Row label="Call Sign" value={displayCall + displayUnit} mono />
              <Row label="Start Time" value={fmtTime(r.repeater.startedAt)} />
              <Row label="Session Duration" value={fmtDuration(nowTick - r.repeater.startedAt)} mono />
              <Row label="Last Identification" value={fmtAgo(r.lastIdentificationAt, nowTick)} mono />
              <Row label="Next Identification" value={r.active ? fmtClock(r.remaining) : "—"} mono />
              <Button onClick={() => { r.stopRepeaterSession(); }} variant="outline" size="sm" className="w-full mt-2">
                <Square className="w-3.5 h-3.5 mr-2" /> End Repeater Session
              </Button>
            </div>
          )}
        </section>

        {/* ── Settings ── */}
        <section className="p-4 rounded-xl bg-card border border-border space-y-3">
          <h3 className="text-sm font-bold text-foreground">Settings</h3>

          {/* Smart Radio Activity Mode */}
          <button
            onClick={() => setSmartMode((v) => !v)}
            className="w-full flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border hover:border-primary/30 transition-colors"
          >
            <div className="flex items-center gap-2.5 text-left">
              <Activity className={`w-4 h-4 ${smartMode ? "text-primary" : "text-muted-foreground"}`} />
              <div>
                <p className="text-sm font-medium text-foreground">Smart Radio Activity Mode</p>
                <p className="text-[10px] text-muted-foreground">Auto-start the ID timer with repeater sessions</p>
              </div>
            </div>
            <span className={`w-10 h-6 rounded-full relative transition-colors ${smartMode ? "bg-primary" : "bg-muted"}`}>
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${smartMode ? "translate-x-4" : "translate-x-0.5"}`} />
            </span>
          </button>
          <p className="text-[10px] text-muted-foreground -mt-1 px-1">
            MISST cannot detect RF transmissions. This mode starts the timer from in-app activity (repeater sessions), not from actual radio traffic.
          </p>

          {/* Sound toggle */}
          <button
            onClick={() => r.setSoundEnabled(!r.soundEnabled)}
            className="w-full flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border hover:border-primary/30 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              {r.soundEnabled ? <Volume2 className="w-4 h-4 text-primary" /> : <VolumeX className="w-4 h-4 text-muted-foreground" />}
              <p className="text-sm font-medium text-foreground">Notification Sound</p>
            </div>
            <span className={`w-10 h-6 rounded-full relative transition-colors ${r.soundEnabled ? "bg-primary" : "bg-muted"}`}>
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${r.soundEnabled ? "translate-x-4" : "translate-x-0.5"}`} />
            </span>
          </button>

          {/* Browser notifications */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border">
            <div className="flex items-center gap-2.5">
              {notifPerm === "granted" ? <Bell className="w-4 h-4 text-success" /> : <BellOff className="w-4 h-4 text-muted-foreground" />}
              <div>
                <p className="text-sm font-medium text-foreground">Browser Notifications</p>
                <p className="text-[10px] text-muted-foreground capitalize">{notifPerm === "unsupported" ? "not supported" : notifPerm}</p>
              </div>
            </div>
            {notifPerm !== "granted" && notifPerm !== "unsupported" && (
              <Button size="sm" variant="outline" onClick={async () => setNotifPerm(await r.requestNotificationPermission())}>
                Enable
              </Button>
            )}
          </div>
        </section>

        {/* ── Disclaimer ── */}
        <section className="p-3 rounded-xl bg-secondary/40 border border-border/50">
          <div className="flex gap-2">
            <Info className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              <span className="font-semibold text-foreground">GMRS Compliance Reminder:</span> This tool is a reminder aid and does not transmit your call sign or control your radio. Operators are responsible for complying with applicable FCC rules and properly identifying their station.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

function Row({ label, value, mono }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-border/40 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-xs font-medium text-foreground ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}