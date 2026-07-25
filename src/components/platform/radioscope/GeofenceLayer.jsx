import React from "react";
import { Polygon, Polyline, Circle, Marker, Tooltip } from "react-leaflet";

// Renders saved geofences (geojson polygons/lines/points + circles) on the map.
function parseGeo(geofence) {
  try { return typeof geofence.geo === "string" ? JSON.parse(geofence.geo) : geofence.geo; }
  catch { return null; }
}

export default function GeofenceLayer({ geofences = [], onDelete }) {
  return (
    <>
      {geofences.map((g) => {
        const geo = parseGeo(g);
        if (!geo) return null;
        const color = g.color || "#06B6D4";
        const name = g.name || "Geofence";
        if (g.shape === "circle" && geo.center) {
          return (
            <Circle key={g.id} center={geo.center} radius={geo.radius_m || 1000}
              pathOptions={{ color, fillColor: color, fillOpacity: 0.12, weight: 2 }}>
              <Tooltip sticky>{name}</Tooltip>
            </Circle>
          );
        }
        if (!geo.type) return null;
        if (geo.type === "Polygon") {
          const rings = geo.coordinates.map((ring) => ring.map(([lon, lat]) => [lat, lon]));
          return (
            <Polygon key={g.id} positions={rings} pathOptions={{ color, fillColor: color, fillOpacity: 0.12, weight: 2 }}>
              <Tooltip sticky>{name}</Tooltip>
            </Polygon>
          );
        }
        if (geo.type === "LineString") {
          return (
            <Polyline key={g.id} positions={geo.coordinates.map(([lon, lat]) => [lat, lon])} pathOptions={{ color, weight: 3 }}>
              <Tooltip sticky>{name}</Tooltip>
            </Polyline>
          );
        }
        if (geo.type === "Point") {
          return (
            <Marker key={g.id} position={[geo.coordinates[1], geo.coordinates[0]]}>
              <Tooltip sticky>{name}</Tooltip>
            </Marker>
          );
        }
        if (geo.type === "MultiPolygon") {
          return geo.coordinates.map((poly, i) => (
            <Polygon key={`${g.id}-${i}`} positions={poly.map((ring) => ring.map(([lon, lat]) => [lat, lon]))}
              pathOptions={{ color, fillColor: color, fillOpacity: 0.12, weight: 2 }}>
              <Tooltip sticky>{name}</Tooltip>
            </Polygon>
          ));
        }
        return null;
      })}
    </>
  );
}