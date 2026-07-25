import React, { useState } from "react";
import { MapContainer, TileLayer, Circle, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Radio } from "lucide-react";

const LAYERS = {
  streets: { url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", attr: "&copy; OpenStreetMap" },
  satellite: { url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", attr: "Esri World Imagery" },
  hybrid: { url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", attr: "Esri" },
  terrain: { url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", attr: "&copy; OpenTopoMap (CC-BY-SA)" },
  topographic: { url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}", attr: "Esri World Topo" },
};
const LABELS_URL = "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}";
const STATUS_COLOR = { online: "#22c55e", offline: "#ef4444", busy: "#f59e0b" };

export default function RadioScopeMap({ repeaters = [], selectedId, onSelect }) {
  const [layer, setLayer] = useState("streets");
  const points = repeaters.filter((r) => r.latitude != null && r.longitude != null);
  const center = points[0] ? [points[0].latitude, points[0].longitude] : [39.5, -98.35];
  const cur = LAYERS[layer];

  return (
    <div className="rounded-2xl overflow-hidden border border-border bg-card">
      <div className="flex flex-wrap gap-1 p-2 bg-card/60 border-b border-border">
        {Object.keys(LAYERS).map((k) => (
          <button
            key={k}
            onClick={() => setLayer(k)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize transition-colors ${layer === k ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
          >
            {k}
          </button>
        ))}
      </div>
      <div className="h-[380px] sm:h-[520px]">
        <MapContainer center={center} zoom={points[0] ? 11 : 4} scrollWheelZoom className="w-full h-full">
          <TileLayer key={layer} url={cur.url} attribution={cur.attr} />
          {layer === "hybrid" && <TileLayer url={LABELS_URL} attribution="Esri" />}
          {points.map((r) => {
            const radM = (r.coverage_radius || 0) * 1609.34;
            const showCov = r.coverage_visible !== false && radM > 0;
            const col = r.coverage_color || "#8B5CF6";
            const op = r.coverage_opacity ?? 0.18;
            const sel = selectedId === r.id;
            return (
              <React.Fragment key={r.id}>
                {showCov && (
                  <Circle center={[r.latitude, r.longitude]} radius={radM} pathOptions={{ color: col, fillColor: col, fillOpacity: op, weight: 1 }} />
                )}
                <CircleMarker
                  center={[r.latitude, r.longitude]}
                  radius={sel ? 8 : 6}
                  pathOptions={{ color: STATUS_COLOR[r.status] || "#8B5CF6", fillOpacity: 0.95, weight: sel ? 3 : 1 }}
                  eventHandlers={{ click: () => onSelect?.(r) }}
                >
                  <Popup>
                    <div className="text-xs space-y-0.5">
                      <div className="font-bold text-sm flex items-center gap-1"><Radio className="w-3 h-3" /> {r.callsign}</div>
                      <div>{r.frequency ? `${r.frequency} MHz` : ""}{r.offset ? ` · ${r.offset}` : ""}{r.tone ? ` · ${r.tone}` : ""}</div>
                      {r.location && <div className="text-muted-foreground">{r.location}</div>}
                      <div className="capitalize">{r.status}</div>
                      {r.community_name && <div className="text-muted-foreground">{r.community_name}</div>}
                    </div>
                  </Popup>
                </CircleMarker>
              </React.Fragment>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}