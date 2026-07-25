import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-draw";
import "leaflet-draw/dist/leaflet.draw.css";

// Leaflet-draw control integrated with react-leaflet. Calls onCreated(shape)
// where shape = { shape:'geojson', geo } or { shape:'circle', center:[lat,lng], radius_m }.
// Supports drawing polygons, rectangles, lines, circles, and markers.
export default function DrawControl({ enabled, onCreated }) {
  const map = useMap();
  const drawnRef = useRef(null);
  const controlRef = useRef(null);

  useEffect(() => {
    if (!enabled) {
      if (controlRef.current) { map.removeControl(controlRef.current); controlRef.current = null; }
      if (drawnRef.current) { drawnRef.current.clearLayers(); }
      return;
    }
    if (!drawnRef.current) drawnRef.current = new L.FeatureGroup();
    map.addLayer(drawnRef.current);

    const options = {
      position: "topright",
      edit: { featureGroup: drawnRef.current, remove: true },
      draw: {
        polygon: { allowIntersection: false, showArea: true },
        rectangle: {},
        polyline: { metric: true },
        circle: { metric: true },
        circlemarker: false,
        marker: {},
      },
    };
    const control = new L.Control.Draw(options);
    controlRef.current = control;
    map.addControl(control);

    const handler = (e) => {
      const layer = e.layer;
      const type = e.layerType;
      drawnRef.current.addLayer(layer);
      if (type === "circle") {
        const c = layer.getLatLng();
        onCreated?.({ shape: "circle", center: [c.lat, c.lng], radius_m: Math.round(layer.getRadius()) });
      } else {
        const gj = layer.toGeoJSON();
        onCreated?.({ shape: "geojson", geo: gj.geometry });
      }
    };
    map.on(L.Draw.Event.CREATED, handler);

    return () => {
      map.off(L.Draw.Event.CREATED, handler);
      if (controlRef.current) { map.removeControl(controlRef.current); controlRef.current = null; }
      if (drawnRef.current) { map.removeLayer(drawnRef.current); drawnRef.current.clearLayers(); }
    };
  }, [map, enabled, onCreated]);

  return null;
}