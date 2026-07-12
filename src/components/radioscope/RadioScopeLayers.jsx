import React from "react";
import { X, Radio, Users, Cloud, Wifi, AlertTriangle, Circle, Mountain, Satellite } from "lucide-react";

const LAYERS = [
  { id: "repeaters", label: "Repeaters", icon: Radio },
  { id: "users", label: "Users", icon: Users },
  { id: "coverage", label: "Coverage Circles", icon: Circle },
  { id: "beams", label: "RF Connections", icon: Wifi },
  { id: "weather", label: "Weather", icon: Cloud, soon: true },
  { id: "nets", label: "Nets", icon: Wifi, soon: true },
  { id: "emergency", label: "Emergency", icon: AlertTriangle, soon: true },
];

export default function RadioScopeLayers({ activeLayers, onLayerChange, tileMode, onTileModeChange, onClose }) {
  const toggle = (id) => onLayerChange((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 bg-black/50 z-[80] fade-in" />
      <div className="fixed top-0 right-0 bottom-0 z-[80] w-72 bg-card border-l border-cyan-500/20 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] sheet-up overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-sm font-bold text-foreground">Map Layers</h2>
          <button onClick={onClose} className="p-2 -m-1 text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-1">
          {LAYERS.map((layer) => {
            const Icon = layer.icon;
            const active = activeLayers[layer.id];
            return (
              <button
                key={layer.id}
                onClick={() => !layer.soon && toggle(layer.id)}
                disabled={layer.soon}
                className={`w-full flex items-center justify-between px-3 py-3 rounded-xl transition-colors ${
                  layer.soon ? "opacity-40" : "hover:bg-secondary"
                } ${active ? "bg-cyan-500/10" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${active ? "text-cyan-400" : "text-muted-foreground"}`} />
                  <span className="text-sm text-foreground">{layer.label}</span>
                  {layer.soon && <span className="text-[9px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">SOON</span>}
                </div>
                <div className={`w-10 h-6 rounded-full transition-colors ${active ? "bg-cyan-600" : "bg-secondary"}`}>
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform mt-0.5 ${active ? "translate-x-[18px]" : "translate-x-0.5"}`} />
                </div>
              </button>
            );
          })}
        </div>

        <div className="px-4 pt-2 pb-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Map Style</h3>
          <div className="grid grid-cols-3 gap-2">
            <TileButton icon={Radio} label="Dark" active={tileMode === "dark"} onClick={() => onTileModeChange("dark")} />
            <TileButton icon={Satellite} label="Satellite" active={tileMode === "satellite"} onClick={() => onTileModeChange("satellite")} />
            <TileButton icon={Mountain} label="Terrain" active={tileMode === "terrain"} onClick={() => onTileModeChange("terrain")} />
          </div>
        </div>
      </div>
    </>
  );
}

function TileButton({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-colors ${
        active ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-400" : "bg-secondary/50 border-border text-muted-foreground"
      }`}
    >
      {React.createElement(icon, { className: "w-5 h-5" })}
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}