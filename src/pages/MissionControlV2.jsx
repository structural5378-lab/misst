import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Panel as RPanel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useMissionControlV2 } from "@/hooks/useMissionControlV2";
import { Radio, Play } from "lucide-react";
import McvHeader from "@/components/missionV2/McvHeader";
import McvCheckins from "@/components/missionV2/McvCheckins";
import McvQueue from "@/components/missionV2/McvQueue";
import McvTrafficLog from "@/components/missionV2/McvTrafficLog";
import McvStationsTable from "@/components/missionV2/McvStationsTable";
import McvIncidents from "@/components/missionV2/McvIncidents";
import McvWeather from "@/components/missionV2/McvWeather";
import McvAiAssistant from "@/components/missionV2/McvAiAssistant";
import McvQuickActions from "@/components/missionV2/McvQuickActions";
import McvFooterNav from "@/components/missionV2/McvFooterNav";
import McvManualCheckin from "@/components/missionV2/McvManualCheckin";
import McvNetPicker from "@/components/missionV2/McvNetPicker";
import McvOperationsMap from "@/components/missionV2/McvOperationsMap";
import { Panel, ResourcesPanel, ReportsPanel, SettingsPanel, ReportPanel } from "@/components/missionV2/McvPanels";
import MissionStatusSheet from "@/components/mission/MissionStatusSheet";
import XpToast from "@/components/mission/XpToast";
import UnlockCelebration from "@/components/achievements/UnlockCelebration";

// Mission Control V3 — Desktop Operations Center. A fixed, high-density,
// 3-column command console optimized for Net Control on large monitors.
// Left: check-ins + transmit queue. Center (dominant): large Operations Map
// + live traffic log + active stations. Right: incident command + weather +
// AI assistant. Reuses the existing backend (NetSession/NetLog/NetTimeline/
// NetQueueEntry/NetIncident) via useMissionControl + the V2 augmentation hook.
export default function MissionControlV2() {
  const { netId } = useParams();
  const navigate = useNavigate();
  const [xpToast, setXpToast] = useState(null);
  const [unlock, setUnlock] = useState(null);
  const [view, setView] = useState("dashboard");
  const [showManual, setShowManual] = useState(false);
  const [editing, setEditing] = useState(null);
  const [report, setReport] = useState(null);
  const v2 = useMissionControlV2(netId, { onXp: setXpToast, onUnlock: setUnlock });
  const { effectiveNetId, activeSession, net, isOperator, sortedCheckins, approved, endNet } = v2;

  if (!effectiveNetId) return <McvNetPicker />;

  if (!activeSession) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-violet-500/15 flex items-center justify-center mb-3"><Radio className="w-7 h-7 text-violet-300" /></div>
        <h1 className="text-lg font-bold">{net?.name || "Mission Control"}</h1>
        <p className="text-sm text-muted-foreground mt-1">No active net session.</p>
        {isOperator ? (
          <button onClick={v2.startNet} className="mt-4 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-white font-bold active:scale-95"><Play className="w-4 h-4" /> Start Net</button>
        ) : (
          <p className="text-xs text-muted-foreground mt-3">Check back when Net Control opens the net.</p>
        )}
        <button onClick={() => navigate("/net-control")} className="mt-4 text-xs text-violet-400">← Choose another net</button>
      </div>
    );
  }

  const onEnd = async () => { if (!window.confirm("End the net and generate the after-action report?")) return; const r = await endNet(); if (r) setReport(r); };
  const onManual = (data) => { v2.manualCheckin(data); setShowManual(false); };

  return (
    <div className="lg:h-screen lg:overflow-hidden bg-[#0b0e14] text-foreground flex flex-col">
      <McvHeader v2={v2} onEmergency={() => v2.addIncident("emergency", "Emergency traffic declared")} onSettings={() => setView("settings")} />

      <main className="flex-1 min-h-0 p-2">
        {view === "dashboard" && (
          <>
            {/* ── Desktop Operations Center: resizable 3-column ── */}
            <div className="hidden lg:block h-full">
              <PanelGroup direction="horizontal">
                {/* LEFT: Check-ins + Queue */}
                <RPanel defaultSize={22} minSize={16} maxSize={34}>
                  <div className="h-full flex flex-col gap-2 pr-px">
                    <div className="flex-1 min-h-0">
                      <Panel title={`Check-ins (${approved.length})`} fill>
                        <McvCheckins checkins={sortedCheckins} isOperator={isOperator} onApprove={v2.approveCheckin} onEditStatus={setEditing} />
                      </Panel>
                    </div>
                    <div className="shrink-0">
                      <McvQueue v2={v2} />
                    </div>
                  </div>
                </RPanel>
                <PanelResizeHandle className="w-1.5 mx-px rounded-full bg-white/[0.04] hover:bg-primary/40 transition-colors" />
                {/* CENTER: Map (dominant) + Traffic Log + Active Stations */}
                <RPanel defaultSize={54} minSize={38}>
                  <div className="h-full flex flex-col gap-2 px-px">
                    <div className="flex-1 min-h-0">
                      <McvOperationsMap v2={v2} />
                    </div>
                    <div className="h-[26%] min-h-0">
                      <McvTrafficLog v2={v2} />
                    </div>
                    <div className="h-[18%] min-h-0">
                      <Panel title="Active Stations" fill>
                        <McvStationsTable checkins={approved} />
                      </Panel>
                    </div>
                  </div>
                </RPanel>
                <PanelResizeHandle className="w-1.5 mx-px rounded-full bg-white/[0.04] hover:bg-primary/40 transition-colors" />
                {/* RIGHT: Incidents + Weather + AI */}
                <RPanel defaultSize={24} minSize={18} maxSize={36}>
                  <div className="h-full flex flex-col gap-2 pl-px overflow-y-auto">
                    <McvIncidents v2={v2} />
                    <McvWeather v2={v2} />
                    <McvAiAssistant v2={v2} />
                  </div>
                </RPanel>
              </PanelGroup>
            </div>

            {/* ── Mobile: stacked ── */}
            <div className="lg:hidden space-y-3">
              <Panel title={`Check-ins (${approved.length})`} fill>
                <McvCheckins checkins={sortedCheckins} isOperator={isOperator} onApprove={v2.approveCheckin} onEditStatus={setEditing} />
              </Panel>
              <McvQueue v2={v2} />
              <div className="h-[55vh]"><McvOperationsMap v2={v2} /></div>
              <div className="h-[45vh]"><McvTrafficLog v2={v2} /></div>
              <div className="h-[40vh]"><Panel title="Active Stations" fill><McvStationsTable checkins={approved} /></Panel></div>
              <McvIncidents v2={v2} />
              <McvWeather v2={v2} />
              <McvAiAssistant v2={v2} />
            </div>
          </>
        )}
        {view === "traffic" && <div className="h-[80vh]"><McvTrafficLog v2={v2} full /></div>}
        {view === "checkins" && <Panel title={`Check-ins (${approved.length})`} fill><McvCheckins checkins={sortedCheckins} isOperator={isOperator} onApprove={v2.approveCheckin} onEditStatus={setEditing} /></Panel>}
        {view === "map" && <div className="h-[80vh]"><McvOperationsMap v2={v2} /></div>}
        {view === "incidents" && <McvIncidents v2={v2} />}
        {view === "resources" && <ResourcesPanel />}
        {view === "reports" && <ReportsPanel v2={v2} onExport={v2.exportPdf} />}
        {view === "settings" && <SettingsPanel v2={v2} onEnd={onEnd} />}
      </main>

      <McvQuickActions v2={v2} onManual={() => setShowManual(true)} onEnd={onEnd} />
      <McvFooterNav view={view} setView={setView} now={v2.now} />

      {showManual && <McvManualCheckin onSubmit={onManual} onClose={() => setShowManual(false)} />}
      {editing && <MissionStatusSheet checkin={editing} onUpdate={(s) => { v2.editStatus(editing, s); setEditing(null); }} onClose={() => setEditing(null)} />}
      {report && <ReportPanel report={report} checkins={v2.checkins} onClose={() => setReport(null)} />}
      <XpToast amount={xpToast} onDone={() => setXpToast(null)} />
      {unlock && <UnlockCelebration achievementId={unlock} onClose={() => setUnlock(null)} onShare={() => setUnlock(null)} />}
    </div>
  );
}