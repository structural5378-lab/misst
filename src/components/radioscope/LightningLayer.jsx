import { useMemo } from "react";
import { CircleMarker, Tooltip, Popup } from "react-leaflet";
import { Zap } from "lucide-react";
import {
  milesBetween, severityTier, isHighIntensity,
} from "@/lib/lightning/lightningSeverity";

// LightningLayer — RadioScope overlay rendering persisted lightning strikes.
//
// Each strike marker encodes:
//   GPS          — CircleMarker center
//   age          — color (red→orange→yellow→blue→gray) + opacity fade over time
//   intensity    — radius boost (and a high-intensity boost when ≥ 70)
//   severity     — distance tier (critical / near / distant) anchored to the
//                  user's LightningAlertSettings.radius_miles → radius, weight,
//                  fill opacity. Distant = subtle; Nearby = noticeable; Very
//                  Nearby = strong. High-intensity = more prominent.
//   nearest repeater — shown in the popup (existing lat/lon data supports it)
//
// Transient "new strike" flashes are handled by LightningFlashOverlay (event-
// driven). This layer renders the persisted markers only.

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

// Fade opacity from ~0.9 (fresh) to ~0.25 (30m old) so stale strikes recede.
function ageOpacity(strikeTime, now) {
  const t = new Date(strikeTime).getTime();
  if (!isFinite(t)) return 0.3;
  const age = Math.max(0, now - t);
  return Math.max(0.25, 0.9 - (age / (30 * 60 * 1000)) * 0.65);
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

const SEVERITY_RADIUS = { critical: 11, near: 8, distant: 5 };
const SEVERITY_WEIGHT = { critical: 3, near: 2, distant: 1.5 };
const SEVERITY_FILL = { critical: 0.85, near: 0.7, distant: 0.5 };
const SEVERITY_LABEL = { critical: "Very Nearby", near: "Nearby", distant: "Distant" };

function nearestRepeater(strike, repeaters) {
  if (!repeaters || !repeaters.length) return null;
  let best = null;
  for (const r of repeaters) {
    if (r.latitude == null || r.longitude == null) continue;
    const d = milesBetween(strike.latitude, strike.longitude, r.latitude, r.longitude);
    if (!best || d < best.dist) best = { repeater: r, dist: d };
  }
  return best;
}

export default function LightningLayer({
  strikes, now, focusStrikeId, onStrikeClick,
  userPosition, radiusMiles, repeaters,
}) {
  const visible = useMemo(
    () => (strikes || []).filter((s) => s.latitude && s.longitude),
    [strikes]
  );

  return (
    <>
      {visible.map((s) => {
        const color = ageColor(s.strike_time || s.created_date, now);
        const baseOpacity = ageOpacity(s.strike_time || s.created_date, now);
        const intensity = s.intensity ?? 50;
        const high = isHighIntensity(s.intensity);
        const distance = userPosition
          ? milesBetween(userPosition[0], userPosition[1], s.latitude, s.longitude)
          : null;
        const tier = severityTier(distance, radiusMiles);
        const isFocus = focusStrikeId && s.id === focusStrikeId;
        const radius = SEVERITY_RADIUS[tier] + (intensity / 100) * 4 + (high ? 2 : 0);
        const weight = SEVERITY_WEIGHT[tier] + (isFocus ? 1 : 0);
        const fillOpacity = Math.min(SEVERITY_FILL[tier], baseOpacity + 0.1);
        const near = nearestRepeater(s, repeaters);
        return (
          <CircleMarker
            key={s.id}
            center={[s.latitude, s.longitude]}
            radius={radius}
            pathOptions={{
              color,
              fillColor: color,
              fillOpacity,
              weight,
            }}
            eventHandlers={{ click: () => onStrikeClick?.(s) }}
          >
            <Tooltip direction="top" offset={[0, -8]} opacity={1}>
              <div className="text-xs">
                <div className="font-semibold flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Lightning · {SEVERITY_LABEL[tier]}
                </div>
                <div>{ageLabel(s.strike_time || s.created_date, now)}</div>
                <div>Intensity: {intensity}{high ? " (high)" : ""}</div>
                {distance != null && <div>{distance.toFixed(1)} mi from you</div>}
              </div>
            </Tooltip>
            <Popup>
              <div className="text-xs space-y-0.5">
                <div className="font-semibold">⚡ Lightning Strike</div>
                <div>Severity: {SEVERITY_LABEL[tier]}</div>
                <div>Age: {ageLabel(s.strike_time || s.created_date, now)}</div>
                <div>Intensity: {intensity}{high ? " (high)" : ""}</div>
                {distance != null && <div>{distance.toFixed(1)} mi from you</div>}
                <div>Provider: {s.provider || "mock"}</div>
                {near && (
                  <div className="text-muted-foreground border-t border-border mt-1 pt-1">
                    Nearest repeater: {near.repeater.callsign || near.repeater.name || "—"} ({near.dist.toFixed(1)} mi)
                  </div>
                )}
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