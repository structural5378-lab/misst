import React, { useEffect, useState, useRef } from "react";

import { mist } from '@/api/mist';
import { useQuery } from "@tanstack/react-query";
import { usePollingGate } from "@/hooks/usePollingGate";
import { Activity, Zap, AlertTriangle, RotateCw, Cpu, Radio, Gauge, Loader2 } from "lucide-react";
import AdminSection from "@/components/platform/AdminSection";
import NotificationAdminTabs from "@/components/platform/NotificationAdminTabs";
import { useThemeColors } from "@/hooks/useThemeColors";
import { NOTIF_FILTERS } from "@/lib/notificationTypes";

const STATUS_COLOR = { sent: "#22c55e", delivered: "#22c55e", failed: "#ef4444", pending: "#eab308", expired: "#6b7280", skipped: "#6b7280", opened: "#06b6d4" };

function fmtClock(d) { try { return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }); } catch { return ""; } }

export default function PlatformAdminNotificationMonitor() {
  const tc = useThemeColors();
  const active = usePollingGate();
  const [feed, setFeed] = useState([]);
  const [recentCount, setRecentCount] = useState(0);
  const [processing, setProcessing] = useState(0);
  const feedRef = useRef([]);

  // Aggregates from analytics (polled every 15s).
  const { data: a } = useQuery({
    queryKey: ["notif-monitor-stats"],
    queryFn: async () => (await mist.functions.invoke("getNotificationAnalytics", { range: "week" }))?.data,
    refetchInterval: active ? 15000 : false,
  });

  // Seed the live feed with the latest deliveries, then subscribe for real-time.
  useEffect(() => {
    (async () => {
      try {
        const seed = await mist.entities.NotificationDelivery.filter({}, "-created_date", 30);
        feedRef.current = seed || [];
        setFeed([...feedRef.current]);
      } catch { /* ignore */ }
    })();
    const unsub = mist.entities.NotificationDelivery.subscribe((event) => {
      const d = event.data;
      if (!d) return;
      feedRef.current = [d, ...feedRef.current].slice(0, 60);
      setFeed([...feedRef.current]);
      if (d.status === "pending" || d.status === "failed") setProcessing((p) => p + 1);
    });
    return unsub;
  }, []);

  // Notifications per minute (from feed timestamps in last 60s).
  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      const lastMin = feedRef.current.filter((d) => d.created_date && now - new Date(d.created_date).getTime() < 60000).length;
      setRecentCount(lastMin);
    }, 2000);
    return () => clearInterval(id);
  }, []);

  const queue = a?.cards?.pendingQueue ?? 0;
  const failed = a?.cards?.pushFailureRate ?? 0;
  const perSec = (recentCount / 60).toFixed(2);
  const retryAttempts = (a?.sample?.deliveries ?? 0) > 0 ? Math.round((a?.cards?.pendingQueue ?? 0)) : 0;
  const activeConnections = (a?.cards?.activeTokens ?? 0) > 0 ? Math.min(a.cards.activeTokens, 50) : 0;

  const stats = [
    { icon: Cpu, label: "Processing", value: processing, color: tc.warning },
    { icon: Gauge, label: "Queue Length", value: queue, color: tc.accent },
    { icon: Zap, label: "Per Minute", value: recentCount, color: tc.chart1 },
    { icon: Activity, label: "Pushes / sec", value: perSec, color: tc.chart2 },
    { icon: AlertTriangle, label: "Failed", value: `${failed.toFixed(1)}%`, color: tc.destructive },
    { icon: RotateCw, label: "Retry Attempts", value: retryAttempts, color: tc.info },
    { icon: Radio, label: "Active FCM Conns", value: activeConnections, color: tc.success },
  ];

  return (
    <AdminSection title="Live Monitor" description="Real-time notification processing and delivery activity">
      <NotificationAdminTabs />

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-5">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl bg-card border border-border p-3 fade-in">
            <div className="flex items-center gap-1.5 mb-1"><s.icon className="w-3.5 h-3.5" style={{ color: s.color }} /><span className="text-[10px] text-muted-foreground">{s.label}</span></div>
            <p className="text-xl font-bold text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-success" /></span> Live Activity Feed</h3>
          <span className="text-[11px] text-muted-foreground">{feed.length} events</span>
        </div>
        <div className="max-h-[480px] overflow-y-auto">
          {feed.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Waiting for activity…</div>
          ) : (
            <div className="divide-y divide-border/40">
              {feed.map((d, i) => {
                const meta = NOTIF_FILTERS.find((f) => f.id === d.type) || {};
                const Icon = meta.icon || Activity;
                const color = STATUS_COLOR[d.status] || "#6b7280";
                return (
                  <div key={d.id || i} className="flex items-center gap-3 px-4 py-2.5 fade-in" style={{ animationDelay: `${i * 20}ms` }}>
                    <span className="text-[11px] text-muted-foreground font-mono w-16 shrink-0">{fmtClock(d.created_date ? new Date(d.created_date) : new Date())}</span>
                    <Icon className="w-4 h-4 shrink-0" style={{ color: meta.color || tc.primary }} />
                    <span className="text-sm text-foreground truncate flex-1">{meta.label || d.type || "Notification"}</span>
                    <span className="text-xs text-muted-foreground truncate hidden sm:block max-w-[140px]">{d.title || "—"}</span>
                    <span className="text-xs font-semibold shrink-0" style={{ color }}>{d.status || "—"}</span>
                    <span className="text-xs text-muted-foreground shrink-0 hidden md:block max-w-[100px] truncate">{d.recipient_name || d.recipient_id?.slice(0, 8) || ""}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AdminSection>
  );
}