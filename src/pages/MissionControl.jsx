import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useMistUser } from "@/hooks/useMistUser";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Radio, ListChecks, Activity, BarChart3, ArrowLeft, MapPin } from "lucide-react";
import MissionHeader from "@/components/mission/MissionHeader";
import MissionMetrics from "@/components/mission/MissionMetrics";
import MissionCheckinList from "@/components/mission/MissionCheckinList";
import MissionTimeline from "@/components/mission/MissionTimeline";
import MissionStats from "@/components/mission/MissionStats";
import SelfCheckinPanel from "@/components/mission/SelfCheckinPanel";
import ManualCheckinModal from "@/components/mission/ManualCheckinModal";
import AfterActionReport from "@/components/mission/AfterActionReport";
import NetControlBar from "@/components/mission/NetControlBar";
import MissionInfoGrid from "@/components/mission/MissionInfoGrid";
import MissionMap from "@/components/mission/MissionMap";
import MissionStatusSheet from "@/components/mission/MissionStatusSheet";
import XpToast from "@/components/mission/XpToast";
import UnlockCelebration from "@/components/achievements/UnlockCelebration";

const TABS = [
  { key: "checkins", label: "Check-ins", Icon: ListChecks },
  { key: "map", label: "Map", Icon: MapPin },
  { key: "timeline", label: "Timeline", Icon: Activity },
  { key: "stats", label: "Stats", Icon: BarChart3 },
];

export default function MissionControl() {
  const { netId } = useParams();
  const navigate = useNavigate();
  const { mistUser, mybbUser } = useMistUser();
  const { isAdmin } = useAdminAccess();
  const isOperator = isAdmin || mybbUser?.role === "moderator";
  const qc = useQueryClient();
  const [tab, setTab] = useState("checkins");
  const [showManual, setShowManual] = useState(false);
  const [report, setReport] = useState(null);
  const [posting, setPosting] = useState(false);
  const [editing, setEditing] = useState(null);
  const [xpToast, setXpToast] = useState(null);
  const [unlock, setUnlock] = useState(null);

  const { data: net } = useQuery({
    queryKey: ["net", netId],
    queryFn: () => base44.entities.Net.filter({ id: netId }),
    select: (d) => d[0],
    enabled: !!netId,
  });

  const { data: repeater } = useQuery({
    queryKey: ["net-repeater", net?.repeater_callsign],
    queryFn: () => base44.entities.Repeater.filter({ callsign: net.repeater_callsign }),
    select: (d) => d[0],
    enabled: !!net?.repeater_callsign,
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ["net-sessions", netId],
    queryFn: () => base44.entities.NetSession.filter({ net_id: netId }, "-started_at", 20),
    enabled: !!netId,
  });
  const activeSession = sessions.find((s) => s.status === "active" || s.status === "paused");

  const { data: checkins = [] } = useQuery({
    queryKey: ["net-log", activeSession?.id],
    queryFn: () => base44.entities.NetLog.filter({ session_id: activeSession.id }, "checkin_number", 500),
    enabled: !!activeSession?.id,
  });

  const sortedCheckins = useMemo(() => {
    const pending = checkins.filter((c) => c.approved === false).sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    const approved = checkins.filter((c) => c.approved !== false).sort((a, b) => (a.checkin_number || 0) - (b.checkin_number || 0));
    return [...pending, ...approved];
  }, [checkins]);

  const { data: timeline = [] } = useQuery({
    queryKey: ["net-timeline", activeSession?.id],
    queryFn: () => base44.entities.NetTimeline.filter({ session_id: activeSession.id }, "-created_date", 200),
    enabled: !!activeSession?.id,
  });

  // Realtime
  useEffect(() => {
    const u1 = base44.entities.NetLog.subscribe(() => { if (activeSession?.id) qc.invalidateQueries({ queryKey: ["net-log", activeSession.id] }); });
    const u2 = base44.entities.NetTimeline.subscribe(() => { if (activeSession?.id) qc.invalidateQueries({ queryKey: ["net-timeline", activeSession.id] }); });
    const u3 = base44.entities.NetSession.subscribe(() => { if (netId) qc.invalidateQueries({ queryKey: ["net-sessions", netId] }); });
    return () => { u1(); u2(); u3(); };
  }, [activeSession?.id, netId, qc]);

  const approved = checkins.filter((c) => c.approved !== false);
  const metrics = {
    total: approved.length,
    late: approved.filter((c) => c.status === "late").length,
    priority: approved.filter((c) => c.status === "priority").length,
    emergency: approved.filter((c) => c.status === "emergency").length,
  };

  const addTimeline = async (session, event_type, message, actor = {}) => {
    try {
      await base44.entities.NetTimeline.create({
        session_id: session.id, net_id: netId, event_type, message,
        actor_name: actor.name || "", actor_avatar: actor.avatar || "", actor_id: actor.id || "",
      });
    } catch {}
  };

  const awardXp = async (userId, userName, action) => {
    if (!userId) return;
    try {
      const res = await base44.functions.invoke("awardNetXp", { user_id: userId, user_name: userName, action });
      if (res?.data?.xpAwarded > 0) setXpToast(res.data.xpAwarded);
      if (res?.data?.newlyUnlocked?.length) setUnlock(res.data.newlyUnlocked[0].id);
    } catch {}
  };

  const actionFor = (status) => (status === "visitor" ? "visitor" : status === "emergency" ? "emergency" : status === "priority" ? "priority" : "check_in");

  const startNet = async () => {
    if (!net) return;
    const session = await base44.entities.NetSession.create({
      net_id: netId, net_name: net.name, net_type: net.category || "general",
      frequency: net.frequency, repeater_callsign: net.repeater_callsign || "",
      net_control: mybbUser?.username || mistUser?.full_name || "Net Control",
      net_control_uid: mybbUser?.uid || mistUser?.id || "",
      net_control_avatar: mybbUser?.avatar || "",
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
    const paused_total = (activeSession.paused_total || 0) + add;
    await base44.entities.NetSession.update(activeSession.id, { status: "active", paused_at: null, paused_total });
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
    setReport({ ...activeSession, ...counters });
  };

  const approveCheckin = async (c) => {
    const nextNum = approved.length + 1;
    await base44.entities.NetLog.update(c.id, { approved: true, checkin_number: nextNum });
    await base44.entities.NetSession.update(activeSession.id, { checkin_count: nextNum });
    addTimeline(activeSession, "checkin", `${c.callsign} checked in`, { name: c.callsign, avatar: c.avatar, id: c.user_id });
    awardXp(c.user_id, c.name || c.callsign, actionFor(c.status));
    qc.invalidateQueries({ queryKey: ["net-log", activeSession.id] });
  };

  const handleEditStatus = async (c, status) => {
    if (!activeSession || c.status === status) return setEditing(null);
    await base44.entities.NetLog.update(c.id, { status });
    if (status === "priority") addTimeline(activeSession, "priority", `Priority traffic: ${c.callsign}`, { name: c.callsign });
    if (status === "emergency") addTimeline(activeSession, "emergency", `Emergency traffic: ${c.callsign}`, { name: c.callsign });
    qc.invalidateQueries({ queryKey: ["net-log", activeSession.id] });
    setEditing(null);
  };

  const handleManual = async (data) => {
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
    setShowManual(false);
  };

  const handleSelf = async (data) => {
    await base44.entities.NetLog.create({
      session_id: activeSession.id, net_name: activeSession.net_name,
      user_id: data.user_id || mistUser?.id || "", callsign: data.callsign.toUpperCase(), name: "", avatar: data.avatar || "",
      location: data.location || "", status: data.status || "checked_in", signal_report: "", notes: data.notes || "",
      checked_in_at: new Date().toISOString(), approved: false, is_guest: false,
    });
    addTimeline(activeSession, "checkin", `${data.callsign} requested check-in`, { name: data.callsign, avatar: data.avatar, id: data.user_id });
    qc.invalidateQueries({ queryKey: ["net-log", activeSession.id] });
  };

  const postToForum = async () => {
    if (!report) return;
    setPosting(true);
    const started = report.started_at ? new Date(report.started_at).toLocaleString() : "";
    const rows = approved.map((l) => `#${l.checkin_number} | ${l.callsign} | ${l.location || "-"} | ${l.signal_report || "-"} | ${l.notes || "-"}`).join("\n");
    const message = `[b]Net Session Log[/b]\n[b]Net:[/b] ${report.net_name}\n[b]Net Control:[/b] ${report.net_control}\n[b]Date:[/b] ${started}\n[b]Check-ins:[/b] ${approved.length}\n\n[code]# | Callsign | Location | Signal | Notes\n${rows}[/code]`;
    try {
      const res = await base44.functions.invoke("fetchMyBBForums", { action: "create_thread", fid: 18, subject: `Net Log: ${report.net_name} – ${started}`, message, bot_username: report.net_control });
      if (res.data?.tid) {
        await base44.entities.NetSession.update(report.id, { forum_thread_id: String(res.data.tid) });
        setReport({ ...report, forum_thread_id: String(res.data.tid) });
        qc.invalidateQueries({ queryKey: ["net-sessions", netId] });
      }
    } catch {}
    setPosting(false);
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[30rem] h-72 bg-violet-500/15 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-white/[0.06] px-4 py-3 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-1.5 -ml-1 text-violet-300 hover:text-violet-200"><ArrowLeft className="w-5 h-5" /></button>
        <span className="text-xs font-bold tracking-[0.25em] text-violet-300/80 uppercase">Mission Control</span>
        <Link to="/nets" className="p-1.5 -mr-1 text-violet-300/60 hover:text-violet-200"><Radio className="w-5 h-5" /></Link>
      </div>

      <div className="px-4 pt-4 space-y-4 max-w-2xl mx-auto">
        <MissionHeader net={net} session={activeSession} />
        {activeSession && <MissionInfoGrid net={net} session={activeSession} repeater={repeater} visitors={approved.filter((c) => c.status === "visitor").length} />}
        {activeSession && <MissionMetrics values={metrics} />}

        {isOperator && (
          <div className="mist-fade-up">
            <NetControlBar
              session={activeSession}
              onStart={startNet}
              onPause={pauseNet}
              onResume={resumeNet}
              onEnd={endNet}
              onManual={() => setShowManual(true)}
            />
          </div>
        )}

        {!isOperator && activeSession && (
          <SelfCheckinPanel onSubmit={handleSelf} user={{ ...mistUser, ...mybbUser }} />
        )}

        {!activeSession && (
          <div className="rounded-2xl bg-card/60 border border-white/[0.06] p-8 text-center">
            <Radio className="w-10 h-10 text-violet-400/60 mx-auto mb-3" />
            <p className="text-sm font-semibold text-foreground">No Active Net Session</p>
            <p className="text-xs text-muted-foreground mt-1">
              {isOperator ? "Press Start Net to open the console." : "Check back when Net Control opens the net."}
            </p>
          </div>
        )}

        {activeSession && (
          <>
            <div className="flex gap-2 p-1 rounded-2xl bg-card/60 border border-white/[0.06]">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition ${tab === t.key ? "bg-violet-500/20 text-violet-200 border border-violet-500/30" : "text-muted-foreground"}`}
                >
                  <t.Icon className="w-3.5 h-3.5" /> {t.label}
                </button>
              ))}
            </div>

            <div className="mist-fade-up">
              {tab === "checkins" && <MissionCheckinList checkins={sortedCheckins} isOperator={isOperator} onApprove={approveCheckin} onEditStatus={setEditing} />}
              {tab === "map" && <MissionMap checkins={approved} repeater={repeater} netControlUid={activeSession.net_control_uid} />}
              {tab === "timeline" && <MissionTimeline events={timeline} />}
              {tab === "stats" && <MissionStats checkins={checkins} session={activeSession} />}
            </div>
          </>
        )}
      </div>

      {showManual && <ManualCheckinModal onSubmit={handleManual} onClose={() => setShowManual(false)} />}
      {editing && <MissionStatusSheet checkin={editing} onUpdate={(s) => handleEditStatus(editing, s)} onClose={() => setEditing(null)} />}
      {report && <AfterActionReport session={report} checkins={checkins} timeline={timeline} onClose={() => setReport(null)} onPostForum={postToForum} posting={posting} />}
      <XpToast amount={xpToast} onDone={() => setXpToast(null)} />
      {unlock && <UnlockCelebration achievementId={unlock} onClose={() => setUnlock(null)} onShare={() => setUnlock(null)} />}
    </div>
  );
}