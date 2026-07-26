import { useMemo } from "react";
import { CircleMarker, Tooltip, Popup } from "react-leaflet";
import { Zap } from "lucide-react";

// LightningLayer — RadioScope overlay rendering persisted lightning strikes.
// Each strike marker encodes GPS, age (color), and intensity (radius).
// Phase 1 uses the mock provider; the layer is provider-agnostic.

const AGE_WINDOWS = [
  { maxMs: 2 * 60 * 1000, color: "#ef4444" },   // red — fresh
  { maxMs: 5 * 60 * 1000, color: "#f97316" },   // orange
  { maxMs: 15 * 60 * 1000, color: "#eab308" },  // yellow
  { maxMs: 30 * 60 * 1000, color: "#3b82f6" },  // blue
];

function ageColor(strikeTime, now) {
  const t = new Date(strikeTime).getTime();
  if (!isFinite(t)) return "#64748b";
  const age = now - t;
  if (age < 0) return "#ef4444";
  for (const w of AGE_WINDOWS) if (age <= w.maxMs) return w.color;
  return "#64748b"; // older than 30m — gray
}

function ageLabel(strikeTime, now) {
  const t = new Date(strikeTime).getTime();
  if (!isFinite(t)) return "—";
  const age = Math.max(0, now - t);
  const m = Math.floor(age / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m ago`;
}

export default function LightningLayer({ strikes, now, focusStrikeId, onStrikeClick }) {
  const visible = useMemo(
    () => (strikes || []).filter((s) => s.latitude && s.longitude),
    [strikes]
  );

  return (
    <>
      {visible.map((s) => {
        const color = ageColor(s.strike_time || s.created_date, now);
        const intensity = s.intensity ?? 50;
        const radius = 6 + (intensity / 100) * 10; // 6–16px
        const isFocus = focusStrikeId && s.id === focusStrikeId;
        return (
          <CircleMarker
            key={s.id}
            center={[s.latitude, s.longitude]}
            radius={radius}
            pathOptions={{
              color,
              fillColor: color,
              fillOpacity: 0.75,
              weight: isFocus ? 3 : 1.5,
            }}
            eventHandlers={{ click: () => onStrikeClick?.(s) }}
          >
            <Tooltip direction="top" offset={[0, -8]} opacity={1}>
              <div className="text-xs">
                <div className="font-semibold flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Lightning
                </div>
                <div>{ageLabel(s.strike_time || s.created_date, now)}</div>
                <div>Intensity: {intensity}</div>
              </div>
            </Tooltip>
            <Popup>
              <div className="text-xs space-y-0.5">
                <div className="font-semibold">⚡ Lightning Strike</div>
                <div>Age: {ageLabel(s.strike_time || s.created_date, now)}</div>
                <div>Intensity: {intensity}</div>
                <div>Provider: {s.provider || "mock"}</div>
                <div className="text-muted-foreground">
                  {s.latitude.toFixed(4)}, {s.longitude.toFixed(4)}
                </div>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </>
  );
}