import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Layers, Crosshair, Bug } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { mist } from '@/api/mist';
import { useMistUser } from "@/hooks/useMistUser";
import { useUserCommunities } from "@/hooks/useUserCommunities";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import RadioScopeStartup from "@/components/radioscope/RadioScopeStartup";
import RadioScopeMap from "@/components/radioscope/RadioScopeMap";
import RadioScopeSearch from "@/components/radioscope/RadioScopeSearch";
import RadioScopeLayers from "@/components/radioscope/RadioScopeLayers";
import RepeaterSheet from "@/components/radioscope/RepeaterSheet";
import UserSheet from "@/components/radioscope/UserSheet";
import RadioScopeDebugPanel from "@/components/radioscope/RadioScopeDebugPanel";
import RadioScopeCommunitySelector from "@/components/radioscope/RadioScopeCommunitySelector";
import RadioScopeStatsBar from "@/components/radioscope/RadioScopeStatsBar";
import { useLightningProximity } from "@/hooks/useLightningProximity";
import { buildLightingEvent } from "@/lib/lightning/lightningSeverity";
import { dispatchLightingEvent } from "@/lib/lighting/lightingEvents";
import { useRealtimeLightningStrikes } from "@/hooks/useRealtimeLightningStrikes";
import { SCOPE_RADIUS_MI } from "@/lib/lightning/proximityConfig";
import {
  GPS_WATCH_OPTS, GPS_UPDATE_THROTTLE_MS, LOCATION_TTL_MS,
  classifySource, getLiveUsers,
} from "@/lib/radioScopeLocation";
import { usePollingGate } from "@/hooks/usePollingGate";

const DEFAULT_CENTER = [25.77, -80.19];

export default function RadioScope() {
  const { mybbUser, mistUser } = useMistUser();
  const { data: communities = [] } = useUserCommunities();
  const active = usePollingGate();

  // ── Active community (localStorage source of truth + in-page switcher) ──
  const [activeId, setActiveId] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("selected_community_id") : null
  );
  useEffect(() => {
    const sync = () => setActiveId(localStorage.getItem("selected_community_id"));
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  const community = useMemo(
    () => communities.find((c) => c.id === activeId) || communities[0] || null,
    [communities, activeId]
  );
  const switchCommunity = useCallback((c) => {
    if (!c?.id) return;
    localStorage.setItem("selected_community_id", c.id);
    localStorage.setItem("selected_community_name", c.name || "");
    setActiveId(c.id);
    // cross-tab + cross-component sync
    window.dispatchEvent(new StorageEvent("storage", { key: "selected_community_id", newValue: c.id }));
  }, []);

  const [userPosition, setUserPosition] = useState(null);
  const [myFix, setMyFix] = useState(null);
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
  const [nowTick, setNowTick] = useState(Date.now());

  const watchIdRef = useRef(null);
  const lastUpdateRef = useRef(0);
  const clearingRef = useRef(false);

  const myUid = String(mybbUser?.uid || mistUser?.id || "");

  // ── Community-scoped RadioScope data (single secure backend call) ──
  // Keyed by community.id → switching communities drops old data + refetches.
  const qc = useQueryClient();
  const { data: scope, isLoading: scopeLoading } = useQuery({
    queryKey: ["radioscope", community?.id],
    queryFn: async () => {
      const res = await base44.functions.invoke("getCommunityRadioScopeData", { community_id: community.id });
      return res.data;
    },
    enabled: !!community?.id,
    refetchInterval: active ? 8000 : false,
    staleTime: 4000,
  });

  const members = scope?.members || [];
  const repeaters = scope?.repeaters || [];
  const nets = scope?.nets || [];
  const stats = scope?.stats || {};
  const communityRecord = scope?.community || community;

  // ── Realtime: subscribe to presence changes for the ACTIVE community only.
  // On community switch the effect cleanup unsubscribes the old community and
  // re-subscribes the new one (invalidate is scoped by community.id key). ──
  useEffect(() => {
    if (!community?.id) return;
    const unsub = mist.entities.ChatPresence.subscribe(() => {
      qc.invalidateQueries({ queryKey: ["radioscope", community.id] });
    });
    return unsub;
  }, [qc, community?.id]);

  // ── Tick to re-evaluate age-based expiration between polls ──
  useEffect(() => {
    const t = setInterval(() => setNowTick(Date.now()), 3000);
    return () => clearInterval(t);
  }, []);

  // ── Push validated live GPS to server (throttled) — user's own location ──
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

  const clearLocation = useCallback(() => {
    if (clearingRef.current) return;
    clearingRef.current = true;
    base44.functions.invoke("clearUserLocation").catch(() => {}).finally(() => {
      clearingRef.current = false;
    });
  }, []);

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
        if (err.code === err.PERMISSION_DENIED) clearLocation();
      },
      GPS_WATCH_OPTS
    );
    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [pushLocation, clearLocation]);

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
      clearLocation();
    };
  }, [clearLocation]);

  // ── Lightning proximity (user alert radius → severity threshold anchor) ──
  const { radiusMiles } = useLightningProximity();

  const communityCenter = useMemo(() => {
    if (communityRecord?.location_lat != null && communityRecord?.location_lon != null) {
      return [communityRecord.location_lat, communityRecord.location_lon];
    }
    return null;
  }, [communityRecord]);

  // ── REALTIME-FIRST lightning: new strikes merge into local state immediately
  // via the LightningStrike realtime subscription, so markers render without
  // waiting for the next getCommunityRadioScopeData refetch. The scope query
  // (scope.strikes) remains the source of truth for the historical set; realtime
  // is the PRIMARY path for NEW strikes. onNewStrike dispatches the transient
  // LightingEvent (weather → radioscope) for the flash overlay — one
  // subscription, two behaviors (marker + flash). Scope filter uses the
  // configurable radius (SCOPE_RADIUS_MI). The 8s scope refetch is reconciliation
  // for members/repeaters/nets, NOT a lightning bottleneck. ──
  const communityStrikes = useRealtimeLightningStrikes({
    baseStrikes: scope?.strikes || [],
    center: communityCenter,
    scopeRadiusMiles: SCOPE_RADIUS_MI,
    onNewStrike: (s) => {
      const userPos = userPosition || communityCenter;
      if (!userPos) return;
      const event = buildLightingEvent({ strike: s, userPos, radiusMiles, now: Date.now() });
      if (event) dispatchLightingEvent(event);
    },
  });

  const [focusStrikeId, setFocusStrikeId] = useState(
    () => new URLSearchParams(window.location.search).get("strike")
  );
  const focusStrike = useMemo(
    () => communityStrikes.find((s) => s.id === focusStrikeId) || null,
    [communityStrikes, focusStrikeId]
  );

  // ── LIVE USERS ONLY: members of the active community with a valid live fix ──
  const onlineUsers = useMemo(
    () => getLiveUsers(members, { now: nowTick, ttl: LOCATION_TTL_MS, excludeUid: myUid }),
    [members, nowTick, myUid]
  );

  const myPresence = useMemo(
    () => members.find((m) => m.user_uid === myUid) || null,
    [members, myUid]
  );

  const handleRecenter = useCallback(() => setRecenterTrigger((t) => t + 1), []);

  if (!community) {
    return (
      <RadioScopeStartup>
        <div className="fixed inset-0 z-[55] bg-black flex flex-col items-center justify-center p-6 text-center">
          <p className="text-sm text-cyan-300/80">Join a community to access RadioScope.</p>
          <Link to="/my-communities" className="mt-4 text-xs text-cyan-400 underline">Browse communities</Link>
        </div>
      </RadioScopeStartup>
    );
  }

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
            strikes={communityStrikes}
            focusStrike={focusStrike}
            focusStrikeId={focusStrikeId}
            now={nowTick}
            onStrikeClick={(s) => setFocusStrikeId(s.id)}
            defaultCenter={communityCenter}
            communityKey={community?.id}
            radiusMiles={radiusMiles}
          />
        </div>

        {/* Stacked top overlay: header + stats + search */}
        <div className="absolute top-0 left-0 right-0 z-30 flex flex-col pt-[env(safe-area-inset-top)]">
          <header className="flex items-center gap-2 px-3 py-2.5 bg-black/70 backdrop-blur-md border-b border-cyan-500/10">
            <Link to="/" className="p-2 -m-1 text-cyan-400 shrink-0">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-bold text-cyan-300 tracking-wide leading-tight">RadioScope</h1>
              <p className="text-[10px] text-cyan-500/70 tracking-widest uppercase truncate">
                {community?.name || "—"} · {onlineUsers.length} operators
              </p>
            </div>
            <RadioScopeCommunitySelector communities={communities} active={community} onChange={switchCommunity} />
            <button onClick={() => setShowDebug((v) => !v)} className="p-2 text-cyan-400 shrink-0">
              <Bug className="w-6 h-6" />
            </button>
            <button onClick={() => setShowLayers(true)} className="p-2 text-cyan-400 shrink-0">
              <Layers className="w-6 h-6" />
            </button>
          </header>

          <RadioScopeStatsBar stats={stats} loading={scopeLoading && !scope} />

          <div className="px-3 py-2 bg-black/40 backdrop-blur-sm">
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
        </div>

        {/* Admin debug panel */}
        {showDebug && (
          <RadioScopeDebugPanel
            myFix={myFix}
            myPresence={myPresence}
            liveUsers={onlineUsers}
            allPresence={members}
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

        {/* NOAA GLM attribution (data source) — non-interactive, no pipeline change */}
        <div className="absolute bottom-0 left-0 right-0 z-10 flex justify-center pb-1 pointer-events-none">
          <span className="text-[8px] text-cyan-500/40 tracking-wide">Lightning data: NOAA GOES-R Geostationary Lightning Mapper</span>
        </div>
      </div>
    </RadioScopeStartup>
  );
}