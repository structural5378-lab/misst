import React from "react";
import { Panel as RPanel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import McvCommandBar from "./McvCommandBar";
import McvV3Panel from "./McvV3Panel";
import McvAnalytics from "./McvAnalytics";
import McvMissionStats from "./McvMissionStats";
import McvQuickActionsPanel from "./McvQuickActionsPanel";
import McvSystemHealth from "./McvSystemHealth";
import McvOperationsMap from "../missionV2/McvOperationsMap";
import McvCheckins from "../missionV2/McvCheckins";
import McvQueue from "../missionV2/McvQueue";
import McvTrafficLog from "../missionV2/McvTrafficLog";
import McvStationsTable from "../missionV2/McvStationsTable";
import McvIncidents from "../missionV2/McvIncidents";
import McvWeather from "../missionV2/McvWeather";
import McvAiAssistant from "../missionV2/McvAiAssistant";

// McvDesktop — the 1200px+ Emergency Operations Center. Full-bleed, no max
// width: top command bar, a resizable 3-column main row (left sidebar · large
// map · right sidebar), and a resizable bottom section (traffic log · active
// stations · analytics). All panels resize; everything stays visible with
// minimal scrolling. Scales naturally to ultrawide/4K (panels expand to fill).
const Handle = () => <PanelResizeHandle className="w-1.5 rounded-full bg-white/[0.04] hover:bg-primary/40 transition-colors" />;

export default function McvDesktop({ v2, onEmergency, onSettings, onEnd, onManual, containerRef, setEditing }) {
  const { sortedCheckins, approved, isOperator } = v2;
  return (
    <div className="h-full flex flex-col">
      <McvCommandBar v2={v2} onEmergency={onEmergency} onSettings={onSettings} onEnd={onEnd} containerRef={containerRef} />

      <main className="flex-1 min-h-0 p-2">
        <PanelGroup direction="horizontal" className="h-full">
          {/* LEFT SIDEBAR — check-ins, queue, mission stats */}
          <RPanel defaultSize={20} minSize={15} maxSize={30}>
            <div className="h-full flex flex-col gap-2 pr-1 min-h-0">
              <McvV3Panel title={`Check-ins (${approved.length})`} scroll bodyClass="p-2" className="flex-1 min-h-0">
                <McvCheckins checkins={sortedCheckins} isOperator={isOperator} onApprove={v2.approveCheckin} onEditStatus={setEditing} />
              </McvV3Panel>
              <div className="shrink-0"><McvQueue v2={v2} /></div>
              <div className="shrink-0"><McvV3Panel title="Mission Statistics"><McvMissionStats v2={v2} /></McvV3Panel></div>
            </div>
          </RPanel>
          <Handle />

          {/* CENTER — large live RadioScope map (dominant) */}
          <RPanel defaultSize={55} minSize={38}>
            <div className="h-full px-1"><McvOperationsMap v2={v2} /></div>
          </RPanel>
          <Handle />

          {/* RIGHT SIDEBAR — incidents, weather, quick actions, AI, system health */}
          <RPanel defaultSize={25} minSize={18} maxSize={34}>
            <div className="h-full flex flex-col gap-2 pl-1 min-h-0 overflow-y-auto">
              <McvIncidents v2={v2} />
              <McvWeather v2={v2} />
              <McvV3Panel title="Quick Actions"><McvQuickActionsPanel v2={v2} onManual={onManual} onSettings={onSettings} /></McvV3Panel>
              <div id="mcv-ai-panel"><McvAiAssistant v2={v2} /></div>
              <McvV3Panel title="System Health"><McvSystemHealth v2={v2} /></McvV3Panel>
            </div>
          </RPanel>
        </PanelGroup>
      </main>

      {/* BOTTOM SECTION — traffic log · active stations · analytics */}
      <section className="h-[32%] min-h-[180px] px-2 pb-2">
        <PanelGroup direction="horizontal" className="h-full">
          <RPanel defaultSize={40} minSize={25}><div className="h-full pr-1"><McvTrafficLog v2={v2} /></div></RPanel>
          <Handle />
          <RPanel defaultSize={40} minSize={25}><div className="h-full px-1"><McvV3Panel title="Active Stations" scroll bodyClass="p-2" className="h-full"><McvStationsTable checkins={approved} /></McvV3Panel></div></RPanel>
          <Handle />
          <RPanel defaultSize={20} minSize={15}><div className="h-full pl-1"><McvV3Panel title="Analytics" className="h-full"><McvAnalytics v2={v2} /></McvV3Panel></div></RPanel>
        </PanelGroup>
      </section>
    </div>
  );
}