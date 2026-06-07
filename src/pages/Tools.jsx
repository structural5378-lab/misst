import React from "react";
import { Link } from "react-router-dom";
import { Map, Calculator, Cable, Signal, Music, BarChart3, ChevronRight } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";

const tools = [
  { icon: Map, label: "Coverage Map", desc: "Estimate your repeater coverage", path: "/map", color: "text-emerald-400" },
  { icon: Calculator, label: "Antenna Calculator", desc: "Calculate antenna height & range", path: "/tools", color: "text-blue-400" },
  { icon: Cable, label: "Feedline Loss Calculator", desc: "Calculate signal loss in cable", path: "/tools", color: "text-amber-400" },
  { icon: Signal, label: "Repeater Spacing", desc: "Find optimal repeater spacing", path: "/tools", color: "text-purple-400" },
  { icon: Music, label: "PL Tone Lookup", desc: "Search PL tones by frequency", path: "/tools", color: "text-orange-400" },
  { icon: BarChart3, label: "Frequency Reference", desc: "GMRS frequency chart", path: "/tools", color: "text-primary" },
];

export default function Tools() {
  return (
    <div>
      <PageHeader title="Tools" showBack />
      <div className="px-4 pt-3 space-y-2 pb-4">
        {tools.map(({ icon: Icon, label, desc, path, color }) => (
          <Link
            key={label}
            to={path}
            className="flex items-center justify-between p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center">
                <Icon className={`w-5 h-5 ${color}`} />
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