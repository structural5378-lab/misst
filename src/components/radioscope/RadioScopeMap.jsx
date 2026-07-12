import React, { useEffect, useRef, useMemo } from "react";
import { MapContainer, TileLayer, Circle, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import AnimatedMarker from "./AnimatedMarker";
import { haversine } from "@/lib/geoUtils";

const DEFAULT_CENTER = [25.77, -80.19];
const DEFAULT_ZOOM = 11;
const COVERAGE_RADIUS = 25000;

function createRepeaterIcon() {
  return L.divIcon({
    className: "rs-divicon",
    html: `<div class="rs-repeater-marker"><div class="rs-repeater-pulse"></div><svg class="rs-repeater-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 21h14M7 21l5-15 5 15M9 13h6"/><circle cx="12" cy="4" r="1.5"/></svg></div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
}

function createUserIcon(user) {
  const status = user.status || "online";
  const avatar = user.user_avatar
    ? `<img src="${user.user_avatar}" class="rs-user-avatar" />`
    : `<span class="rs-user-initials">${(user.user_name || "?").charAt(0).toUpperCase()}</span>`;
  return L.divIcon({
    className: "rs-divicon",
    html: `<div class="rs-user-marker rs-status-${status}"><div class="rs-user-glow"></div>${avatar}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

function createUserPosIcon() {
  return L.divIcon({
    className: "rs-divicon",
    html: `<div class="rs-user-pos"><div class="rs-radar-sweep"></div><div class="rs-user-pos-ring"></div><div class="rs-user-pos-dot"></div></div>`,
    iconSize: [120, 120],
    iconAnchor: [60, 60],
  });
}

function MapController({ recenterTrigger, userPosition }) {
  const map = useMap();
  const firstFix = useRef(true);
  useEffect(() => {
    if (!userPosition) return;
    if (firstFix.current || recenterTrigger > 0) {
      firstFix.current = false;
      map.flyTo(userPosition, Math.max(map.getZoom(), 12), { duration: 1.5 });
    }
  }, [recenterTrigger, userPosition]);
  return null;
}

export default function RadioScopeMap({
  userPosition, repeaters, onlineUsers, activeLayers, activeFilter,
  searchQuery, tileMode, recenterTrigger, onRepeaterClick, onUserClick,
}) {
  const center = userPosition || DEFAULT_CENTER;
  const repeaterIcon = useMemo(() => createRepeaterIcon(), []);
  const userPosIcon = useMemo(() => createUserPosIcon(), []);

  const filteredRepeaters = useMemo(() => {
    let r = repeaters.filter((r) => r.latitude && r.longitude);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      r = r.filter((r) =>
        r.callsign?.toLowerCase().includes(q) ||
        String(r.frequency || "").includes(q) ||
        r.location?.toLowerCase().includes(q) ||
        r.community_name?.toLowerCase().includes(q)
      );
    }
    return r;
  }, [repeaters, searchQuery]);

  const filteredUsers = useMemo(() => {
    let u = onlineUsers.filter((u) => u.latitude && u.longitude);
    if (activeFilter === "online") u = u.filter((u) => u.status === "online" || u.status === "typing");
    if (activeFilter === "emergency") u = u.filter((u) => u.status === "emergency");
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      u = u.filter((u) => u.user_name?.toLowerCase().includes(q));
    }
    return u;
  }, [onlineUsers, activeFilter, searchQuery]);

  const beams = useMemo(() => {
    if (!activeLayers.beams) return [];
    return filteredUsers.map((user) => {
      let nearest = null;
      for (const rep of filteredRepeaters) {
        const d = haversine(user.latitude, user.longitude, rep.latitude, rep.longitude);
        if (!nearest || d < nearest.dist) nearest = { rep, dist: d };
      }
      if (!nearest || nearest.dist > 80) return null;
      return {
        positions: [[user.latitude, user.longitude], [nearest.rep.latitude, nearest.rep.longitude]],
        key: `beam-${user.user_uid}`,
      };
    }).filter(Boolean);
  }, [filteredUsers, filteredRepeaters, activeLayers.beams]);

  const linkedRepeaters = useMemo(() => {
    if (!activeLayers.beams) return [];
    const links = [];
    for (let i = 0; i < filteredRepeaters.length; i++) {
      for (let j = i + 1; j < filteredRepeaters.length; j++) {
        const d = haversine(
          filteredRepeaters[i].latitude, filteredRepeaters[i].longitude,
          filteredRepeaters[j].latitude, filteredRepeaters[j].longitude
        );
        if (d < 50) {
          links.push({
            positions: [
              [filteredRepeaters[i].latitude, filteredRepeaters[i].longitude],
              [filteredRepeaters[j].latitude, filteredRepeaters[j].longitude],
            ],
            key: `link-${filteredRepeaters[i].id}-${filteredRepeaters[j].id}`,
          });
        }
      }
    }
    return links;
  }, [filteredRepeaters, activeLayers.beams]);

  const showRepeaters = activeLayers.repeaters && activeFilter !== "online" && activeFilter !== "emergency";
  const showUsers = activeLayers.users && activeFilter !== "repeaters";

  const tileUrl =
    tileMode === "satellite"
      ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      : tileMode === "terrain"
      ? "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
      : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

  return (
    <MapContainer
      center={center}
      zoom={DEFAULT_ZOOM}
      zoomControl={false}
      className="w-full h-full"
      style={{ background: "#000" }}
    >
      <TileLayer key={tileMode} url={tileUrl} attribution="&copy; OpenStreetMap, CARTO, Esri" />
      <MapController recenterTrigger={recenterTrigger} userPosition={userPosition} />

      {userPosition && (
        <AnimatedMarker position={userPosition} icon={userPosIcon} zIndexOffset={1000} />
      )}

      {activeLayers.coverage && showRepeaters && filteredRepeaters.map((r) => (
        <Circle
          key={`cov-${r.id}`}
          center={[r.latitude, r.longitude]}
          radius={COVERAGE_RADIUS}
          pathOptions={{ color: "#8b5cf6", fillColor: "#8b5cf6", fillOpacity: 0.04, weight: 1, dashArray: "4 4" }}
        />
      ))}

      {showRepeaters && filteredRepeaters.map((r) => (
        <AnimatedMarker
          key={r.id}
          position={[r.latitude, r.longitude]}
          icon={repeaterIcon}
          onClick={() => onRepeaterClick(r)}
        />
      ))}

      {showUsers && filteredUsers.map((u) => (
        <AnimatedMarker
          key={u.user_uid || u.id}
          position={[u.latitude, u.longitude]}
          icon={createUserIcon(u)}
          onClick={() => onUserClick(u)}
        />
      ))}

      {beams.map((b) => (
        <Polyline
          key={b.key}
          positions={b.positions}
          pathOptions={{ color: "#06b6d4", weight: 1, opacity: 0.5, dashArray: "4 4" }}
          className="rs-beam"
        />
      ))}

      {linkedRepeaters.map((l) => (
        <Polyline
          key={l.key}
          positions={l.positions}
          pathOptions={{ color: "#8b5cf6", weight: 1, opacity: 0.25, dashArray: "2 6" }}
        />
      ))}
    </MapContainer>
  );
}