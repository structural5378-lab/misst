import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Layers, Crosshair } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useMyBBAuth } from "@/lib/MyBBAuthContext";
import { useQuery } from "@tanstack/react-query";
import RadioScopeMap from "@/components/radioscope/RadioScopeMap";
import RadioScopeSearch from "@/components/radioscope/RadioScopeSearch";
import RadioScopeLayers from "@/components/radioscope/RadioScopeLayers";
import RepeaterSheet from "@/components/radioscope/RepeaterSheet";
import UserSheet from "@/components/radioscope/UserSheet";

const DEFAULT_CENTER = [25.77, -80.19];

export default function RadioScope() {
  const { mybbUser } = useMyBBAuth();
  const [userPosition, setUserPosition] = useState(null);
  const [selectedRepeater, setSelectedRepeater] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeLayers, setActiveLayers] = useState({
    repeaters: true, users: true, coverage: false, beams: true,
  });
  const [activeFilter, setActiveFilter] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [tileMode, setTileMode] = useState("dark");
  const [showLayers, setShowLayers] = useState(false);
  const [recenterTrigger, setRecenterTrigger] = useState(0);
  const watchIdRef = useRef(null);
  const presenceIdRef = useRef(null);
  const lastPresenceUpdateRef = useRef(0);
  const [simSeed, setSimSeed] = useState(0);

  const myUid = String(mybbUser?.uid || "");

  // GPS tracking
  useEffect(() => {
    if (!navigator.geolocation) return;
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => setUserPosition([pos.coords.latitude, pos.coords.longitude]),
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  // Fetch repeaters
  const { data: repeaters = [] } = useQuery({
    queryKey: ["repeaters"],
    queryFn: () => base44.entities.Repeater.list("-created_date", 200),
    refetchInterval: 30000,
  });

  // Fetch online users
  const { data: presenceData = [] } = useQuery({
    queryKey: ["chat-presence"],
    queryFn: () => base44.entities.ChatPresence.list("-last_active", 100),
    refetchInterval: 10000,
  });

  // Update user's presence with GPS
  useEffect(() => {
    if (!mybbUser?.uid || !userPosition) return;
    const now = Date.now();
    if (now - lastPresenceUpdateRef.current < 8000) return;
    lastPresenceUpdateRef.current = now;
    (async () => {
      try {
        if (presenceIdRef.current) {
          await base44.entities.ChatPresence.update(presenceIdRef.current, {
            latitude: userPosition[0], longitude: userPosition[1],
            last_active: new Date().toISOString(),
          });
        } else {
          const existing = await base44.entities.ChatPresence.filter({ user_uid: String(mybbUser.uid) });
          if (existing.length > 0) {
            presenceIdRef.current = existing[0].id;
            await base44.entities.ChatPresence.update(existing[0].id, {
              latitude: userPosition[0], longitude: userPosition[1],
              last_active: new Date().toISOString(),
            });
          }
        }
      } catch {}
    })();
  }, [userPosition, mybbUser?.uid]);

  // Assign presenceId from fetched data
  useEffect(() => {
    if (!presenceIdRef.current && presenceData.length > 0 && mybbUser?.uid) {
      const mine = presenceData.find((p) => p.user_uid === String(mybbUser.uid));
      if (mine) presenceIdRef.current = mine.id;
    }
  }, [presenceData, mybbUser?.uid]);

  // Simulate positions for users without location, update every 5s
  useEffect(() => {
    const t = setInterval(() => setSimSeed((s) => s + 1), 5000);
    return () => clearInterval(t);
  }, []);

  const onlineUsers = useMemo(() => {
    const center = userPosition || DEFAULT_CENTER;
    return presenceData
      .filter((p) => p.user_uid !== myUid && p.status !== "offline")
      .map((p, i) => {
        if (p.latitude && p.longitude) return p;
        const angle = ((i * 137.5 + simSeed * 23) * Math.PI) / 180;
        const dist = 1 + ((i + simSeed) % 5) * 1.5;
        const lat = center[0] + (dist / 111) * Math.cos(angle);
        const lon = center[1] + (dist / (111 * Math.cos((center[0] * Math.PI) / 180))) * Math.sin(angle);
        return { ...p, latitude: lat, longitude: lon };
      });
  }, [presenceData, userPosition, myUid, simSeed]);

  const handleRecenter = useCallback(() => setRecenterTrigger((t) => t + 1), []);

  return (
    <div className="fixed inset-0 z-[55] bg-black overflow-hidden" style={{ height: "100dvh" }}>
      <div className="absolute inset-0">
        <RadioScopeMap
          userPosition={userPosition}
          repeaters={repeaters}
          onlineUsers={onlineUsers}
          activeLayers={activeLayers}
          activeFilter={activeFilter}
          searchQuery={searchQuery}
          tileMode={tileMode}
          recenterTrigger={recenterTrigger}
          onRepeaterClick={setSelectedRepeater}
          onUserClick={setSelectedUser}
        />
      </div>

      {/* Header */}
      <header
        className="absolute top-0 left-0 right-0 z-10 flex items-center gap-3 px-4 py-2.5"
        style={{ paddingTop: "calc(0.625rem + env(safe-area-inset-top))" }}
      >
        <Link to="/" className="p-2 -m-1 text-cyan-400">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div className="flex-1">
          <h1 className="text-base font-bold text-cyan-300 tracking-wide">RadioScope</h1>
          <p className="text-[10px] text-cyan-500/70 tracking-widest uppercase">Tactical RF Map</p>
        </div>
        <button onClick={() => setShowLayers(true)} className="p-2 text-cyan-400">
          <Layers className="w-6 h-6" />
        </button>
      </header>

      {/* Search + Filters */}
      <div className="absolute top-14 left-0 right-0 z-10 px-3">
        <RadioScopeSearch
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          repeaters={repeaters}
          onlineUsers={onlineUsers}
          onResultClick={(r) => {
            if (r.type === "repeater") setSelectedRepeater(r);
            else setSelectedUser(r);
          }}
        />
      </div>

      {/* Recenter button */}
      <button
        onClick={handleRecenter}
        className="absolute bottom-6 right-4 z-10 w-12 h-12 rounded-full bg-black/80 backdrop-blur border border-cyan-500/30 flex items-center justify-center text-cyan-400 active:scale-90 transition-transform"
        style={{ bottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
      >
        <Crosshair className="w-6 h-6" />
      </button>

      {/* Layer panel */}
      {showLayers && (
        <RadioScopeLayers
          activeLayers={activeLayers}
          onLayerChange={setActiveLayers}
          tileMode={tileMode}
          onTileModeChange={setTileMode}
          onClose={() => setShowLayers(false)}
        />
      )}

      {/* Sheets */}
      {selectedRepeater && (
        <RepeaterSheet
          repeater={selectedRepeater}
          userPosition={userPosition}
          onlineUsers={onlineUsers}
          repeaters={repeaters}
          onClose={() => setSelectedRepeater(null)}
        />
      )}
      {selectedUser && (
        <UserSheet
          user={selectedUser}
          userPosition={userPosition}
          repeaters={repeaters}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  );
}