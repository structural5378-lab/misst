import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { mist } from '@/api/mist';
import { withAiCache } from "@/lib/aiCache";
import { useRealtimeFallback } from "./useRealtimeFallback";
import { useMissionControl } from "./useMissionControl";

// useMissionControlV2 — composes the existing useMissionControl hook (which
// owns all core net data + operator actions: start/pause/resume/end, approve,
// edit status, manual/self check-in, XP) and augments it with the V2 surface:
// queue mutations, incident mutations, weather, runtime clock, roll call,
// AI summary, and PDF export. When opened without a netId it auto-detects the
// first active/paused session across all nets.
export function useMissionControlV2(routeNetId, { onXp, onUnlock } = {}) {
  const qc = useQueryClient();
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);

  const { healthy: sessionsHealthy, markEvent: markSession } = useRealtimeFallback(15000);
  const { data: allSessions = [] } = useQuery({
    queryKey: ["net-sessions-all"],
    queryFn: () => mist.entities.NetSession.list("-started_at", 50),
    enabled: !routeNetId,
    refetchInterval: sessionsHealthy ? false : 5000,
  });
  // Realtime subscription for session changes — polling is only a fallback.
  useEffect(() => {
    const u = mist.entities.NetSession.subscribe(() => { markSession(); qc.invalidateQueries({ queryKey: ["net-sessions-all"] }); });
    return u;
  }, [qc, markSession]);
  const autoSession = !routeNetId ? (allSessions.find((s) => s.status === "active" || s.status === "paused") || null) : null;
  const effectiveNetId = routeNetId || autoSession?.net_id || null;

  const mc = useMissionControl(effectiveNetId, { onXp, onUnlock });
  const { net, activeSession, approved, activeQueue, incidents, timeline, repeater, metrics, isOperator, user } = mc;
  const sid = activeSession?.id;

  // --- Queue mutations ---
  const callNext = async () => {
    if (!sid) return;
    const next = activeQueue.find((q) => q.status === "waiting");
    if (!next) return;
    await mist.entities.NetQueueEntry.update(next.id, { status: "called", called_at: new Date().toISOString() });
    try { await mist.entities.NetTimeline.create({ session_id: sid, net_id: effectiveNetId, event_type: "note", message: `Called ${next.callsign} to speak`, actor_name: next.callsign, actor_avatar: next.avatar, actor_id: next.user_id }); } catch {}
    qc.invalidateQueries({ queryKey: ["net-queue", sid] });
  };
  const callEntry = async (q) => { await mist.entities.NetQueueEntry.update(q.id, { status: "called", called_at: new Date().toISOString() }); qc.invalidateQueries({ queryKey: ["net-queue", sid] }); };
  const skipEntry = async (q) => { await mist.entities.NetQueueEntry.update(q.id, { status: "skipped" }); qc.invalidateQueries({ queryKey: ["net-queue", sid] }); };
  const removeEntry = async (q) => { await mist.entities.NetQueueEntry.update(q.id, { status: "removed" }); qc.invalidateQueries({ queryKey: ["net-queue", sid] }); };
  const requestSpeak = async () => {
    if (!sid) return;
    const uid = user?.uid || user?.id;
    await mist.entities.NetQueueEntry.create({ session_id: sid, net_id: effectiveNetId, user_id: uid || "", callsign: user?.callsign || user?.username || "Operator", name: user?.full_name || user?.username || "", avatar: user?.avatar || "", location: user?.location || "", priority: "normal", status: "waiting", requested_at: new Date().toISOString(), position: activeQueue.length + 1 });
    qc.invalidateQueries({ queryKey: ["net-queue", sid] });
  };

  // --- Incident mutations ---
  const SEV = { emergency: "critical", priority: "warning", weather: "warning", equipment_failure: "warning", repeater_offline: "critical", medical: "critical", general_note: "info" };
  const addIncident = async (category, notes) => {
    if (!sid || !notes.trim()) return;
    await mist.entities.NetIncident.create({ session_id: sid, net_id: effectiveNetId, category, notes: notes.trim(), severity: SEV[category] || "info", operator: user?.callsign || user?.username || user?.full_name || "Net Control", operator_id: user?.uid || user?.id || "", timestamp: new Date().toISOString() });
    try { await mist.entities.NetTimeline.create({ session_id: sid, net_id: effectiveNetId, event_type: category === "emergency" ? "emergency" : category === "priority" ? "priority" : "note", message: `${category.replace("_", " ")}: ${notes.trim()}`, actor_name: user?.callsign || user?.username || "" }); } catch {}
    qc.invalidateQueries({ queryKey: ["net-incidents", sid] });
  };
  const removeIncident = async (id) => { await mist.entities.NetIncident.delete(id); qc.invalidateQueries({ queryKey: ["net-incidents", sid] }); };

  // --- Weather (repeater coords or default) ---
  const { data: weather } = useQuery({
    queryKey: ["mcv-weather", effectiveNetId],
    queryFn: async () => { const r = await mist.functions.invoke("getWeatherData", { lat: repeater?.latitude, lon: repeater?.longitude }); return r.data; },
    enabled: !!activeSession,
    staleTime: 10 * 60 * 1000,
  });

  // --- Runtime ---
  const runtimeMs = useMemo(() => {
    if (!activeSession?.started_at) return 0;
    if (activeSession.status === "closed" && activeSession.ended_at) return new Date(activeSession.ended_at) - new Date(activeSession.started_at) - (activeSession.paused_total || 0);
    const pauseAdd = activeSession.status === "paused" && activeSession.paused_at ? now - new Date(activeSession.paused_at).getTime() : 0;
    return Math.max(0, now - new Date(activeSession.started_at).getTime() - (activeSession.paused_total || 0) - pauseAdd);
  }, [activeSession, now]);

  // --- Roll call ---
  const rollCall = async () => {
    if (!sid) return;
    await mist.entities.NetTimeline.create({ session_id: sid, net_id: effectiveNetId, event_type: "note", message: `Roll call initiated — ${approved.length} operators checked in`, actor_name: user?.callsign || user?.username || "Net Control" });
    qc.invalidateQueries({ queryKey: ["net-timeline", sid] });
  };

  // --- AI summary (explicit button only; cached 24h + 30s dedupe) ---
  const generateSummary = async () => {
    if (!activeSession) return null;
    const payload = { net_name: net?.name, net_control: activeSession.net_control, runtime: runtimeMs, checkins: approved.map((c) => ({ callsign: c.callsign, status: c.status, location: c.location, signal: c.signal_report })), incidents: incidents.map((i) => ({ category: i.category, notes: i.notes, severity: i.severity })), metrics };
    // Cache key from stable state (not runtime) so identical net state returns
    // the cached summary instead of re-calling the LLM.
    const cacheKey = `mcv-summary-${sid}-${approved.length}-${incidents.length}`;
    return withAiCache(cacheKey, async () => {
      const res = await mist.integrations.Core.InvokeLLM({
        prompt: `You are an assistant for a GMRS net control operator. Summarize the current net session in 4-6 concise bullet points: net name, runtime, attendance breakdown, notable traffic (priority/emergency), incidents, and suggested next actions. Data: ${JSON.stringify(payload)}`,
        response_json_schema: { type: "object", properties: { summary: { type: "string" } }, required: ["summary"] },
      });
      return res?.summary || (typeof res === "string" ? res : JSON.stringify(res));
    });
  };

  // --- Export PDF ---
  const exportPdf = async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    let y = 14;
    doc.setFontSize(16); doc.text(`Net Log: ${net?.name || activeSession?.net_name || "Net"}`, 14, y); y += 8;
    doc.setFontSize(10);
    doc.text(`Net Control: ${activeSession?.net_control || "—"}`, 14, y); y += 6;
    doc.text(`Started: ${activeSession?.started_at ? new Date(activeSession.started_at).toLocaleString() : "—"}`, 14, y); y += 6;
    doc.text(`Check-ins: ${approved.length}`, 14, y); y += 8;
    doc.setFontSize(11); doc.text("Check-ins", 14, y); y += 6; doc.setFontSize(9);
    approved.forEach((c) => {
      if (y > 280) { doc.addPage(); y = 14; }
      doc.text(`#${c.checkin_number || ""} ${c.callsign} — ${c.location || ""} — ${c.signal_report || ""} — ${c.status} — ${c.notes || ""}`, 14, y); y += 5;
    });
    y += 4; doc.setFontSize(11); doc.text("Timeline", 14, y); y += 6; doc.setFontSize(9);
    timeline.forEach((e) => {
      if (y > 280) { doc.addPage(); y = 14; }
      doc.text(`${e.created_date ? new Date(e.created_date).toLocaleTimeString() : ""}  ${e.message}`, 14, y); y += 5;
    });
    doc.save(`net-log-${String(net?.slug || activeSession?.net_name || "net").replace(/\s+/g, "-").toLowerCase()}.pdf`);
  };

  const dl = (content, filename, mime = "text/plain") => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };
  const safeSlug = String(net?.slug || activeSession?.net_name || "net").replace(/\s+/g, "-").toLowerCase();

  const exportCsv = () => {
    const rows = [["#", "Callsign", "Name", "Status", "Location", "Signal", "Joined", "Notes"]];
    approved.forEach((c) => rows.push([c.checkin_number || "", c.callsign || "", c.name || "", c.status || "", c.location || "", c.signal_report || "", c.checked_in_at ? new Date(c.checked_in_at).toISOString() : "", c.notes || ""]));
    rows.push([], ["Time", "Actor", "Type", "Message"]);
    timeline.forEach((e) => rows.push([e.created_date ? new Date(e.created_date).toISOString() : "", e.actor_name || "", e.event_type || "", e.message || ""]));
    const csv = rows.map((r) => r.map((cell) => `"${String(cell || "").replace(/"/g, '""')}"`).join(",")).join("\n");
    dl(csv, `net-log-${safeSlug}.csv`, "text/csv");
  };

  const exportIcs214 = () => {
    const started = activeSession?.started_at ? new Date(activeSession.started_at).toLocaleString() : "—";
    const lines = [
      "INCIDENT COMMAND SYSTEM (ICS) - FORM 214 - ACTIVITY LOG",
      "==============================================",
      `Incident/Net Name: ${net?.name || activeSession?.net_name || "—"}`,
      `Operational Period: ${started} to ${new Date().toLocaleString()}`,
      `Net Control: ${activeSession?.net_control || "—"}`,
      `Assistant NCS: ${net?.assistant_net_control || activeSession?.co_host || "—"}`,
      `Community: ${activeSession?.community_name || net?.community_name || "—"}`,
      "",
      "PERSONNEL ROSTER",
      "----------------------------------------------",
      "#  Callsign     Name                Status        Location",
    ];
    approved.forEach((c) => {
      lines.push(`${String(c.checkin_number || "").padEnd(3)} ${(c.callsign || "").padEnd(12)} ${(c.name || "").padEnd(19)} ${(c.status || "").padEnd(13)} ${c.location || ""}`);
    });
    lines.push("", "ACTIVITY LOG", "----------------------------------------------", "Time              Activity");
    timeline.forEach((e) => {
      lines.push(`${(e.created_date ? new Date(e.created_date).toLocaleTimeString() : "").padEnd(17)} ${e.message || ""}`);
    });
    lines.push("", `Prepared by: ${activeSession?.net_control || "Net Control"}`, `Generated: ${new Date().toLocaleString()}`);
    dl(lines.join("\n"), `ics-214-${safeSlug}.txt`, "text/plain");
  };

  const exportIcs309 = () => {
    const started = activeSession?.started_at ? new Date(activeSession.started_at).toLocaleString() : "—";
    const lines = [
      "INCIDENT COMMAND SYSTEM (ICS) - FORM 309 - COMMUNICATIONS LOG",
      "==============================================",
      `Incident/Net Name: ${net?.name || activeSession?.net_name || "—"}`,
      `Operational Period: ${started} to ${new Date().toLocaleString()}`,
      `Net Control: ${activeSession?.net_control || "—"}`,
      `Frequency: ${net?.frequency ? net.frequency + " MHz" : "—"}   Tone: ${net?.tone || "—"}`,
      "",
      "Time         Call Sign     Message",
      "----------------------------------------------",
    ];
    timeline.forEach((e) => {
      lines.push(`${(e.created_date ? new Date(e.created_date).toLocaleTimeString() : "").padEnd(12)} ${(e.actor_name || "System").padEnd(13)} ${e.message || ""}`);
    });
    lines.push("", `Prepared by: ${activeSession?.net_control || "Net Control"}`, `Generated: ${new Date().toLocaleString()}`);
    dl(lines.join("\n"), `ics-309-${safeSlug}.txt`, "text/plain");
  };

  // Manual refresh — invalidate every live query (realtime subscriptions + the
  // 5s refetch already keep data fresh; this powers the command-bar Refresh btn).
  const refresh = useCallback(() => {
    qc.invalidateQueries({ queryKey: ["net-sessions-all"] });
    qc.invalidateQueries({ queryKey: ["net-sessions", effectiveNetId] });
    qc.invalidateQueries({ queryKey: ["net-log", sid] });
    qc.invalidateQueries({ queryKey: ["net-queue", sid] });
    qc.invalidateQueries({ queryKey: ["net-incidents", sid] });
    qc.invalidateQueries({ queryKey: ["net-timeline", sid] });
    qc.invalidateQueries({ queryKey: ["mcv-weather", effectiveNetId] });
  }, [qc, effectiveNetId, sid]);

  return {
    ...mc, effectiveNetId, now, runtimeMs, weather, allSessions, refresh,
    callNext, callEntry, skipEntry, removeEntry, requestSpeak,
    addIncident, removeIncident, rollCall, generateSummary, exportPdf,
    exportCsv, exportIcs214, exportIcs309,
  };
}