import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import McvMap from "@/components/missionV2/McvMap";
import { Panel, ResourcesPanel, ReportsPanel, SettingsPanel, ReportPanel } from "@/components/missionV2/McvPanels";
import MissionStatusSheet from "@/components/mission/MissionStatusSheet";
import XpToast from "@/components/mission/XpToast";
import UnlockCelebration from "@/components/achievements/UnlockCelebration";

// Mission Control V2 — the single command center for all live net operations.
// Reuses the existing backend (NetSession/NetLog/NetTimeline/NetQueueEntry/
// NetIncident) via useMissionControl + the V2 augmentation hook. Layout matches
// the provided mockup: header + status ticker, 3-column dashboard, quick actions,
// and footer nav. Replaces all legacy Mission Control / Net Control pages.
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
    <div className="min-h-screen bg-background flex flex-col">
      <McvHeader v2={v2} onEmergency={() => v2.addIncident("emergency", "Emergency traffic declared")} onSettings={() => setView("settings")} />

      <main className="flex-1 p-3 lg:p-4 max-w-screen-2xl w-full mx-auto">
        {view === "dashboard" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            <div className="lg:col-span-4 space-y-3">
              <Panel title={`Check-ins (${approved.length})`}><McvCheckins checkins={sortedCheckins} isOperator={isOperator} onApprove={v2.approveCheckin} onEditStatus={setEditing} /></Panel>
              <McvQueue v2={v2} />
            </div>
            <div className="lg:col-span-5 space-y-3">
              <McvTrafficLog v2={v2} />
              <Panel title="Active Stations"><McvStationsTable checkins={approved} /></Panel>
            </div>
            <div className="lg:col-span-3 space-y-3">
              <McvIncidents v2={v2} />
              <McvWeather v2={v2} />
              <McvAiAssistant v2={v2} />
            </div>
          </div>
        )}
        {view === "traffic" && <McvTrafficLog v2={v2} full />}
        {view === "checkins" && <Panel title={`Check-ins (${approved.length})`}><McvCheckins checkins={sortedCheckins} isOperator={isOperator} onApprove={v2.approveCheckin} onEditStatus={setEditing} /></Panel>}
        {view === "map" && <McvMap v2={v2} />}
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