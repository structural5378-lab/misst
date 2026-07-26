import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Layers, Crosshair, Bug } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useMistUser } from "@/hooks/useMistUser";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import RadioScopeStartup from "@/components/radioscope/RadioScopeStartup";
import RadioScopeMap from "@/components/radioscope/RadioScopeMap";
import RadioScopeSearch from "@/components/radioscope/RadioScopeSearch";
import RadioScopeLayers from "@/components/radioscope/RadioScopeLayers";
import RepeaterSheet from "@/components/radioscope/RepeaterSheet";
import UserSheet from "@/components/radioscope/UserSheet";
import RadioScopeDebugPanel from "@/components/radioscope/RadioScopeDebugPanel";
import {
  GPS_WATCH_OPTS, GPS_UPDATE_THROTTLE_MS, LOCATION_TTL_MS,
  classifySource, getLiveUsers,
} from "@/lib/radioScopeLocation";

const DEFAULT_CENTER = [25.77, -80.19];

export default function RadioScope() {
  const { mybbUser } = useMistUser();
  const [userPosition, setUserPosition] = useState(null);
  const [myFix, setMyFix] = useState(null); // last raw GPS fix for debug panel
  const [selectedRepeater, setSelectedRepeater] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeLayers, setActiveLayers] = useState({
    repeaters: true, users: true, coverage: false, beams: true, lightning: true,
  });
  const [activeFilter, setActiveFilter] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [tileMode, setTileMode] = useState("dark");
  const [showLayers, setShowLayers] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [recenterTrigger, setRecenterTrigger] = useState(0);
  const [nowTick, setNowTick] = useState(Date.now()); // recomputes age-based expiration

  const watchIdRef = useRef(null);
  const lastUpdateRef = useRef(0);
  const clearingRef = useRef(false);

  const myUid = String(mybbUser?.uid || "");

  // ── Presence data: poll + realtime subscription for instant marker updates ──
  const { data: presenceData = [] } = useQuery({
    queryKey: ["chat-presence"],
    queryFn: () => base44.entities.ChatPresence.list("-last_active", 200),
    refetchInterval: 8000,
  });

  const qc = useQueryClient();
  useEffect(() => {
    // Realtime: invalidate presence on any ChatPresence mutation so markers move/remove instantly
    const unsub = base44.entities.ChatPresence.subscribe((event) => {
      qc.invalidateQueries({ queryKey: ["chat-presence"] });
    });
    return unsub;
  }, [qc]);

  // ── Tick to re-evaluate age-based expiration between polls ──
  useEffect(() => {
    const t = setInterval(() => setNowTick(Date.now()), 3000);
    return () => clearInterval(t);
  }, []);

  // ── Push validated live GPS to server (throttled) ──
  const pushLocation = useCallback((pos) => {
    const t = Date.now();
    if (t - lastUpdateRef.current < GPS_UPDATE_THROTTLE_MS) return;
    lastUpdateRef.current = t;
    const source = classifySource(pos.coords.accuracy);
    base44.functions.invoke("updateUserLocation", {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      speed: pos.coords.speed,
      heading: pos.coords.heading,
      source,
      timestamp: pos.timestamp || t,
    }).catch(() => {});
  }, []);

  // ── Clear my location on the server ──
  const clearLocation = useCallback(() => {
    if (clearingRef.current) return;
    clearingRef.current = true;
    base44.functions.invoke("clearUserLocation").catch(() => {}).finally(() => {
      clearingRef.current = false;
    });
  }, []);

  // ── GPS watch: live, high-accuracy, no cache ──
  useEffect(() => {
    if (!navigator.geolocation) return;
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const pos2 = [pos.coords.latitude, pos.coords.longitude];
        setUserPosition(pos2);
        setMyFix({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          speed: pos.coords.speed,
          heading: pos.coords.heading,
          source: classifySource(pos.coords.accuracy),
          timestamp: pos.timestamp || Date.now(),
        });
        pushLocation(pos);
      },
      (err) => {
        // Permission denied / unavailable → remove myself from the map immediately
        if (err.code === err.PERMISSION_DENIED) clearLocation();
      },
      GPS_WATCH_OPTS
    );
    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [pushLocation, clearLocation]);

  // ── Clear on app close / tab hidden / logout ──
  useEffect(() => {
    const onVisibility = () => { if (document.visibilityState === "hidden") clearLocation(); };
    const onUnload = () => { clearLocation(); };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("beforeunload", onUnload);
    window.addEventListener("pagehide", onUnload);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("beforeunload", onUnload);
      window.removeEventListener("pagehide", onUnload);
      clearLocation(); // clear on unmount (navigating away / logout)
    };
  }, [clearLocation]);

  // ── Fetch repeaters ──
  const { data: repeaters = [] } = useQuery({
    queryKey: ["repeaters"],
    queryFn: () => base44.entities.Repeater.list("-created_date", 200),
    refetchInterval: 30000,
  });

  // ── Fetch lightning strikes (real-time refresh) ──
  const { data: strikes = [] } = useQuery({
    queryKey: ["lightning-strikes"],
    queryFn: () => base44.entities.LightningStrike.list("-strike_time", 500),
    refetchInterval: 15000,
  });

  // ── Notification deep link: ?strike=<id> centers the map on a strike ──
  const [focusStrikeId, setFocusStrikeId] = useState(
    () => new URLSearchParams(window.location.search).get("strike")
  );
  const focusStrike = useMemo(
    () => strikes.find((s) => s.id === focusStrikeId) || null,
    [strikes, focusStrikeId]
  );

  // ── LIVE USERS ONLY: no simulation, no cached, no expired ──
  const onlineUsers = useMemo(
    () => getLiveUsers(presenceData, { now: nowTick, ttl: LOCATION_TTL_MS, excludeUid: myUid }),
    [presenceData, nowTick, myUid]
  );

  const myPresence = useMemo(
    () => (presenceData || []).find((p) => p.user_uid === myUid) || null,
    [presenceData, myUid]
  );

  const handleRecenter = useCallback(() => setRecenterTrigger((t) => t + 1), []);

  return (
    <RadioScopeStartup>
      <div className="fixed inset-0 z-[55] bg-black overflow-hidden" style={{ height: "100dvh" }}>
        <div className="absolute inset-0 z-0">
          <RadioScopeMap
            userPosition={userPosition}
            repeaters={repeaters}
            onlineUsers={onlineUsers}
            activeLayers={activeLayers}
            activeFilter={activeFilter}
            searchQuery={searchQuery}
            tileMode={tileMode}
            recenterTrigger={recenterTrigger}
            selectedRepeater={selectedRepeater}
            selectedUser={selectedUser}
            onRepeaterClick={setSelectedRepeater}
            onUserClick={setSelectedUser}
            strikes={strikes}
            focusStrike={focusStrike}
            focusStrikeId={focusStrikeId}
            now={nowTick}
            onStrikeClick={(s) => setFocusStrikeId(s.id)}
          />
        </div>

        {/* Header */}
        <header
          className="absolute top-0 left-0 right-0 z-30 flex items-center gap-3 px-4 py-2.5 bg-black/70 backdrop-blur-md border-b border-cyan-500/10"
          style={{ paddingTop: "calc(0.625rem + env(safe-area-inset-top))" }}
        >
          <Link to="/" className="p-2 -m-1 text-cyan-400">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div className="flex-1">
            <h1 className="text-base font-bold text-cyan-300 tracking-wide">RadioScope</h1>
            <p className="text-[10px] text-cyan-500/70 tracking-widest uppercase">Live GPS · {onlineUsers.length} operators</p>
          </div>
          <button onClick={() => setShowDebug((v) => !v)} className="p-2 text-cyan-400">
            <Bug className="w-6 h-6" />
          </button>
          <button onClick={() => setShowLayers(true)} className="p-2 text-cyan-400">
            <Layers className="w-6 h-6" />
          </button>
        </header>

        {/* Search + Filters */}
        <div className="absolute left-0 right-0 z-20 px-3" style={{ top: "calc(3.5rem + env(safe-area-inset-top))" }}>
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

        {/* Admin debug panel */}
        {showDebug && (
          <RadioScopeDebugPanel
            myFix={myFix}
            myPresence={myPresence}
            liveUsers={onlineUsers}
            allPresence={presenceData}
            now={nowTick}
          />
        )}

        {/* Recenter button */}
        <button
          onClick={handleRecenter}
          className="absolute right-4 z-20 w-12 h-12 rounded-full bg-black/80 backdrop-blur border border-cyan-500/30 flex items-center justify-center text-cyan-400 active:scale-90 transition-transform"
          style={{ bottom: "calc(5rem + env(safe-area-inset-bottom))" }}
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
            now={nowTick}
            onClose={() => setSelectedUser(null)}
          />
        )}
      </div>
    </RadioScopeStartup>
  );
}