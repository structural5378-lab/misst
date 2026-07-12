import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

export default function AnimatedMarker({ position, icon, onClick, zIndexOffset = 0 }) {
  const map = useMap();
  const markerRef = useRef(null);
  const animRef = useRef(null);
  const startRef = useRef(null);
  const targetRef = useRef(null);
  const clickRef = useRef(onClick);

  useEffect(() => { clickRef.current = onClick; }, [onClick]);

  useEffect(() => {
    markerRef.current = L.marker(position, { icon, zIndexOffset, keyboard: false });
    markerRef.current.addTo(map);
    startRef.current = L.latLng(position);
    targetRef.current = L.latLng(position);
    markerRef.current.on("click", () => clickRef.current?.());
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      if (markerRef.current) map.removeLayer(markerRef.current);
    };
  }, []);

  useEffect(() => {
    if (markerRef.current && icon) markerRef.current.setIcon(icon);
  }, [icon]);

  useEffect(() => {
    if (!markerRef.current) return;
    const target = L.latLng(position);
    if (target.equals(targetRef.current)) return;
    startRef.current = markerRef.current.getLatLng();
    targetRef.current = target;
    const startTime = performance.now();
    const duration = 1500;
    if (animRef.current) cancelAnimationFrame(animRef.current);
    const animate = (now) => {
      const t = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const lat = startRef.current.lat + (targetRef.current.lat - startRef.current.lat) * eased;
      const lng = startRef.current.lng + (targetRef.current.lng - startRef.current.lng) * eased;
      markerRef.current.setLatLng([lat, lng]);
      if (t < 1) animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
  }, [position]);

  return null;
}