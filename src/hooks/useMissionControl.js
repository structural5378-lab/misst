import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useMistUser } from "@/hooks/useMistUser";
import { useAdminAccess } from "@/hooks/useAdminAccess";

/**
 * Shared Mission Control data + operator actions for the Mission Control
 * family of interfaces (mobile MissionControl, Desktop Ops Center, Wallboard).
 * Additive — the existing MissionControl page is unchanged.
 */
export function useMissionControl(netId, { onXp, onUnlock } = {}) {
  const qc = useQueryClient();
  const { mistUser, mybbUser } = useMistUser();
  const { isAdmin } = useAdminAccess();
  const isOperator = isAdmin || mybbUser?.role === "moderator";
  const user = { ...mistUser, ...mybbUser };

  const { data: net } = useQuery({ queryKey: ["net", netId], queryFn: () => base44.entities.Net.filter({ id: netId }), select: (d) => d[0], enabled: !!netId });
  const { data: repeater } = useQuery({ queryKey: ["net-repeater", net?.repeater_callsign], queryFn: () => base44.entities.Repeater.filter({ callsign: net.repeater_callsign }), select: (d) => d[0], enabled: !!net?.repeater_callsign });
  const { data: sessions = [] } = useQuery({ queryKey: ["net-sessions", netId], queryFn: () => base44.entities.NetSession.filter({ net_id: netId }, "-started_at", 20), enabled: !!netId, refetchInterval: 5000 });
  const activeSession = sessions.find((s) => s.status === "active" || s.status === "paused");
  const sid = activeSession?.id;

  const { data: checkins = [] } = useQuery({ queryKey: ["net-log", sid], queryFn: () => base44.entities.NetLog.filter({ session_id: sid }, "checkin_number", 500), enabled: !!sid, refetchInterval: 5000 });
  const { data: queue = [] } = useQuery({ queryKey: ["net-queue", sid], queryFn: () => base44.entities.NetQueueEntry.filter({ session_id: sid }, "position", 200), enabled: !!sid, refetchInterval: 5000 });
  const { data: incidents = [] } = useQuery({ queryKey: ["net-incidents", sid], queryFn: () => base44.entities.NetIncident.filter({ session_id: sid }, "-timestamp", 100), enabled: !!sid, refetchInterval: 5000 });
  const { data: timeline = [] } = useQuery({ queryKey: ["net-timeline", sid], queryFn: () => base44.entities.NetTimeline.filter({ session_id: sid }, "-created_date", 200), enabled: !!sid, refetchInterval: 5000 });

  const sortedCheckins = useMemo(() => {
    const pending = checkins.filter((c) => c.approved === false).sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    const appr = checkins.filter((c) => c.approved !== false).sort((a, b) => (a.checkin_number || 0) - (b.checkin_number || 0));
    return [...pending, ...appr];
  }, [checkins]);
  const approved = checkins.filter((c) => c.approved !== false);
  const activeQueue = queue.filter((q) => q.status === "waiting" || q.status === "called").sort((a, b) => (a.position || 0) - (b.position || 0));

  useEffect(() => {
    const inv = (key) => () => qc.invalidateQueries({ queryKey: key });
    const u1 = base44.entities.NetLog.subscribe(inv(["net-log", sid]));
    const u2 = base44.entities.NetTimeline.subscribe(inv(["net-timeline", sid]));
    const u3 = base44.entities.NetSession.subscribe(inv(["net-sessions", netId]));
    const u4 = base44.entities.NetQueueEntry.subscribe(inv(["net-queue", sid]));
    const u5 = base44.entities.NetIncident.subscribe(inv(["net-incidents", sid]));
    return () => { u1(); u2(); u3(); u4(); u5(); };
  }, [sid, netId, qc]);

  const metrics = {
    total: approved.length,
    late: approved.filter((c) => c.status === "late").length,
    priority: approved.filter((c) => c.status === "priority").length,
    emergency: approved.filter((c) => c.status === "emergency").length,
    visitors: approved.filter((c) => c.status === "visitor").length,
  };

  const addTimeline = async (session, event_type, message, actor = {}) => {
    try { await base44.entities.NetTimeline.create({ session_id: session.id, net_id: netId, event_type, message, actor_name: actor.name || "", actor_avatar: actor.avatar || "", actor_id: actor.id || "" }); } catch {}
  };
  const awardXp = async (userId, userName, action) => {
    if (!userId) return;
    try {
      const res = await base44.functions.invoke("awardNetXp", { user_id: userId, user_name: userName, action });
      if (res?.data?.xpAwarded > 0) onXp?.(res.data.xpAwarded);
      if (res?.data?.newlyUnlocked?.length) onUnlock?.(res.data.newlyUnlocked[0].id);
    } catch {}
  };
  const actionFor = (status) => (status === "visitor" ? "visitor" : status === "emergency" ? "emergency" : status === "priority" ? "priority" : "check_in");

  const startNet = async () => {
    if (!net) return;
    const session = await base44.entities.NetSession.create({
      net_id: netId, net_name: net.name, net_type: net.category || "general",
      frequency: net.frequency, repeater_callsign: net.repeater_callsign || "",
      net_control: mybbUser?.username || mistUser?.full_name || "Net Control",
      net_control_uid: mybbUser?.uid || mistUser?.id || "", net_control_avatar: mybbUser?.avatar || "",
      status: "active", started_at: new Date().toISOString(),
      checkin_count: 0, total_operators: 0, visitors: 0, late_checkins: 0, priority_count: 0, emergency_count: 0, paused_total: 0,
    });
    qc.invalidateQueries({ queryKey: ["net-sessions", netId] });
    addTimeline(session, "net_started", `Net started by ${session.net_control}`, { name: session.net_control, avatar: session.net_control_avatar, id: session.net_control_uid });
  };
  const pauseNet = async () => {
    if (!activeSession) return;
    await base44.entities.NetSession.update(activeSession.id, { status: "paused", paused_at: new Date().toISOString() });
    qc.invalidateQueries({ queryKey: ["net-sessions", netId] });
    addTimeline(activeSession, "net_paused", "Net paused", { name: activeSession.net_control });
  };
  const resumeNet = async () => {
    if (!activeSession) return;
    const add = activeSession.paused_at ? Date.now() - new Date(activeSession.paused_at).getTime() : 0;
    await base44.entities.NetSession.update(activeSession.id, { status: "active", paused_at: null, paused_total: (activeSession.paused_total || 0) + add });
    qc.invalidateQueries({ queryKey: ["net-sessions", netId] });
    addTimeline(activeSession, "net_resumed", "Net resumed", { name: activeSession.net_control });
  };
  const endNet = async () => {
    if (!activeSession) return;
    const ended_at = new Date().toISOString();
    const counters = {
      checkin_count: approved.length, total_operators: approved.length,
      visitors: approved.filter((c) => c.status === "visitor").length,
      late_checkins: approved.filter((c) => c.status === "late").length,
      priority_count: approved.filter((c) => c.status === "priority").length,
      emergency_count: approved.filter((c) => c.status === "emergency").length,
      status: "closed", ended_at, report_generated: true,
    };
    await base44.entities.NetSession.update(activeSession.id, counters);
    addTimeline(activeSession, "net_closed", `Net closed by ${activeSession.net_control}`, { name: activeSession.net_control });
    awardXp(activeSession.net_control_uid, activeSession.net_control, "host_net");
    qc.invalidateQueries({ queryKey: ["net-sessions", netId] });
    return { ...activeSession, ...counters };
  };
  const approveCheckin = async (c) => {
    if (!activeSession) return;
    const nextNum = approved.length + 1;
    await base44.entities.NetLog.update(c.id, { approved: true, checkin_number: nextNum });
    await base44.entities.NetSession.update(activeSession.id, { checkin_count: nextNum });
    addTimeline(activeSession, "checkin", `${c.callsign} checked in`, { name: c.callsign, avatar: c.avatar, id: c.user_id });
    awardXp(c.user_id, c.name || c.callsign, actionFor(c.status));
    qc.invalidateQueries({ queryKey: ["net-log", activeSession.id] });
  };
  const editStatus = async (c, status) => {
    if (!activeSession || c.status === status) return;
    await base44.entities.NetLog.update(c.id, { status });
    if (status === "priority") addTimeline(activeSession, "priority", `Priority traffic: ${c.callsign}`, { name: c.callsign });
    if (status === "emergency") addTimeline(activeSession, "emergency", `Emergency traffic: ${c.callsign}`, { name: c.callsign });
    qc.invalidateQueries({ queryKey: ["net-log", activeSession.id] });
  };
  const manualCheckin = async (data) => {
    if (!activeSession) return;
    const nextNum = approved.length + 1;
    await base44.entities.NetLog.create({
      session_id: activeSession.id, net_name: activeSession.net_name,
      user_id: data.user_id || "", callsign: data.callsign.toUpperCase(), name: data.name || "", avatar: data.avatar || "",
      location: data.location || "", status: data.status || "checked_in", signal_report: data.signal_report || "",
      notes: data.notes || "", distance: data.distance || null, checkin_number: nextNum,
      checked_in_at: new Date().toISOString(), approved: true, is_guest: !!data.is_guest,
    });
    await base44.entities.NetSession.update(activeSession.id, { checkin_count: nextNum });
    addTimeline(activeSession, "checkin", `${data.callsign} checked in`, { name: data.callsign });
    awardXp(data.user_id, data.name || data.callsign, actionFor(data.status));
    qc.invalidateQueries({ queryKey: ["net-log", activeSession.id] });
  };
  const selfCheckin = async (data) => {
    if (!activeSession) return;
    await base44.entities.NetLog.create({
      session_id: activeSession.id, net_name: activeSession.net_name,
      user_id: data.user_id || mistUser?.id || "", callsign: data.callsign.toUpperCase(), name: "", avatar: data.avatar || "",
      location: data.location || "", status: data.status || "checked_in", signal_report: "", notes: data.notes || "",
      checked_in_at: new Date().toISOString(), approved: false, is_guest: false,
    });
    addTimeline(activeSession, "checkin", `${data.callsign} requested check-in`, { name: data.callsign, avatar: data.avatar, id: data.user_id });
    qc.invalidateQueries({ queryKey: ["net-log", activeSession.id] });
  };

  return {
    net, sessions, activeSession, checkins, sortedCheckins, approved, timeline, queue, activeQueue, incidents, repeater,
    metrics, isOperator, user,
    startNet, pauseNet, resumeNet, endNet, approveCheckin, editStatus, manualCheckin, selfCheckin,
  };
}