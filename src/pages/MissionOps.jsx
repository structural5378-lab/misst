import React, { useState, useEffect, Fragment } from "react";
import { useParams, Link } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useMissionControl } from "@/hooks/useMissionControl";
import { useMistUser } from "@/hooks/useMistUser";
import { ListChecks, Mic, MapPin, Siren, Activity, BarChart3, Zap, GripVertical, Maximize, Minimize, Tv, RotateCcw, ArrowLeft, Radio } from "lucide-react";
import MissionCheckinList from "@/components/mission/MissionCheckinList";
import MissionQueue from "@/components/mission/MissionQueue";
import MissionMap from "@/components/mission/MissionMap";
import MissionIncidents from "@/components/mission/MissionIncidents";
import MissionTimeline from "@/components/mission/MissionTimeline";
import MissionStats from "@/components/mission/MissionStats";
import NetControlBar from "@/components/mission/NetControlBar";
import ManualCheckinModal from "@/components/mission/ManualCheckinModal";
import MissionStatusSheet from "@/components/mission/MissionStatusSheet";
import AfterActionReport from "@/components/mission/AfterActionReport";
import XpToast from "@/components/mission/XpToast";
import UnlockCelebration from "@/components/achievements/UnlockCelebration";

const DEFAULT_LAYOUT = [["attendance", "queue"], ["map", "stats"], ["incidents", "timeline", "quick"]];
const STORAGE = (uid) => `mist-ops-layout-${uid || "default"}`;

export default function MissionOps() {
  const { netId } = useParams();
  const { mistUser } = useMistUser();
  const uid = mistUser?.uid || mistUser?.id || "default";

  const [xpToast, setXpToast] = useState(null);
  const [unlock, setUnlock] = useState(null);
  const mc = useMissionControl(netId, { onXp: setXpToast, onUnlock: setUnlock });
  const { net, activeSession, sortedCheckins, approved, timeline, activeQueue, incidents, repeater, isOperator, user, startNet, pauseNet, resumeNet, endNet, approveCheckin, editStatus, manualCheckin } = mc;

  const [showManual, setShowManual] = useState(false);
  const [editing, setEditing] = useState(null);
  const [report, setReport] = useState(null);
  const [isFs, setIsFs] = useState(false);

  const [layout, setLayout] = useState(() => {
    try { const s = localStorage.getItem(STORAGE(uid)); if (s) return JSON.parse(s); } catch {}
    return DEFAULT_LAYOUT.map((c) => [...c]);
  });
  useEffect(() => { localStorage.setItem(STORAGE(uid), JSON.stringify(layout)); }, [layout, uid]);

  useEffect(() => {
    const h = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);
  const toggleFs = () => { if (!document.fullscreenElement) document.documentElement.requestFullscreen?.(); else document.exitFullscreen?.(); };

  const statusBadge = activeSession ? (activeSession.status === "active" ? { label: "LIVE", cls: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" } : { label: "PAUSED", cls: "bg-amber-500/20 text-amber-300 border-amber-500/40" }) : { label: "STANDBY", cls: "bg-slate-500/20 text-slate-300 border-slate-500/40" };

  const WIDGETS = {
    attendance: { title: "Live Attendance", Icon: ListChecks, body: () => <MissionCheckinList checkins={sortedCheckins} isOperator={isOperator} onApprove={approveCheckin} onEditStatus={setEditing} /> },
    queue: { title: "Speaking Queue", Icon: Mic, body: () => <MissionQueue session={activeSession} isOperator={isOperator} user={user} /> },
    map: { title: "Live Map", Icon: MapPin, body: () => <MissionMap checkins={approved} repeater={repeater} netControlUid={activeSession?.net_control_uid} /> },
    incidents: { title: "Incident Log", Icon: Siren, body: () => (activeSession ? <MissionIncidents session={activeSession} isOperator={isOperator} user={user} /> : <Empty text="No active net." />) },
    timeline: { title: "Net Timeline", Icon: Activity, body: () => <MissionTimeline events={timeline} /> },
    stats: { title: "Statistics", Icon: BarChart3, body: () => (activeSession ? <MissionStats checkins={mc.checkins} session={activeSession} /> : <Empty text="No active net." />) },
    quick: { title: "Quick Actions", Icon: Zap, body: () => (
      <div className="space-y-3">
        <NetControlBar session={activeSession} onStart={startNet} onPause={pauseNet} onResume={resumeNet} onEnd={async () => { const r = await endNet(); if (r) setReport(r); }} onManual={() => setShowManual(true)} />
        <div className="grid grid-cols-2 gap-2">
          <Link to={`/nets/${netId}/wallboard`} className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-card border border-white/[0.06] text-xs font-semibold hover:border-primary/30"><Tv className="w-4 h-4 text-primary" /> Wallboard</Link>
          <Link to={`/nets/${netId}/display`} className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-card border border-white/[0.06] text-xs font-semibold hover:border-primary/30"><Monitor2 /> Display</Link>
          <Link to={`/nets/${netId}/control`} className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-card border border-white/[0.06] text-xs font-semibold hover:border-primary/30"><Radio className="w-4 h-4 text-primary" /> Mobile</Link>
          <button onClick={toggleFs} className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-card border border-white/[0.06] text-xs font-semibold hover:border-primary/30">{isFs ? <Minimize className="w-4 h-4 text-primary" /> : <Maximize className="w-4 h-4 text-primary" />} {isFs ? "Exit FS" : "Fullscreen"}</button>
        </div>
      </div>
    ) },
  };

  const onDragEnd = (res) => {
    if (!res.destination) return;
    const sCol = +res.source.droppableId, sIdx = res.source.index;
    const dCol = +res.destination.droppableId, dIdx = res.destination.index;
    if (sCol === dCol && sIdx === dIdx) return;
    const next = layout.map((c) => [...c]);
    const [moved] = next[sCol].splice(sIdx, 1);
    next[dCol].splice(dIdx, 0, moved);
    setLayout(next);
  };

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      {/* Toolbar */}
      <header className="shrink-0 bg-card/70 backdrop-blur-xl border-b border-white/[0.06] px-4 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link to={`/nets/${netId}/control`} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"><ArrowLeft className="w-4 h-4" /></Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold tracking-tight truncate">{net?.name || "Operations Center"}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusBadge.cls}`}>{statusBadge.label}</span>
            </div>
            <p className="text-[10px] text-muted-foreground truncate">{activeSession?.net_control ? `NC: ${activeSession.net_control}` : "No active session"} {activeSession?.community_name ? `· ${activeSession.community_name}` : ""}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => setLayout(DEFAULT_LAYOUT.map((c) => [...c]))} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-white/[0.06] text-xs font-semibold hover:border-primary/30" title="Reset layout"><RotateCcw className="w-3.5 h-3.5" /> Reset</button>
          <Link to={`/nets/${netId}/wallboard`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs font-semibold" title="Wallboard"><Tv className="w-3.5 h-3.5" /> Wallboard</Link>
          <button onClick={toggleFs} className="p-1.5 rounded-lg bg-card border border-white/[0.06] text-muted-foreground hover:text-foreground" title="Fullscreen">{isFs ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}</button>
        </div>
      </header>

      {/* Operator controls */}
      {isOperator && (
        <div className="shrink-0 px-4 py-2 border-b border-white/[0.06] bg-card/40">
          <NetControlBar session={activeSession} onStart={startNet} onPause={pauseNet} onResume={resumeNet} onEnd={async () => { const r = await endNet(); if (r) setReport(r); }} onManual={() => setShowManual(true)} />
        </div>
      )}

      {/* Panels */}
      <main className="flex-1 min-h-0">
        <DragDropContext onDragEnd={onDragEnd}>
          <PanelGroup direction="horizontal" className="h-full">
            {layout.map((col, ci) => (
              <Fragment key={ci}>
                {ci > 0 && <PanelResizeHandle className="w-1.5 bg-border/30 hover:bg-primary/40 transition-colors" />}
                <Panel defaultSize={Math.floor(100 / layout.length)} minSize={18} className="min-w-0">
                  <Droppable droppableId={String(ci)}>
                    {(prov) => (
                      <div ref={prov.innerRef} {...prov.droppableProps} className="h-full overflow-y-auto p-3 space-y-3">
                        {col.map((wid, wi) => {
                          const W = WIDGETS[wid];
                          if (!W) return null;
                          return (
                            <Draggable key={wid} draggableId={wid} index={wi}>
                              {(p) => (
                                <div ref={p.innerRef} {...p.draggableProps} className="rounded-2xl bg-card/60 border border-white/[0.06] flex flex-col">
                                  <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06] cursor-grab active:cursor-grabbing" {...p.dragHandleProps}>
                                    <GripVertical className="w-4 h-4 text-muted-foreground/60" />
                                    <W.Icon className="w-4 h-4 text-primary" />
                                    <span className="text-xs font-bold uppercase tracking-wide">{W.title}</span>
                                  </div>
                                  <div className="p-3">{W.body()}</div>
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                        {prov.placeholder}
                      </div>
                    )}
                  </Droppable>
                </Panel>
              </Fragment>
            ))}
          </PanelGroup>
        </DragDropContext>
      </main>

      {showManual && <ManualCheckinModal onSubmit={manualCheckin} onClose={() => setShowManual(false)} />}
      {editing && <MissionStatusSheet checkin={editing} onUpdate={(s) => { editStatus(editing, s); setEditing(null); }} onClose={() => setEditing(null)} />}
      {report && <AfterActionReport session={report} checkins={mc.checkins} timeline={timeline} onClose={() => setReport(null)} onPostForum={() => {}} posting={false} />}
      <XpToast amount={xpToast} onDone={() => setXpToast(null)} />
      {unlock && <UnlockCelebration achievementId={unlock} onClose={() => setUnlock(null)} onShare={() => setUnlock(null)} />}
    </div>
  );
}

function Monitor2() { return <Maximize className="w-4 h-4 text-primary" />; }
function Empty({ text }) { return <div className="text-sm text-muted-foreground py-8 text-center">{text}</div>; }