import React, { useState } from "react";
import { Radio, Siren, LayoutGrid, Map as MapIcon, List, CloudRain, Sparkles, UserPlus } from "lucide-react";
import { fmtRuntime } from "../missionV2/runtime";
import McvV3Panel from "./McvV3Panel";
import McvMissionStats from "./McvMissionStats";
import McvQuickActionsPanel from "./McvQuickActionsPanel";
import McvMobileStations from "./McvMobileStations";
import McvOperationsMap from "../missionV2/McvOperationsMap";
import McvCheckins from "../missionV2/McvCheckins";
import McvTrafficLog from "../missionV2/McvTrafficLog";
import McvWeather from "../missionV2/McvWeather";
import McvAiAssistant from "../missionV2/McvAiAssistant";

// McvMobile — the dedicated <768px interface. NOT a stacked desktop: a compact
// header (mission, community, status, runtime, emergency) + a tabbed body
// (Overview, Map, Traffic, Stations, Weather, AI) + a 6-tab bottom nav. Heavy
// map only mounts on the Map tab; lists are touch-friendly.
const TABS = [
  { key: "overview", label: "Overview", icon: LayoutGrid },
  { key: "map", label: "Map", icon: MapIcon },
  { key: "traffic", label: "Traffic", icon: List },
  { key: "stations", label: "Stations", icon: Radio },
  { key: "weather", label: "Weather", icon: CloudRain },
  { key: "ai", label: "AI", icon: Sparkles },
];

export default function McvMobile({ v2, onEmergency, onSettings, onManual, setEditing }) {
  const [tab, setTab] = useState("overview");
  const { sortedCheckins, approved, isOperator, activeSession, net, runtimeMs } = v2;
  const paused = activeSession?.status === "paused";

  return (
    <div className="h-full flex flex-col">
      <header className="shrink-0 bg-[#0b0e11]/90 backdrop-blur-xl border-b border-white/[0.06] px-3 py-2 flex items-center gap-2 mist-safe-top">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shrink-0"><Radio className="w-4 h-4 text-white" /></div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold truncate">{net?.name || activeSession?.net_name || "—"}</p>
          <p className="text-[10px] text-muted-foreground truncate">{activeSession?.community_name || net?.community_name || ""} · {fmtRuntime(runtimeMs)}</p>
        </div>
        <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold ${paused ? "bg-amber-500/20 text-amber-300" : "bg-emerald-500/20 text-emerald-300"}`}>{paused ? "PAUSED" : "LIVE"}</span>
        {isOperator && activeSession && <button onClick={onManual} aria-label="Log user" className="p-2 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 shrink-0"><UserPlus className="w-4 h-4" /></button>}
        <button onClick={onEmergency} className="p-2 rounded-lg bg-rose-500/15 text-rose-300 border border-rose-500/30 shrink-0"><Siren className="w-4 h-4" /></button>
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto p-2">
        {tab === "overview" && (
          <div className="space-y-2">
            <McvV3Panel title="Mission Status"><McvMissionStats v2={v2} /></McvV3Panel>
            <McvV3Panel title={`Check-ins (${approved.length})`} scroll bodyClass="p-2">
              <McvCheckins checkins={sortedCheckins} isOperator={isOperator} onApprove={v2.approveCheckin} onEditStatus={setEditing} />
            </McvV3Panel>
            <div className="h-72"><McvTrafficLog v2={v2} /></div>
            <McvV3Panel title="Quick Actions"><McvQuickActionsPanel v2={v2} onManual={onManual} onSettings={onSettings} /></McvV3Panel>
          </div>
        )}
        {tab === "map" && <div className="h-full min-h-[300px]"><McvOperationsMap v2={v2} /></div>}
        {tab === "traffic" && <div className="h-full"><McvTrafficLog v2={v2} full /></div>}
        {tab === "stations" && <McvMobileStations checkins={approved} />}
        {tab === "weather" && <McvWeather v2={v2} />}
        {tab === "ai" && <McvAiAssistant v2={v2} />}
      </main>

      <nav className="shrink-0 bg-[#0b0e11]/95 backdrop-blur-xl border-t border-white/[0.06] grid grid-cols-6 mist-safe-bottom">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button key={t.key} onClick={() => setTab(t.key)} className={`flex flex-col items-center gap-0.5 py-2 ${active ? "text-violet-300" : "text-muted-foreground"}`}>
              <Icon className="w-5 h-5" />
              <span className="text-[9px] font-semibold">{t.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}