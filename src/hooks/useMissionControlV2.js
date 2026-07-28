import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
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

  const { data: allSessions = [] } = useQuery({
    queryKey: ["net-sessions-all"],
    queryFn: () => base44.entities.NetSession.list("-started_at", 50),
    enabled: !routeNetId,
    refetchInterval: 5000,
  });
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
    await base44.entities.NetQueueEntry.update(next.id, { status: "called", called_at: new Date().toISOString() });
    try { await base44.entities.NetTimeline.create({ session_id: sid, net_id: effectiveNetId, event_type: "note", message: `Called ${next.callsign} to speak`, actor_name: next.callsign, actor_avatar: next.avatar, actor_id: next.user_id }); } catch {}
    qc.invalidateQueries({ queryKey: ["net-queue", sid] });
  };
  const callEntry = async (q) => { await base44.entities.NetQueueEntry.update(q.id, { status: "called", called_at: new Date().toISOString() }); qc.invalidateQueries({ queryKey: ["net-queue", sid] }); };
  const skipEntry = async (q) => { await base44.entities.NetQueueEntry.update(q.id, { status: "skipped" }); qc.invalidateQueries({ queryKey: ["net-queue", sid] }); };
  const removeEntry = async (q) => { await base44.entities.NetQueueEntry.update(q.id, { status: "removed" }); qc.invalidateQueries({ queryKey: ["net-queue", sid] }); };
  const requestSpeak = async () => {
    if (!sid) return;
    const uid = user?.uid || user?.id;
    await base44.entities.NetQueueEntry.create({ session_id: sid, net_id: effectiveNetId, user_id: uid || "", callsign: user?.callsign || user?.username || "Operator", name: user?.full_name || user?.username || "", avatar: user?.avatar || "", location: user?.location || "", priority: "normal", status: "waiting", requested_at: new Date().toISOString(), position: activeQueue.length + 1 });
    qc.invalidateQueries({ queryKey: ["net-queue", sid] });
  };

  // --- Incident mutations ---
  const SEV = { emergency: "critical", priority: "warning", weather: "warning", equipment_failure: "warning", repeater_offline: "critical", medical: "critical", general_note: "info" };
  const addIncident = async (category, notes) => {
    if (!sid || !notes.trim()) return;
    await base44.entities.NetIncident.create({ session_id: sid, net_id: effectiveNetId, category, notes: notes.trim(), severity: SEV[category] || "info", operator: user?.callsign || user?.username || user?.full_name || "Net Control", operator_id: user?.uid || user?.id || "", timestamp: new Date().toISOString() });
    try { await base44.entities.NetTimeline.create({ session_id: sid, net_id: effectiveNetId, event_type: category === "emergency" ? "emergency" : category === "priority" ? "priority" : "note", message: `${category.replace("_", " ")}: ${notes.trim()}`, actor_name: user?.callsign || user?.username || "" }); } catch {}
    qc.invalidateQueries({ queryKey: ["net-incidents", sid] });
  };
  const removeIncident = async (id) => { await base44.entities.NetIncident.delete(id); qc.invalidateQueries({ queryKey: ["net-incidents", sid] }); };

  // --- Weather (repeater coords or default) ---
  const { data: weather } = useQuery({
    queryKey: ["mcv-weather", effectiveNetId],
    queryFn: async () => { const r = await base44.functions.invoke("getWeatherData", { lat: repeater?.latitude, lon: repeater?.longitude }); return r.data; },
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
    await base44.entities.NetTimeline.create({ session_id: sid, net_id: effectiveNetId, event_type: "note", message: `Roll call initiated — ${approved.length} operators checked in`, actor_name: user?.callsign || user?.username || "Net Control" });
    qc.invalidateQueries({ queryKey: ["net-timeline", sid] });
  };

  // --- AI summary ---
  const generateSummary = async () => {
    if (!activeSession) return null;
    const payload = { net_name: net?.name, net_control: activeSession.net_control, runtime: runtimeMs, checkins: approved.map((c) => ({ callsign: c.callsign, status: c.status, location: c.location, signal: c.signal_report })), incidents: incidents.map((i) => ({ category: i.category, notes: i.notes, severity: i.severity })), metrics };
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an assistant for a GMRS net control operator. Summarize the current net session in 4-6 concise bullet points: net name, runtime, attendance breakdown, notable traffic (priority/emergency), incidents, and suggested next actions. Data: ${JSON.stringify(payload)}`,
      response_json_schema: { type: "object", properties: { summary: { type: "string" } }, required: ["summary"] },
    });
    return res?.summary || (typeof res === "string" ? res : JSON.stringify(res));
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

  return {
    ...mc, effectiveNetId, now, runtimeMs, weather, allSessions,
    callNext, callEntry, skipEntry, removeEntry, requestSpeak,
    addIncident, removeIncident, rollCall, generateSummary, exportPdf,
  };
}