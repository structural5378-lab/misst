import React from "react";
import { LayoutDashboard, Activity, ListChecks, MapPin, Siren, BookOpen, FileBarChart, Settings } from "lucide-react";

// McvFooterNav — global footer navigation for Mission Control V2: view tabs
// plus a live clock/date on the right.
const TABS = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "traffic", label: "Traffic Log", icon: Activity },
  { key: "checkins", label: "Check-Ins", icon: ListChecks },
  { key: "map", label: "Map", icon: MapPin },
  { key: "incidents", label: "Incidents", icon: Siren },
  { key: "resources", label: "Resources", icon: BookOpen },
  { key: "reports", label: "Reports", icon: FileBarChart },
  { key: "settings", label: "Settings", icon: Settings },
];

export default function McvFooterNav({ view, setView, now }) {
  const dt = now ? new Date(now) : new Date();
  return (
    <nav className="bg-[#0b0e11]/95 backdrop-blur-xl border-t border-white/[0.06]">
      <div className="flex items-center gap-1 px-2 py-1.5 overflow-x-auto scrollbar-hide max-w-screen-2xl mx-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = view === tab.key;
          return (
            <button key={tab.key} onClick={() => setView(tab.key)} className={`flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-lg shrink-0 ${active ? "bg-violet-500/15 text-violet-300" : "text-muted-foreground hover:text-foreground"}`}>
              <Icon className="w-4 h-4" />
              <span className="text-[9px] font-semibold">{tab.label}</span>
            </button>
          );
        })}
        <div className="ml-auto text-right shrink-0 pr-2 hidden sm:block">
          <p className="text-xs font-bold tabular-nums text-foreground">{dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</p>
          <p className="text-[10px] text-muted-foreground">{dt.toLocaleDateString([], { month: "short", day: "numeric" })}</p>
        </div>
      </div>
    </nav>
  );
}