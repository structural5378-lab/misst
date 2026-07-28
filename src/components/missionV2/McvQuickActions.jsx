import React from "react";
import { Pause, Play, UserCheck, UserPlus, Siren, FileDown, ClipboardList, Square } from "lucide-react";

// McvQuickActions — persistent Quick Actions bar above the footer nav:
// Pause/Resume, Roll Call, Late Check-In, Emergency Mode, Export PDF,
// Attendance, End Net. Operators only.
export default function McvQuickActions({ v2, onManual, onEnd }) {
  const { activeSession, isOperator, pauseNet, resumeNet, rollCall, exportPdf, addIncident } = v2;
  if (!isOperator) return null;
  const paused = activeSession?.status === "paused";
  const Btn = ({ onClick, color, icon: Icon, label, disabled }) => (
    <button onClick={onClick} disabled={disabled} className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-[11px] font-bold border whitespace-nowrap disabled:opacity-40 ${color}`}>
      <Icon className="w-3.5 h-3.5" /> {label}
    </button>
  );
  return (
    <div className="sticky bottom-0 z-30 bg-[#0b0e11]/90 backdrop-blur-xl border-t border-white/[0.06] px-3 py-2">
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide max-w-screen-2xl mx-auto">
        <Btn onClick={paused ? resumeNet : pauseNet} color="bg-emerald-500/15 text-emerald-300 border-emerald-500/30" icon={paused ? Play : Pause} label={paused ? "Resume Net" : "Pause Net"} />
        <Btn onClick={rollCall} color="bg-blue-500/15 text-blue-300 border-blue-500/30" icon={UserCheck} label="Roll Call" />
        <Btn onClick={onManual} color="bg-amber-500/15 text-amber-300 border-amber-500/30" icon={UserPlus} label="Late Check-In" />
        <Btn onClick={() => addIncident("emergency", "Emergency traffic declared")} color="bg-rose-500/15 text-rose-300 border-rose-500/30" icon={Siren} label="Emergency Mode" />
        <Btn onClick={exportPdf} color="bg-violet-500/15 text-violet-300 border-violet-500/30" icon={FileDown} label="Export Log (PDF)" />
        <Btn onClick={exportPdf} color="bg-teal-500/15 text-teal-300 border-teal-500/30" icon={ClipboardList} label="Attendance" />
        <Btn onClick={onEnd} color="bg-white/5 text-muted-foreground border-white/10" icon={Square} label="End Net" />
      </div>
    </div>
  );
}