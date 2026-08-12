import React from "react";
import { Panel as RPanel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import McvCommandBar from "./McvCommandBar";
import McvV3Panel from "./McvV3Panel";
import McvQuickActionsPanel from "./McvQuickActionsPanel";
import McvOperationsMap from "../missionV2/McvOperationsMap";
import McvCheckins from "../missionV2/McvCheckins";
import McvQueue from "../missionV2/McvQueue";
import McvTrafficLog from "../missionV2/McvTrafficLog";
import McvStationsTable from "../missionV2/McvStationsTable";
import McvIncidents from "../missionV2/McvIncidents";

// McvTablet — the 768–1199px layout. Two columns: a scrollable left control
// column (check-ins, queue, traffic log, incidents) and a right column with a
// large map on top and active stations below. Secondary widgets collapse into
// the left scroll. Touch-friendly resizable divider preserved.
export default function McvTablet({ v2, onEmergency, onSettings, onEnd, onManual, containerRef, setEditing }) {
  const { sortedCheckins, approved, isOperator } = v2;
  return (
    <div className="h-full flex flex-col">
      <McvCommandBar v2={v2} onEmergency={onEmergency} onSettings={onSettings} onEnd={onEnd} onManual={onManual} containerRef={containerRef} />
      <main className="flex-1 min-h-0 p-2">
        <PanelGroup direction="horizontal" className="h-full">
          <RPanel defaultSize={42} minSize={30}>
            <div className="h-full flex flex-col gap-2 pr-1 min-h-0 overflow-y-auto">
              <McvV3Panel title={`Check-ins (${approved.length})`} bodyClass="p-2">
                <McvCheckins checkins={sortedCheckins} isOperator={isOperator} onApprove={v2.approveCheckin} onEditStatus={setEditing} />
              </McvV3Panel>
              <McvQueue v2={v2} />
              <div className="h-64 shrink-0"><McvTrafficLog v2={v2} /></div>
              <McvIncidents v2={v2} />
            </div>
          </RPanel>
          <PanelResizeHandle className="w-1.5 rounded-full bg-white/[0.04] hover:bg-primary/40 transition-colors" />
          <RPanel defaultSize={58} minSize={40}>
            <div className="h-full flex flex-col gap-2 pl-1 min-h-0">
              <div className="flex-1 min-h-0"><McvOperationsMap v2={v2} /></div>
              <div className="h-[38%] min-h-[160px]"><McvV3Panel title="Active Stations" scroll bodyClass="p-2" className="h-full"><McvStationsTable checkins={approved} /></McvV3Panel></div>
            </div>
          </RPanel>
        </PanelGroup>
      </main>
      {isOperator && (
        <div className="shrink-0 border-t border-white/[0.06] bg-[#0b0e11]/90 backdrop-blur-xl">
          <McvQuickActionsPanel v2={v2} onManual={onManual} onSettings={onSettings} />
        </div>
      )}
    </div>
  );
}