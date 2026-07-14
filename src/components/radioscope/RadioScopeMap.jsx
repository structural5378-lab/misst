import React, { useEffect, useRef, useMemo, useState, useCallback } from "react";
import { MapContainer, TileLayer, Circle, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import AnimatedMarker from "./AnimatedMarker";
import { haversine } from "@/lib/geoUtils";
import { useThemeColors } from "@/hooks/useThemeColors";

const DEFAULT_CENTER = [25.77, -80.19];
const DEFAULT_ZOOM = 11;
const COVERAGE_RADIUS = 25000; // 25 km

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

function createClusterIcon(count) {
  return L.divIcon({
    className: "rs-divicon",
    html: `<div class="rs-cluster-marker">${count}</div>`,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
}

function MapController({ recenterTrigger, userPosition, selectedRepeater, selectedUser }) {
  const map = useMap();
  const firstFix = useRef(true);

  useEffect(() => {
    if (!userPosition) return;
    if (firstFix.current || recenterTrigger > 0) {
      firstFix.current = false;
      map.flyTo(userPosition, Math.max(map.getZoom(), 12), { duration: 1.5 });
    }
  }, [recenterTrigger, userPosition, map]);

  // Fly to selected target when it's outside the current view (e.g. from search)
  useEffect(() => {
    const target = selectedRepeater
      ? [selectedRepeater.latitude, selectedRepeater.longitude]
      : selectedUser
      ? [selectedUser.latitude, selectedUser.longitude]
      : null;
    if (target && target[0] && target[1]) {
      const bounds = map.getBounds();
      if (!bounds.contains(target)) {
        map.flyTo(target, Math.max(map.getZoom(), 13), { duration: 1.2 });
      }
    }
  }, [selectedRepeater, selectedUser, map]);

  return null;
}

function BoundsTracker({ onBoundsChange }) {
  const map = useMap();
  useEffect(() => {
    const update = () => onBoundsChange({ bounds: map.getBounds(), zoom: map.getZoom() });
    map.on("moveend zoomend", update);
    update();
    return () => map.off("moveend zoomend", update);
  }, [map, onBoundsChange]);
  return null;
}

function ClusterMarker({ position, count }) {
  const map = useMap();
  const icon = useMemo(() => createClusterIcon(count), [count]);
  return (
    <AnimatedMarker
      position={position}
      icon={icon}
      onClick={() => map.flyTo(position, map.getZoom() + 2, { duration: 0.8 })}
    />
  );
}

export default function RadioScopeMap({
  userPosition, repeaters, onlineUsers, activeLayers, activeFilter,
  searchQuery, tileMode, recenterTrigger, selectedRepeater, selectedUser,
  onRepeaterClick, onUserClick,
}) {
  const tc = useThemeColors();
  const center = userPosition || DEFAULT_CENTER;
  const repeaterIcon = useMemo(() => createRepeaterIcon(), []);
  const userPosIcon = useMemo(() => createUserPosIcon(), []);
  const [mapBounds, setMapBounds] = useState(null);
  const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM);

  const handleBoundsChange = useCallback((v) => {
    setMapBounds(v.bounds);
    setMapZoom(v.zoom);
  }, []);

  const inBounds = useCallback((lat, lon) => {
    if (!mapBounds) return true;
    return mapBounds.contains([lat, lon]);
  }, [mapBounds]);

  // Lazy-load: only render repeaters within current map bounds
  const filteredRepeaters = useMemo(() => {
    let r = repeaters.filter((rep) => {
      if (!rep.latitude || !rep.longitude) return false;
      if (!inBounds(rep.latitude, rep.longitude)) return false;
      return true;
    });
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      r = r.filter((rep) =>
        rep.callsign?.toLowerCase().includes(q) ||
        String(rep.frequency || "").includes(q) ||
        rep.location?.toLowerCase().includes(q) ||
        rep.community_name?.toLowerCase().includes(q)
      );
    }
    // Always include selected repeater even if panned out of bounds
    if (selectedRepeater && !r.find((rep) => rep.id === selectedRepeater.id)) {
      r = [selectedRepeater, ...r];
    }
    return r;
  }, [repeaters, searchQuery, inBounds, selectedRepeater]);

  const filteredUsers = useMemo(() => {
    let u = onlineUsers.filter((usr) => {
      if (!usr.latitude || !usr.longitude) return false;
      if (!inBounds(usr.latitude, usr.longitude)) return false;
      return true;
    });
    if (activeFilter === "online") u = u.filter((usr) => usr.status === "online" || usr.status === "typing");
    if (activeFilter === "emergency") u = u.filter((usr) => usr.status === "emergency");
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      u = u.filter((usr) => usr.user_name?.toLowerCase().includes(q));
    }
    return u;
  }, [onlineUsers, activeFilter, searchQuery, inBounds]);

  // Cluster users when zoomed out for performance
  const { userClusters, individualUsers } = useMemo(() => {
    if (mapZoom >= 10) return { userClusters: [], individualUsers: filteredUsers };
    const gridSize = 0.5 / Math.pow(2, mapZoom - 5);
    const grid = {};
    filteredUsers.forEach((u) => {
      const key = `${Math.floor(u.latitude / gridSize)},${Math.floor(u.longitude / gridSize)}`;
      if (!grid[key]) grid[key] = [];
      grid[key].push(u);
    });
    const clusters = [];
    const individuals = [];
    Object.values(grid).forEach((users) => {
      if (users.length > 1) {
        const avgLat = users.reduce((s, u) => s + u.latitude, 0) / users.length;
        const avgLon = users.reduce((s, u) => s + u.longitude, 0) / users.length;
        clusters.push({ lat: avgLat, lon: avgLon, count: users.length });
      } else {
        individuals.push(users[0]);
      }
    });
    return { userClusters: clusters, individualUsers: individuals };
  }, [filteredUsers, mapZoom]);

  // RF beams: user → nearest repeater
  const beams = useMemo(() => {
    if (!activeLayers.beams) return [];
    return individualUsers.map((user) => {
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
  }, [individualUsers, filteredRepeaters, activeLayers.beams]);

  // Linked repeaters: repeater ↔ repeater
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

  // Overlap: repeaters whose coverage intersects with selected repeater
  const overlapRepeaters = useMemo(() => {
    if (!selectedRepeater) return [];
    return filteredRepeaters.filter((r) => {
      if (r.id === selectedRepeater.id) return false;
      const d = haversine(selectedRepeater.latitude, selectedRepeater.longitude, r.latitude, r.longitude);
      return d < 50; // within 2× coverage radius
    });
  }, [selectedRepeater, filteredRepeaters]);

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
      style={{ background: tc.background }}
    >
      <TileLayer key={tileMode} url={tileUrl} attribution="&copy; OpenStreetMap, CARTO, Esri" />
      <MapController
        recenterTrigger={recenterTrigger}
        userPosition={userPosition}
        selectedRepeater={selectedRepeater}
        selectedUser={selectedUser}
      />
      <BoundsTracker onBoundsChange={handleBoundsChange} />

      {/* User GPS position with radar sweep */}
      {userPosition && (
        <AnimatedMarker position={userPosition} icon={userPosIcon} zIndexOffset={1000} />
      )}

      {/* Coverage circles (layer toggle) */}
      {activeLayers.coverage && showRepeaters && filteredRepeaters.map((r) => (
        <Circle
          key={`cov-${r.id}`}
          center={[r.latitude, r.longitude]}
          radius={COVERAGE_RADIUS}
          pathOptions={{
            color: r.id === selectedRepeater?.id ? tc.accent : tc.primary,
            fillColor: r.id === selectedRepeater?.id ? tc.accent : tc.primary,
            fillOpacity: r.id === selectedRepeater?.id ? 0.08 : 0.04,
            weight: r.id === selectedRepeater?.id ? 2 : 1,
            dashArray: "4 4",
          }}
          className={r.id === selectedRepeater?.id ? "rs-coverage-selected" : ""}
        />
      ))}

      {/* Selected repeater coverage — always visible when selected */}
      {selectedRepeater && !activeLayers.coverage && (
        <Circle
          center={[selectedRepeater.latitude, selectedRepeater.longitude]}
          radius={COVERAGE_RADIUS}
          pathOptions={{ color: tc.accent, fillColor: tc.accent, fillOpacity: 0.08, weight: 2, dashArray: "6 6" }}
          className="rs-coverage-selected"
        />
      )}

      {/* Overlap indicators: dashed lines to repeaters with intersecting coverage */}
      {selectedRepeater && overlapRepeaters.map((r) => (
        <Polyline
          key={`overlap-${r.id}`}
          positions={[
            [selectedRepeater.latitude, selectedRepeater.longitude],
            [r.latitude, r.longitude],
          ]}
          pathOptions={{ color: tc.accent, weight: 1.5, opacity: 0.4, dashArray: "2 8" }}
        />
      ))}

      {/* Repeater markers */}
      {showRepeaters && filteredRepeaters.map((r) => (
        <AnimatedMarker
          key={r.id}
          position={[r.latitude, r.longitude]}
          icon={repeaterIcon}
          onClick={() => onRepeaterClick(r)}
        />
      ))}

      {/* Individual user markers (zoomed in) */}
      {showUsers && individualUsers.map((u) => (
        <AnimatedMarker
          key={u.user_uid || u.id}
          position={[u.latitude, u.longitude]}
          icon={createUserIcon(u)}
          onClick={() => onUserClick(u)}
        />
      ))}

      {/* Cluster markers (zoomed out) */}
      {showUsers && userClusters.map((c, i) => (
        <ClusterMarker key={`cluster-${i}`} position={[c.lat, c.lon]} count={c.count} />
      ))}

      {/* RF beams with signal pulse */}
      {beams.map((b) => (
        <Polyline
          key={b.key}
          positions={b.positions}
          pathOptions={{ color: tc.accent, weight: 1, opacity: 0.5, dashArray: "4 4" }}
          className="rs-beam"
        />
      ))}

      {/* Linked repeater lines */}
      {linkedRepeaters.map((l) => (
        <Polyline
          key={l.key}
          positions={l.positions}
          pathOptions={{ color: tc.primary, weight: 1, opacity: 0.25, dashArray: "2 6" }}
        />
      ))}
    </MapContainer>
  );
}