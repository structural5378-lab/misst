import React from "react";
import { Link } from "react-router-dom";
import { UserPlus, Megaphone, AlertTriangle, MapPin, UserCheck, CloudRain, FileDown, Sparkles, Settings } from "lucide-react";

// McvQuickActionsPanel — right-sidebar quick actions grid. Operator actions
// (Add Check-in, Roll Call, Broadcast, Send Alert, Export) are only shown to
// operators; navigation actions (RadioScope, Weather, AI, Settings) to all.
export default function McvQuickActionsPanel({ v2, onManual, onSettings }) {
  const { isOperator, rollCall, exportPdf, addIncident } = v2;
  const broadcast = () => {
    const msg = window.prompt("Broadcast message:")?.trim();
    if (msg) addIncident("general_note", msg);
  };
  const focusAi = () => document.getElementById("mcv-ai-panel")?.scrollIntoView({ behavior: "smooth", block: "center" });
  const actions = [
    { label: "Add Check-in", icon: UserPlus, color: "text-amber-300", onClick: onManual, op: true },
    { label: "Roll Call", icon: UserCheck, color: "text-blue-300", onClick: rollCall, op: true },
    { label: "Broadcast", icon: Megaphone, color: "text-violet-300", onClick: broadcast, op: true },
    { label: "Send Alert", icon: AlertTriangle, color: "text-orange-300", onClick: () => addIncident("priority", "Priority alert broadcast"), op: true },
    { label: "RadioScope", icon: MapPin, color: "text-cyan-300", to: "/radioscope" },
    { label: "Weather", icon: CloudRain, color: "text-sky-300", to: "/weather" },
    { label: "Export Log", icon: FileDown, color: "text-teal-300", onClick: exportPdf, op: true },
    { label: "AI Assistant", icon: Sparkles, color: "text-fuchsia-300", onClick: focusAi },
    { label: "Settings", icon: Settings, color: "text-muted-foreground", onClick: onSettings },
  ];
  const list = actions.filter((a) => !a.op || isOperator);
  return (
    <div className="grid grid-cols-3 gap-1.5 p-2">
      {list.map((a) => {
        const Icon = a.icon;
        const inner = (
          <button onClick={a.onClick} className="flex flex-col items-center gap-1 p-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] text-center transition-colors">
            <Icon className={`w-4 h-4 ${a.color}`} />
            <span className="text-[10px] font-semibold leading-tight">{a.label}</span>
          </button>
        );
        return a.to ? <Link key={a.label} to={a.to}>{inner}</Link> : <div key={a.label}>{inner}</div>;
      })}
    </div>
  );
}