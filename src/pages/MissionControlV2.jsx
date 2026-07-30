import React, { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Radio, Play, X } from "lucide-react";
import { useMissionControlV2 } from "@/hooks/useMissionControlV2";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import McvNetPicker from "@/components/missionV2/McvNetPicker";
import McvManualCheckin from "@/components/missionV2/McvManualCheckin";
import { SettingsPanel, ReportPanel } from "@/components/missionV2/McvPanels";
import MissionStatusSheet from "@/components/mission/MissionStatusSheet";
import XpToast from "@/components/mission/XpToast";
import UnlockCelebration from "@/components/achievements/UnlockCelebration";
import McvDesktop from "@/components/missionV3/McvDesktop";
import McvTablet from "@/components/missionV3/McvTablet";
import McvMobile from "@/components/missionV3/McvMobile";

// Mission Control V3 — responsive Operations Center. One data layer
// (useMissionControlV2 → useMissionControl: NetSession/NetLog/NetTimeline/
// NetQueueEntry/NetIncident + realtime subscriptions) drives three dedicated
// layouts that swap by breakpoint: Desktop (1200px+) EOC console, Tablet
// (768–1199) two-column, Mobile (<768) tabbed field interface. Desktop-only
// widgets are not mounted on mobile; the heavy map only mounts when its tab is
// active. All backend, permissions, and realtime wiring are unchanged.
export default function MissionControlV2() {
  const { netId } = useParams();
  const navigate = useNavigate();
  const [xpToast, setXpToast] = useState(null);
  const [unlock, setUnlock] = useState(null);
  const [showManual, setShowManual] = useState(false);
  const [editing, setEditing] = useState(null);
  const [report, setReport] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const containerRef = useRef(null);
  const v2 = useMissionControlV2(netId, { onXp: setXpToast, onUnlock: setUnlock });
  const { effectiveNetId, activeSession, net, isOperator, endNet } = v2;

  const isDesktop = useMediaQuery("(min-width: 1200px)");
  const isTablet = useMediaQuery("(min-width: 768px) and (max-width: 1199px)");

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
  const onEmergency = () => v2.addIncident("emergency", "Emergency traffic declared");
  const onSettings = () => setShowSettings(true);

  const shared = { v2, onEmergency, onSettings, onEnd, onManual: () => setShowManual(true), editing, setEditing, containerRef };

  return (
    <div ref={containerRef} className="h-[100dvh] bg-[#0b0e14] text-foreground flex flex-col overflow-hidden">
      {isDesktop ? <McvDesktop {...shared} /> : isTablet ? <McvTablet {...shared} /> : <McvMobile {...shared} />}

      {showManual && <McvManualCheckin onSubmit={onManual} onClose={() => setShowManual(false)} />}
      {editing && <MissionStatusSheet checkin={editing} onUpdate={(s) => { v2.editStatus(editing, s); setEditing(null); }} onClose={() => setEditing(null)} />}
      {report && <ReportPanel report={report} checkins={v2.checkins} onClose={() => setReport(null)} />}
      {showSettings && (
        <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex justify-end" onClick={() => setShowSettings(false)}>
          <div className="w-full max-w-sm h-full bg-card border-l border-border overflow-y-auto p-4 sheet-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold">Settings</h3>
              <button onClick={() => setShowSettings(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <SettingsPanel v2={v2} onEnd={async () => { setShowSettings(false); await onEnd(); }} />
          </div>
        </div>
      )}
      <XpToast amount={xpToast} onDone={() => setXpToast(null)} />
      {unlock && <UnlockCelebration achievementId={unlock} onClose={() => setUnlock(null)} onShare={() => setUnlock(null)} />}
    </div>
  );
}