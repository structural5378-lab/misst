import React, { useEffect, useRef, useState } from "react";
import { Panel as RPanel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { X, Maximize2, Search, Pause, Play } from "lucide-react";
import McvCommandBar from "./McvCommandBar";
import McvPanelChrome from "./McvPanelChrome";
import McvKpiDashboard from "./McvKpiDashboard";
import McvQuickActionsPanel from "./McvQuickActionsPanel";
import McvSystemHealth from "./McvSystemHealth";
import McvMissionStats from "./McvMissionStats";
import McvOperationsMap from "../missionV2/McvOperationsMap";
import McvCheckins from "../missionV2/McvCheckins";
import McvQueue from "../missionV2/McvQueue";
import McvTrafficLog from "../missionV2/McvTrafficLog";
import McvStationsTable from "../missionV2/McvStationsTable";
import McvIncidents from "../missionV2/McvIncidents";
import McvWeather from "../missionV2/McvWeather";
import McvAiAssistant from "../missionV2/McvAiAssistant";
import { useLocalStorage } from "./mcvV3Utils";

// McvDesktop — the 1200px+ EOC console, polished to enterprise dispatch grade.
// Full-bleed 100dvh, only panel contents scroll. Persisted resizable panels
// (autoSaveId) with reset. Collapsible left/right sidebars + bottom row.
// In-app fullscreen for map, traffic, stations, analytics, weather, AI (ESC
// exits). Keyboard shortcuts (Space/R/E/F/ESC). Map dominates the center.
const Handle = ({ onReset }) => (
  <PanelResizeHandle onDoubleClick={onReset} className="w-1.5 rounded-full bg-white/[0.04] hover:bg-primary/40 transition-colors" />
);

function FsHeader({ title, onClose }) {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 shrink-0 border-b border-white/[0.06] mb-2">
      <h2 className="text-sm font-bold">{title}</h2>
      <span className="text-[10px] text-muted-foreground">ESC to exit</span>
      <button onClick={onClose} aria-label="Exit fullscreen" className="ml-auto p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground"><X className="w-4 h-4" /></button>
    </div>
  );
}

// Branch fullscreen wrapper (non-map widgets; remount acceptable).
function FsWrap({ active, title, onClose, inactiveClass = "h-full", children }) {
  if (active) {
    return (
      <div className="fixed inset-0 z-[90] bg-[#0b0e14] p-2 flex flex-col">
        <FsHeader title={title} onClose={onClose} />
        <div className="flex-1 min-h-0">{children}</div>
      </div>
    );
  }
  return <div className={inactiveClass}>{children}</div>;
}

export default function McvDesktop({ v2, onEmergency, onSettings, onEnd, onManual, containerRef, setEditing }) {
  const { sortedCheckins, approved, isOperator, activeSession, pauseNet, resumeNet } = v2;
  const paused = activeSession?.status === "paused";

  const [fullscreen, setFullscreen] = useState(null);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [bottomCollapsed, setBottomCollapsed] = useLocalStorage("mcv-v3-bottom", false);
  const [stationsDensity, setStationsDensity] = useState("comfortable");
  const [stationsQuery, setStationsQuery] = useState("");
  const [trafficQuery, setTrafficQuery] = useState("");
  const [trafficPaused, setTrafficPaused] = useState(false);

  const leftRef = useRef(null), centerRef = useRef(null), rightRef = useRef(null);

  const fireResize = () => setTimeout(() => window.dispatchEvent(new Event("resize")), 60);
  const openFs = (k) => { setFullscreen(k); fireResize(); };
  const closeFs = () => { setFullscreen(null); fireResize(); };

  const resetMain = () => {
    leftRef.current?.expand?.(); rightRef.current?.expand?.();
    centerRef.current?.resize?.(55); leftRef.current?.resize?.(20); rightRef.current?.resize?.(25);
  };
  const toggleLeft = () => { if (leftCollapsed) leftRef.current?.expand?.(); else leftRef.current?.collapse?.(); };
  const toggleRight = () => { if (rightCollapsed) rightRef.current?.expand?.(); else rightRef.current?.collapse?.(); };
  const toggleBottom = () => setBottomCollapsed((c) => !c);

  // Keyboard shortcuts (ignored while typing in inputs).
  useEffect(() => {
    const onKey = (e) => {
      const t = e.target;
      if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || t?.isContentEditable) return;
      const k = e.key.toLowerCase();
      if (e.code === "Space") { e.preventDefault(); if (isOperator) (paused ? resumeNet : pauseNet)(); }
      else if (k === "r") { if (isOperator && paused) resumeNet(); }
      else if (k === "e") { onEmergency(); }
      else if (k === "f") { setFullscreen((f) => (f === "map" ? null : "map")); fireResize(); }
      else if (e.key === "Escape") { setFullscreen(null); fireResize(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOperator, paused, resumeNet, pauseNet, onEmergency]);

  const stationsToolbar = (
    <>
      <div className="relative">
        <Search className="absolute left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
        <input value={stationsQuery} onChange={(e) => setStationsQuery(e.target.value)} placeholder="Filter…" aria-label="Filter stations" className="w-24 h-6 pl-5 pr-1 rounded-md bg-white/5 border border-white/10 text-[11px] focus:outline-none focus:ring-1 focus:ring-ring" />
      </div>
      <button onClick={() => setStationsDensity((d) => (d === "comfortable" ? "compact" : d === "compact" ? "ultra" : "comfortable"))} title="Density (Comfortable/Compact/Ultra)" className="px-1.5 h-6 rounded-md bg-white/5 hover:bg-white/10 text-[10px] font-bold text-muted-foreground">{stationsDensity === "comfortable" ? "C" : stationsDensity === "compact" ? "P" : "U"}</button>
    </>
  );
  const trafficToolbar = (
    <>
      <div className="relative">
        <Search className="absolute left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
        <input value={trafficQuery} onChange={(e) => setTrafficQuery(e.target.value)} placeholder="Search…" aria-label="Search traffic" className="w-24 h-6 pl-5 pr-1 rounded-md bg-white/5 border border-white/10 text-[11px] focus:outline-none focus:ring-1 focus:ring-ring" />
      </div>
      <button onClick={() => setTrafficPaused((p) => !p)} title={trafficPaused ? "Resume feed" : "Pause feed"} className={`px-1.5 h-6 rounded-md ${trafficPaused ? "bg-amber-500/20 text-amber-300" : "bg-white/5 text-muted-foreground hover:bg-white/10"}`}>{trafficPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}</button>
    </>
  );

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <McvCommandBar v2={v2} onEmergency={onEmergency} onSettings={onSettings} onEnd={onEnd} containerRef={containerRef}
        leftCollapsed={leftCollapsed} rightCollapsed={rightCollapsed} bottomCollapsed={bottomCollapsed}
        onToggleLeft={toggleLeft} onToggleRight={toggleRight} onToggleBottom={toggleBottom} onResetLayout={resetMain} />

      <main className="flex-1 min-h-0 p-1.5">
        <PanelGroup direction="horizontal" autoSaveId="mcv-v3-main" className="h-full">
          {/* LEFT SIDEBAR */}
          <RPanel ref={leftRef} collapsible collapsedSize={0} defaultSize={20} minSize={15} maxSize={30} onCollapse={() => setLeftCollapsed(true)} onExpand={() => setLeftCollapsed(false)}>
            <div className="h-full flex flex-col gap-2 pr-1 min-h-0">
              <McvPanelChrome title={`Check-ins (${approved.length})`} scroll bodyClass="p-2" className="flex-1 min-h-0">
                <McvCheckins checkins={sortedCheckins} isOperator={isOperator} onApprove={v2.approveCheckin} onEditStatus={setEditing} />
              </McvPanelChrome>
              <div className="shrink-0"><McvQueue v2={v2} /></div>
              <div className="shrink-0"><McvPanelChrome title="Mission Statistics" bodyClass="p-2"><McvMissionStats v2={v2} /></McvPanelChrome></div>
            </div>
          </RPanel>
          <Handle onReset={resetMain} />

          {/* CENTER — map dominates (stable wrapper preserves leaflet state) */}
          <RPanel ref={centerRef} defaultSize={55} minSize={38}>
            <div className={fullscreen === "map" ? "fixed inset-0 z-[90] bg-[#0b0e14] p-2 flex flex-col" : "h-full px-1"}>
              {fullscreen === "map" && <FsHeader title="Live Map" onClose={closeFs} />}
              <div className={fullscreen === "map" ? "flex-1 min-h-0" : "h-full"}><McvOperationsMap v2={v2} /></div>
            </div>
          </RPanel>
          <Handle onReset={resetMain} />

          {/* RIGHT SIDEBAR */}
          <RPanel ref={rightRef} collapsible collapsedSize={0} defaultSize={25} minSize={18} maxSize={34} onCollapse={() => setRightCollapsed(true)} onExpand={() => setRightCollapsed(false)}>
            <div className="h-full flex flex-col gap-2 pl-1 min-h-0 overflow-y-auto">
              <McvIncidents v2={v2} />
              <FsWrap active={fullscreen === "weather"} title="Weather" onClose={closeFs} inactiveClass="">
                <div className="relative">
                  {fullscreen !== "weather" && <button onClick={() => openFs("weather")} className="absolute top-1.5 right-1.5 z-20 p-1 rounded-md bg-black/40 hover:bg-black/60 text-muted-foreground" title="Fullscreen" aria-label="Fullscreen weather"><Maximize2 className="w-3 h-3" /></button>}
                  <McvWeather v2={v2} />
                </div>
              </FsWrap>
              <McvPanelChrome title="Quick Actions"><McvQuickActionsPanel v2={v2} onManual={onManual} onSettings={onSettings} /></McvPanelChrome>
              <FsWrap active={fullscreen === "ai"} title="AI Assistant" onClose={closeFs} inactiveClass="">
                <div className="relative">
                  {fullscreen !== "ai" && <button onClick={() => openFs("ai")} className="absolute top-1.5 right-1.5 z-20 p-1 rounded-md bg-black/40 hover:bg-black/60 text-muted-foreground" title="Fullscreen" aria-label="Fullscreen AI"><Maximize2 className="w-3 h-3" /></button>}
                  <McvAiAssistant v2={v2} />
                </div>
              </FsWrap>
              <McvPanelChrome title="System Health"><McvSystemHealth v2={v2} /></McvPanelChrome>
            </div>
          </RPanel>
        </PanelGroup>
      </main>

      {/* BOTTOM SECTION — collapsible, persisted */}
      {bottomCollapsed ? (
        <button onClick={toggleBottom} className="shrink-0 h-7 mx-2 mb-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] text-[11px] text-muted-foreground flex items-center justify-center gap-1.5"><Maximize2 className="w-3 h-3" /> Show Analytics</button>
      ) : (
        <section className="h-[32%] min-h-[180px] px-1.5 pb-1.5">
          <PanelGroup direction="horizontal" autoSaveId="mcv-v3-bottom" className="h-full">
            <RPanel defaultSize={40} minSize={25}>
              <div className="h-full pr-1">
                <FsWrap active={fullscreen === "traffic"} title="Traffic Log" onClose={closeFs}>
                  <McvPanelChrome title="Traffic Log" fill right={trafficToolbar} onFullscreen={() => openFs("traffic")} className="h-full">
                    <McvTrafficLog v2={v2} bare query={trafficQuery} paused={trafficPaused} />
                  </McvPanelChrome>
                </FsWrap>
              </div>
            </RPanel>
            <Handle onReset={resetMain} />
            <RPanel defaultSize={40} minSize={25}>
              <div className="h-full px-1">
                <FsWrap active={fullscreen === "stations"} title="Active Stations" onClose={closeFs}>
                  <McvPanelChrome title="Active Stations" fill right={stationsToolbar} onFullscreen={() => openFs("stations")} className="h-full">
                    <McvStationsTable checkins={approved} bare density={stationsDensity} query={stationsQuery} />
                  </McvPanelChrome>
                </FsWrap>
              </div>
            </RPanel>
            <Handle onReset={resetMain} />
            <RPanel defaultSize={20} minSize={15}>
              <div className="h-full pl-1">
                <FsWrap active={fullscreen === "kpi"} title="Analytics" onClose={closeFs}>
                  <McvPanelChrome title="Analytics" fill onFullscreen={() => openFs("kpi")} className="h-full">
                    <McvKpiDashboard v2={v2} />
                  </McvPanelChrome>
                </FsWrap>
              </div>
            </RPanel>
          </PanelGroup>
        </section>
      )}
    </div>
  );
}