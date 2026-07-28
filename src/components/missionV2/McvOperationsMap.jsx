import React, { useState } from "react";
import MissionMap from "@/components/mission/MissionMap";
import { Users, Radio, CircleDot, Waves, Layers } from "lucide-react";

// McvOperationsMap — large, dominant center map for the V3 Operations Center.
// Reuses MissionMap (operators, repeater, coverage rings, beams) with a real
// layer-control overlay. Layers map to actual MissionMap render flags.
export default function McvOperationsMap({ v2 }) {
  const { approved, repeater, activeSession } = v2;
  const [layers, setLayers] = useState({ operators: true, repeater: true, coverage: true, beams: true });
  const toggle = (k) => setLayers((l) => ({ ...l, [k]: !l[k] }));

  const TOGGLES = [
    { k: "operators", label: "Operators", icon: Users, color: "text-emerald-400" },
    { k: "repeater", label: "Repeaters", icon: Radio, color: "text-violet-400" },
    { k: "coverage", label: "Coverage", icon: CircleDot, color: "text-cyan-400" },
    { k: "beams", label: "Beams", icon: Waves, color: "text-blue-400" },
  ];

  return (
    <div className="relative h-full rounded-xl overflow-hidden border border-white/[0.06] bg-[#0a0a0c]">
      <MissionMap
        checkins={approved}
        repeater={repeater}
        netControlUid={activeSession?.net_control_uid}
        showOperators={layers.operators}
        showRepeater={layers.repeater}
        showCoverage={layers.coverage}
        showBeams={layers.beams}
        height="100%"
      />

      {/* Layer control overlay */}
      <div className="absolute top-2 right-2 z-[500] rounded-lg bg-[#0b0e14]/90 backdrop-blur-xl border border-white/[0.08] p-1.5 flex flex-col gap-0.5 shadow-xl">
        <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-muted-foreground px-1 pb-1 border-b border-white/[0.06]">
          <Layers className="w-3 h-3" /> Layers
        </span>
        {TOGGLES.map((t) => {
          const on = layers[t.k];
          const Icon = t.icon;
          return (
            <button
              key={t.k}
              onClick={() => toggle(t.k)}
              className={`flex items-center gap-1.5 px-1.5 py-1 rounded text-[10px] font-semibold transition w-full ${on ? "bg-white/10 text-foreground" : "text-muted-foreground/50 hover:text-muted-foreground"}`}
            >
              <Icon className={`w-3 h-3 ${on ? t.color : ""}`} />
              {t.label}
              <span className={`ml-auto w-1.5 h-1.5 rounded-full ${on ? "bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.7)]" : "bg-white/10"}`} />
            </button>
          );
        })}
      </div>
    </div>
  );
}