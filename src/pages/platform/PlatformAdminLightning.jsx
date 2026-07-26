import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Zap, CloudLightning, Trash2, RefreshCw, Activity, CheckCircle2, XCircle } from "lucide-react";

// PlatformAdminLightning — Developer Mode panel for the Lightning Alert System.
// Testing only: generate/clear mock strikes. Creating strikes triggers the
// real-time entity automation (lightningOnStrike) for delivery to enabled users.
export default function PlatformAdminLightning() {
  const [busy, setBusy] = useState("");
  const [strikes, setStrikes] = useState([]);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const rows = await base44.entities.LightningStrike.list("-strike_time", 100);
      setStrikes(rows || []);
    } catch {}
    setLoading(false);
  };

  const checkHealth = async () => {
    try {
      const res = await base44.functions.invoke("lightningDevAction", { action: "health" });
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
      await base44.functions.invoke("lightningDevAction", { action });
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

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CloudLightning className="w-6 h-6 text-cyan-400" /> Lightning
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Weather & Hazard Alerts · Phase 1 (Mock Provider)</p>
        </div>
        <button onClick={checkHealth} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary text-sm">
          <Activity className="w-4 h-4" /> Health Check
        </button>
      </div>

      {/* Provider health */}
      {health && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm ${health.ok ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-rose-500/10 border-rose-500/30 text-rose-400"}`}>
          {health.ok ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          <span className="font-medium">{health.ok ? "Provider operational" : "Provider error"}</span>
          {health.detail && <span className="text-muted-foreground">— {health.detail}</span>}
        </div>
      )}

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
          Strikes are generated near the admin's live RadioScope location (or the default map center).
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
            No strikes yet. Use the buttons above to generate mock strikes.
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
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
                    <td className="px-3 py-2 font-mono text-xs">{s.latitude.toFixed(3)}, {s.longitude.toFixed(3)}</td>
                    <td className="px-3 py-2">{ageLabel(s.strike_time || s.created_date)}</td>
                    <td className="px-3 py-2">{s.intensity ?? "—"}</td>
                    <td className="px-3 py-2">{s.provider || "mock"}</td>
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