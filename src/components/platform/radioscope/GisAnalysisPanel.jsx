import React, { useMemo } from "react";
import * as turf from "@turf/turf";

// GIS analysis panel — computes geofence areas, repeater containment, and
// coverage statistics using Turf.js.
function parseGeo(g) {
  try { return typeof g.geo === "string" ? JSON.parse(g.geo) : g.geo; } catch { return null; }
}

export default function GisAnalysisPanel({ repeaters = [], geofences = [] }) {
  const stats = useMemo(() => {
    const repPoints = repeaters.filter((r) => r.latitude != null && r.longitude != null);
    let totalAreaKm2 = 0;
    let repInGeofence = 0;
    let geoPolygons = 0;
    let geoCircles = 0;

    for (const g of geofences) {
      const geo = parseGeo(g);
      if (!geo) continue;
      if (g.shape === "circle" && geo.center) {
        geoCircles++;
        const areaKm2 = Math.PI * Math.pow((geo.radius_m || 0) / 1000, 2);
        totalAreaKm2 += areaKm2;
        for (const r of repPoints) {
          const d = turf.distance(turf.point([geo.center[1], geo.center[0]]), turf.point([r.longitude, r.latitude]), { units: "kilometers" });
          if (d * 1000 <= (geo.radius_m || 0)) repInGeofence++;
        }
      } else if (geo?.type === "Polygon" || geo?.type === "MultiPolygon") {
        try {
          const poly = geo.type === "MultiPolygon" ? turf.multiPolygon(geo.coordinates) : turf.polygon(geo.coordinates);
          totalAreaKm2 += turf.area(poly) / 1e6;
          geoPolygons++;
          for (const r of repPoints) {
            if (turf.booleanPointInPolygon([r.longitude, r.latitude], poly)) repInGeofence++;
          }
        } catch {}
      }
    }

    // Nearest-neighbour distance among geolocated repeaters (coverage planning)
    let minPairKm = null;
    if (repPoints.length >= 2) {
      for (let i = 0; i < repPoints.length; i++) {
        for (let j = i + 1; j < repPoints.length; j++) {
          const d = turf.distance([repPoints[i].longitude, repPoints[i].latitude], [repPoints[j].longitude, repPoints[j].latitude], { units: "kilometers" });
          if (minPairKm === null || d < minPairKm) minPairKm = d;
        }
      }
    }

    return {
      geofenceCount: geofences.length,
      geoPolygons, geoCircles,
      totalAreaKm2: totalAreaKm2.toFixed(1),
      repInGeofence,
      repTotal: repPoints.length,
      minPairKm: minPairKm !== null ? minPairKm.toFixed(1) : null,
    };
  }, [repeaters, geofences]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {[
        { label: "Geofences", value: stats.geofenceCount },
        { label: "Polygons", value: stats.geoPolygons },
        { label: "Circles", value: stats.geoCircles },
        { label: "Area (km²)", value: stats.totalAreaKm2 },
        { label: "Repeaters in Geofence", value: `${stats.repInGeofence}/${stats.repTotal}` },
        { label: "Min Repeater Spacing", value: stats.minPairKm ? `${stats.minPairKm} km` : "—" },
      ].map((s) => (
        <div key={s.label} className="rounded-2xl border border-border bg-card p-3">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{s.label}</p>
          <p className="text-lg font-bold text-foreground mt-0.5">{s.value}</p>
        </div>
      ))}
    </div>
  );
}