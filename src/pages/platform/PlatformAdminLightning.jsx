import { useEffect, useState } from "react";

import { mist } from '@/api/mist';
import {
  Zap, CloudLightning, Trash2, RefreshCw, Activity, CheckCircle2, XCircle,
  Gauge, Clock, AlertTriangle, TrendingUp, Bell,
} from "lucide-react";

// PlatformAdminLightning — Lightning Alert System control center.
// Shows the live Provider Status (current provider, health, last update, last
// error, avg response time, strikes/notifications today, rate-limit) and a
// Developer Mode panel for generating/clearing mock strikes (testing only).
export default function PlatformAdminLightning() {
  const [busy, setBusy] = useState("");
  const [strikes, setStrikes] = useState([]);
  const [health, setHealth] = useState(null);
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [rows, stateRows] = await Promise.all([
        mist.entities.LightningStrike.list("-strike_time", 100),
        mist.entities.LightningProviderState.list("-created_date", 1).catch(() => []),
      ]);
      setStrikes(rows || []);
      setState((stateRows && stateRows[0]) || null);
    } catch {}
    setLoading(false);
  };

  const checkHealth = async () => {
    try {
      const res = await mist.functions.invoke("lightningDevAction", { action: "health" });
      setHealth(res.data?.health);
    } catch (e) {
      setHealth({ ok: false, detail: String(e?.message || e) });
    }
  };

  useEffect(() => {
    load();
    checkHealth();
  }, []);

  const run = async (action) => {
    setBusy(action);
    try {
      await mist.functions.invoke("lightningDevAction", { action });
      await load();
    } catch (e) {
      console.error(e);
    }
    setBusy("");
  };

  const buttons = [
    { action: "generate_random", label: "Generate Random Strike", icon: Zap, tone: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
    { action: "generate_storm", label: "Generate Storm", icon: CloudLightning, tone: "bg-violet-500/15 text-violet-400 border-violet-500/30" },
    { action: "clear_storm", label: "Clear Storm", icon: Trash2, tone: "bg-rose-500/15 text-rose-400 border-rose-500/30" },
    { action: "replay_last_hour", label: "Replay Last Hour", icon: RefreshCw, tone: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30" },
  ];

  const ageLabel = (t) => {
    const age = Date.now() - new Date(t).getTime();
    const m = Math.floor(age / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    return `${Math.floor(m / 60)}h ${m % 60}m ago`;
  };

  const fmtTime = (t) => (t ? new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—");

  const healthBadge = (h) => {
    const map = {
      ok: { c: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400", l: "Operational", Icon: CheckCircle2 },
      down: { c: "bg-rose-500/10 border-rose-500/30 text-rose-400", l: "Down", Icon: XCircle },
      not_configured: { c: "bg-amber-500/10 border-amber-500/30 text-amber-400", l: "Not Configured", Icon: AlertTriangle },
      degraded: { c: "bg-amber-500/10 border-amber-500/30 text-amber-400", l: "Degraded", Icon: AlertTriangle },
      unknown: { c: "bg-slate-500/10 border-slate-500/30 text-slate-400", l: "Unknown", Icon: Activity },
    };
    const m = map[h] || map.unknown;
    const Icon = m.Icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${m.c}`}>
        <Icon className="w-3.5 h-3.5" /> {m.l}
      </span>
    );
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CloudLightning className="w-6 h-6 text-cyan-400" /> Lightning
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Weather & Hazard Alerts · Provider Status</p>
        </div>
        <button onClick={checkHealth} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary text-sm">
          <Activity className="w-4 h-4" /> Health Check
        </button>
      </div>

      {/* Provider Status */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-3 rounded-xl border border-border bg-card/40 p-4">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
                <CloudLightning className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">Active Provider</p>
                <p className="text-lg font-bold text-foreground capitalize">{state?.provider || (health?.ok ? "mock" : "—")}</p>
              </div>
            </div>
            {healthBadge(state?.health || "unknown")}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat icon={Clock} label="Last Successful Update" value={fmtTime(state?.last_successful_update)} />
            <Stat icon={Gauge} label="Avg Response Time" value={state?.avg_response_time_ms != null ? `${Math.round(state.avg_response_time_ms)} ms` : "—"} />
            <Stat icon={Zap} label="Strikes Today" value={state?.total_strikes_today ?? 0} />
            <Stat icon={Bell} label="Notifications Today" value={state?.notifications_sent_today ?? 0} />
          </div>
          {(state?.last_error || (health && !health.ok)) && (
            <div className="mt-3 flex items-start gap-2 px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <span className="font-medium">Last error: </span>
                <span className="text-rose-300/90">{state?.last_error || health?.detail || "Unknown error"}</span>
                {state?.last_error_at && <span className="block text-rose-300/60">{new Date(state.last_error_at).toLocaleString()}</span>}
              </div>
            </div>
          )}
          {state?.rate_limit_status && state.rate_limit_status !== "n/a" && (
            <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/40 text-xs text-muted-foreground">
              <TrendingUp className="w-3.5 h-3.5" /> Rate limit: <span className="text-foreground font-medium">{state.rate_limit_status}</span>
            </div>
          )}
          <p className="mt-3 text-[11px] text-muted-foreground">
            Switch providers in dashboard settings → environment variables: <code className="text-foreground">LIGHTNING_PROVIDER=mock|live</code>.
            Live credentials: <code className="text-foreground">LIGHTNING_API_URL</code> + <code className="text-foreground">LIGHTNING_API_KEY</code>.
          </p>
        </div>
      </section>

      {/* Dev action buttons */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Developer Mode</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {buttons.map((b) => {
            const Icon = b.icon;
            return (
              <button
                key={b.action}
                onClick={() => run(b.action)}
                disabled={!!busy}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all active:scale-95 disabled:opacity-50 ${b.tone}`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-sm font-medium">{b.label}</span>
                {busy === b.action && <span className="text-[10px] animate-pulse">working…</span>}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Mock strikes generate near your live RadioScope location (or the default Miami center).
          Creating a strike triggers real-time alert delivery to enabled users within their radius.
        </p>
      </section>

      {/* Recent strikes */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Recent Strikes</h2>
          <button onClick={load} className="text-xs text-primary">Refresh</button>
        </div>
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : strikes.length === 0 ? (
          <div className="text-sm text-muted-foreground py-8 text-center rounded-xl border border-dashed border-border">
            No strikes yet. {state?.provider === "live" ? "Waiting for live data from the provider." : "Use the buttons above to generate mock strikes."}
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/40 text-muted-foreground">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">Coords</th>
                  <th className="text-left px-3 py-2 font-medium">Age</th>
                  <th className="text-left px-3 py-2 font-medium">Intensity</th>
                  <th className="text-left px-3 py-2 font-medium">Provider</th>
                  <th className="text-left px-3 py-2 font-medium">Processed</th>
                </tr>
              </thead>
              <tbody>
                {strikes.map((s) => (
                  <tr key={s.id} className="border-t border-border">
                    <td className="px-3 py-2 font-mono text-xs">{Number(s.latitude).toFixed(3)}, {Number(s.longitude).toFixed(3)}</td>
                    <td className="px-3 py-2">{ageLabel(s.strike_time || s.created_date)}</td>
                    <td className="px-3 py-2">{s.intensity ?? "—"}</td>
                    <td className="px-3 py-2 capitalize">{s.provider || "mock"}</td>
                    <td className="px-3 py-2">{s.processed ? "✅" : "⏳"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg bg-secondary/30 p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] uppercase tracking-wider">
        <Icon className="w-3 h-3" /> {label}
      </div>
      <p className="text-base font-semibold text-foreground mt-1 truncate">{value}</p>
    </div>
  );
}