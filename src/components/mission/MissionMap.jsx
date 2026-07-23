import React, { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { fmtDistance } from "./helpers";

const STATUS_COLORS = {
  checked_in: "#10B981", late: "#F59E0B", mobile: "#22D3EE", base: "#3B82F6",
  visitor: "#A855F7", emergency: "#EF4444", priority: "#F97316", monitoring: "#94A3B8",
};

function colorFor(c, netControlUid) {
  if (c.user_id && c.user_id === netControlUid) return "#22D3EE";
  return STATUS_COLORS[c.status] || "#10B981";
}

function memberIcon(c, color) {
  const avatar = c.avatar
    ? `<img src="${c.avatar}" style="width:26px;height:26px;border-radius:50%;object-fit:cover" />`
    : `<div style="width:26px;height:26px;border-radius:50%;background:rgba(139,92,246,0.3);color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center">${(c.callsign || "?").charAt(0).toUpperCase()}</div>`;
  const html = `<div style="border:2px solid ${color};box-shadow:0 0 10px ${color}99;width:36px;height:36px;border-radius:50%;background:hsl(210 28% 11%);display:flex;align-items:center;justify-content:center;overflow:hidden">${avatar}</div>`;
  return L.divIcon({ html, className: "rs-divicon", iconSize: [36, 36], iconAnchor: [18, 18] });
}

function repeaterIcon() {
  const html = `<div style="width:40px;height:40px;border-radius:50%;background:rgba(139,92,246,0.25);border:2px solid #8B5CF6;box-shadow:0 0 14px rgba(139,92,246,0.8);display:flex;align-items:center;justify-content:center"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c4b5fd" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.9 19.1a10 10 0 0 1 0-14.2"/><path d="M7.8 16.2a6 6 0 0 1 0-8.4"/><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8a6 6 0 0 1 0 8.4"/><path d="M19.1 4.9a10 10 0 0 1 0 14.2"/></svg></div>`;
  return L.divIcon({ html, className: "rs-divicon", iconSize: [40, 40], iconAnchor: [20, 20] });
}

export default function MissionMap({ checkins = [], repeater, netControlUid }) {
  const [geo, setGeo] = useState({});
  const cacheRef = useRef({});

  // Best-effort geocoding of location text via Nominatim (throttled, cached)
  useEffect(() => {
    let cancelled = false;
    const unique = [];
    checkins.forEach((c) => {
      if (!c.location_lat && c.location && !cacheRef.current[c.location]) unique.push(c.location);
    });
    const locs = [...new Set(unique)].slice(0, 20);
    let i = 0;
    const next = async () => {
      if (cancelled || i >= locs.length) return;
      const loc = locs[i++];
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(loc)}`);
        const j = await r.json();
        const coords = j[0] ? [parseFloat(j[0].lat), parseFloat(j[0].lon)] : null;
        cacheRef.current[loc] = coords;
        if (!cancelled) setGeo((g) => ({ ...g, [loc]: coords }));
      } catch {
        cacheRef.current[loc] = null;
      }
      setTimeout(next, 1100);
    };
    next();
    return () => { cancelled = true; };
  }, [checkins]);

  const center = repeater?.latitude != null ? [repeater.latitude, repeater.longitude] : [39.5, -98.35];
  const zoom = repeater?.latitude != null ? 9 : 4;

  const markers = useMemo(() => {
    return checkins
      .map((c) => {
        const pos = c.location_lat != null ? [c.location_lat, c.location_lon] : cacheRef.current[c.location] || geo[c.location];
        if (!pos) return null;
        return { c, pos, color: colorFor(c, netControlUid) };
      })
      .filter(Boolean);
  }, [checkins, geo, netControlUid]);

  const legend = [
    { label: "Net Control", color: "#22D3EE" },
    { label: "Checked In", color: "#10B981" },
    { label: "Mobile", color: "#22D3EE" },
    { label: "Base", color: "#3B82F6" },
    { label: "Visitor", color: "#A855F7" },
    { label: "Priority", color: "#F97316" },
    { label: "Emergency", color: "#EF4444" },
  ];

  return (
    <div className="relative rounded-2xl overflow-hidden border border-white/[0.06]">
      <div style={{ height: 340 }} className="w-full">
        <MapContainer center={center} zoom={zoom} scrollWheelZoom={false} className="w-full h-full" style={{ background: "#0a0a0c" }}>
          <TileLayer attribution='&copy; CARTO' url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
          {repeater?.latitude != null && (
            <>
              <Marker position={[repeater.latitude, repeater.longitude]} icon={repeaterIcon()}>
                <Popup>
                  <div>
                    <p style={{ fontWeight: 700 }}>{repeater.callsign}</p>
                    <p style={{ color: "#888", fontSize: 11 }}>{repeater.location || ""}</p>
                  </div>
                </Popup>
              </Marker>
              <Circle center={[repeater.latitude, repeater.longitude]} radius={40000} pathOptions={{ color: "#8B5CF6", weight: 1, opacity: 0.4, fillOpacity: 0.05 }} />
            </>
          )}
          {markers.map(({ c, pos, color }) => (
            <Marker key={c.id} position={pos} icon={memberIcon(c, color)}>
              <Popup>
                <div>
                  <p style={{ fontWeight: 700 }}>{c.callsign}</p>
                  {c.location && <p style={{ color: "#888", fontSize: 11 }}>{c.location}</p>}
                  {fmtDistance(c.distance) && <p style={{ fontSize: 11 }}>{fmtDistance(c.distance)}</p>}
                  <p style={{ color, fontSize: 11, textTransform: "capitalize" }}>{(c.status || "checked_in").replace("_", " ")}</p>
                </div>
              </Popup>
            </Marker>
          ))}
          {repeater?.latitude != null && markers.map(({ pos }, i) => (
            <Polyline key={i} positions={[pos, [repeater.latitude, repeater.longitude]]} pathOptions={{ color: "#8B5CF6", weight: 1, opacity: 0.15 }} />
          ))}
        </MapContainer>
      </div>

      <div className="absolute bottom-3 left-3 right-3 rounded-2xl bg-card/80 backdrop-blur-xl border border-white/[0.08] p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-foreground">{checkins.length} Operators</span>
          <span className="text-[10px] text-muted-foreground">{markers.length} mapped</span>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {legend.map((l) => (
            <span key={l.label} className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <span className="w-2 h-2 rounded-full" style={{ background: l.color }} /> {l.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}