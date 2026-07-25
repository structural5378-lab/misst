import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";

// Renders a heat-map layer from an array of [lat, lng, intensity?] points.
export default function HeatLayer({ points = [], enabled, radius = 35, blur = 22, maxZoom = 12 }) {
  const map = useMap();
  useEffect(() => {
    if (!enabled || !points.length) return;
    const layer = L.heatLayer(points, { radius, blur, maxZoom, max: 1.0, gradient: { 0.1: "#06b6d4", 0.3: "#22c55e", 0.6: "#f59e0b", 1.0: "#ef4444" } });
    layer.addTo(map);
    return () => { layer.remove(); };
  }, [map, points, enabled, radius, blur, maxZoom]);
  return null;
}