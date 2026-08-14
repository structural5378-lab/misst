import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Map, Calculator, Cable, Signal, Music, BarChart3, ChevronRight, Radio } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { readGmrsReminderDue, readGmrsReminderActive } from "@/hooks/useGmrsIdReminder";

const tools = [
  { icon: Map, label: "Coverage Map", desc: "Estimate your repeater coverage", path: "/map", color: "text-emerald-400" },
  { icon: Calculator, label: "Antenna Calculator", desc: "Calculate antenna height & range", path: "/tools/antenna", color: "text-blue-400" },
  { icon: Cable, label: "Feedline Loss Calculator", desc: "Calculate signal loss in cable", path: "/tools/feedline", color: "text-amber-400" },
  { icon: Signal, label: "Repeater Spacing", desc: "Find optimal repeater spacing", path: "/tools/repeater-spacing", color: "text-purple-400" },
  { icon: Music, label: "PL Tone Lookup", desc: "Search PL tones by frequency", path: "/tools/pl-tones", color: "text-orange-400" },
  { icon: BarChart3, label: "Frequency Reference", desc: "GMRS frequency chart", path: "/tools/frequencies", color: "text-primary" },
  { icon: Radio, label: "GMRS Call Sign Reminder", desc: "Never forget your GMRS station identification", path: "/tools/gmrs-reminder", color: "text-cyan-400", gmrs: true },
];

export default function Tools() {
  const [gmrsDue, setGmrsDue] = useState(readGmrsReminderDue());
  const [gmrsActive, setGmrsActive] = useState(readGmrsReminderActive());
  useEffect(() => {
    const id = setInterval(() => {
      setGmrsDue(readGmrsReminderDue());
      setGmrsActive(readGmrsReminderActive());
    }, 3000);
    return () => clearInterval(id);
  }, []);
  return (
    <div>
      <PageHeader title="Tools" showBack />
      <div className="px-4 pt-3 space-y-2 pb-4">
        {tools.map(({ icon: Icon, label, desc, path, color, gmrs }) => (
          <Link
            key={label}
            to={path}
            className={`flex items-center justify-between p-4 rounded-xl bg-card border transition-colors ${
              gmrs && gmrsDue ? "border-warning/60 mist-emergency-pulse" : "border-border/50 hover:border-primary/30"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center relative ${gmrs && gmrsDue ? "mist-emergency-pulse" : ""}`}>
                <Icon className={`w-5 h-5 ${color}`} />
                {gmrs && gmrsActive && !gmrsDue && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-success border-2 border-card" />
                )}
                {gmrs && gmrsDue && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-warning border-2 border-card animate-pulse" />
                )}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground">{label}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </Link>
        ))}
      </div>
    </div>
  );
}