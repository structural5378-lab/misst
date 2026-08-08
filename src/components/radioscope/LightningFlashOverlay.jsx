import { useEffect, useState } from 'react';
import { Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { subscribeLightingEvents } from '@/lib/lighting/lightingEvents';
import { useLighting } from '@/hooks/useLighting';

// LightningFlashOverlay — RadioScope map overlay that renders a brief,
// transient strike flash when a lightning LightingEvent (source=weather,
// surface=radioscope) is dispatched through the Lighting Engine seam.
//
// Event-driven: NO animation loop, NO polling. Each flash animates once (CSS,
// GPU transform/opacity) and removes itself after its duration. Capped to
// MAX_FLASHES to avoid overload. pointer-events:none so it never blocks map
// controls / pinch-zoom / menus. Respects reduced-motion + performance mode
// via useLighting (the platform-wide controls).
//
// The weather system never imports this component — it only dispatches events.
// This overlay subscribes and decides HOW to render. Boundaries preserved.

const MAX_FLASHES = 8;

function flashIcon(severity) {
  const cls = `rs-lightning-flash rs-lightning-flash-${severity || 'distant'}`;
  return L.divIcon({
    className: 'rs-divicon',
    html: `<div class="${cls}"><div class="rs-lightning-flash-core"></div><div class="rs-lightning-flash-ring"></div></div>`,
    iconSize: [60, 60],
    iconAnchor: [30, 30],
  });
}

export default function LightningFlashOverlay() {
  useMap(); // ensure this renders inside a MapContainer
  const { enabled, minimal, reducedMotion } = useLighting();
  const [flashes, setFlashes] = useState([]);

  useEffect(() => {
    if (!enabled) return; // performance mode — skip non-essential effects
    const unsub = subscribeLightingEvents((evt) => {
      if (!evt || evt.source !== 'weather' || evt.surface !== 'radioscope') return;
      if (!evt.location) return;
      const dur = minimal || reducedMotion ? 600 : (evt.duration || 1200);
      const flash = {
        key: `${evt.id}-${Date.now()}`,
        lat: evt.location.lat,
        lon: evt.location.lon,
        severity: evt.severity || 'distant',
      };
      setFlashes((prev) => [...prev.slice(-(MAX_FLASHES - 1)), flash]);
      window.setTimeout(() => {
        setFlashes((prev) => prev.filter((f) => f.key !== flash.key));
      }, dur + 80);
    });
    return unsub;
  }, [enabled, minimal, reducedMotion]);

  // Reduced-motion: render nothing (the seam still transported the event;
  // alerts are unaffected because the alert system is independent).
  if (!enabled || reducedMotion) return null;

  return (
    <>
      {flashes.map((f) => (
        <Marker
          key={f.key}
          position={[f.lat, f.lon]}
          icon={flashIcon(f.severity)}
          interactive={false}
          keyboard={false}
        />
      ))}
    </>
  );
}