import React, { useState, useEffect, useRef } from "react";
import { useMyBBAuth } from "@/lib/MyBBAuthContext";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import PageHeader from "@/components/layout/PageHeader";
import { Radio, Search, Loader2, X, Check, MapPin, Signal, Navigation } from "lucide-react";
import { notifyAccepted, notifyDeclined } from "@/components/simplex/SimplexNotify";

const LOGO_URL = "https://media.base44.com/images/public/6a24d788be1af31b2258fab2/5e4366214_insomniacsgmrslogo.png";
const FORUM_BASE = "https://insomniacsgmrs.com/";

function normalizeAvatar(avatar) {
  if (!avatar) return null;
  if (avatar.startsWith("http")) return avatar;
  return FORUM_BASE + avatar.replace(/^\//, "");
}

function makeIcon(color = "#8b5cf6") {
  return L.divIcon({
    className: "",
    html: `<div style="width:36px;height:36px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
    </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
}

function makeRepeaterIcon(status = "online") {
  const color = status === "online" ? "#f59e0b" : status === "busy" ? "#ef4444" : "#6b7280";
  return L.divIcon({
    className: "",
    html: `<div style="width:30px;height:30px;border-radius:6px;background:${color};border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4.9 16.1C1 12.2 1 5.8 4.9 1.9"/><path d="M7.8 4.7a6.14 6.14 0 0 0-.8 7.5"/><circle cx="12" cy="9" r="2"/><path d="M16.2 4.8a6.14 6.14 0 0 1 .6 7.5"/><path d="M19.1 1.9a10 10 0 0 1 .1 14.2"/><line x1="12" y1="9" x2="12" y2="22"/></svg>
    </div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -18],
  });
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Step 1: Pick a user ──────────────────────────────────────────────────────
function UserPicker({ onSelect }) {
  const [search, setSearch] = useState("");
  const { data: members = [], isLoading } = useQuery({
    queryKey: ["forum-members"],
    queryFn: async () => {
      const res = await base44.functions.invoke("fetchMyBBForums", { action: "members" });
      return res.data?.members || [];
    },
    staleTime: 60000,
  });

  const filtered = members.filter(
    (m) => !search || m.username?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="px-4 py-4 space-y-4">
      <div className="p-4 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-center space-y-1">
        <Radio className="w-8 h-8 text-violet-400 mx-auto" />
        <p className="text-sm font-semibold text-foreground">Simplex Mode</p>
        <p className="text-xs text-muted-foreground">Select a member to share live GPS locations. See how far your radios can reach!</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search members..."
          className="w-full bg-secondary border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-violet-500"
        />
      </div>

      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
        </div>
      )}

      <div className="space-y-2">
        {filtered.map((member) => (
          <button
            key={member.uid}
            onClick={() => onSelect(member)}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.07] active:scale-[0.99] transition-all text-left"
          >
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-violet-950/50 border border-violet-500/20 shrink-0">
              <img
                src={normalizeAvatar(member.avatar) || LOGO_URL}
                alt={member.username}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.src = LOGO_URL; }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{member.username}</p>
              <p className="text-xs text-muted-foreground">{member.postcount ?? 0} posts</p>
            </div>
            <Navigation className="w-4 h-4 text-violet-400 shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Step 2: Waiting for accept ───────────────────────────────────────────────
function WaitingScreen({ session, onCancel }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 gap-6 text-center">
      <div className="w-16 h-16 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
      </div>
      <div>
        <p className="text-base font-bold text-foreground">Waiting for {session.target_username}…</p>
        <p className="text-xs text-muted-foreground mt-1">They'll see a request to share locations with you.</p>
      </div>
      <button
        onClick={onCancel}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary text-muted-foreground text-sm hover:text-foreground transition-colors"
      >
        <X className="w-4 h-4" /> Cancel Request
      </button>
    </div>
  );
}

// ─── Step 3: Incoming request ─────────────────────────────────────────────────
function IncomingRequest({ session, onAccept, onDecline }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 gap-6 text-center">
      <div className="w-16 h-16 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
        <Signal className="w-8 h-8 text-violet-400" />
      </div>
      <div>
        <p className="text-base font-bold text-foreground">{session.initiator_username} wants to share locations!</p>
        <p className="text-xs text-muted-foreground mt-1">Accept to see each other on the map and test radio range.</p>
      </div>
      <div className="flex gap-3 w-full max-w-xs">
        <button
          onClick={onDecline}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-secondary text-muted-foreground text-sm hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" /> Decline
        </button>
        <button
          onClick={onAccept}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors"
        >
          <Check className="w-4 h-4" /> Accept
        </button>
      </div>
    </div>
  );
}

// ─── Auto-recenter map to position ───────────────────────────────────────────
function MapRecenter({ lat, lon }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lon) map.flyTo([lat, lon], map.getZoom(), { animate: true, duration: 1 });
  }, [lat, lon]);
  return null;
}

// ─── Step 4: Live map ─────────────────────────────────────────────────────────
function LiveMap({ session, myUID, onEnd, onPing, repeaters }) {
  const isInitiator = session.initiator_uid === myUID;
  const myLat = isInitiator ? session.initiator_lat : session.target_lat;
  const myLon = isInitiator ? session.initiator_lon : session.target_lon;
  const theirLat = isInitiator ? session.target_lat : session.initiator_lat;
  const theirLon = isInitiator ? session.target_lon : session.initiator_lon;
  const theirName = isInitiator ? session.target_username : session.initiator_username;

  const hasMyPos = myLat && myLon;
  const hasTheirPos = theirLat && theirLon;
  const distKm = hasMyPos && hasTheirPos
    ? haversineKm(myLat, myLon, theirLat, theirLon).toFixed(2)
    : null;
  const distMi = distKm ? (distKm * 0.621371).toFixed(2) : null;

  // Track whether we've centered on our own position yet
  const centeredRef = useRef(false);
  const [centerTarget, setCenterTarget] = useState(null);
  useEffect(() => {
    if (hasMyPos && !centeredRef.current) {
      centeredRef.current = true;
      setCenterTarget({ lat: myLat, lon: myLon });
    }
  }, [myLat, myLon]);

  const center = hasMyPos ? [myLat, myLon] : [28.5, -81.4];

  return (
    <div className="flex flex-col" style={{ height: "calc(100dvh - 11rem)" }}>
      {/* Distance bar */}
      <div className="px-4 py-3 bg-card border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Signal className="w-4 h-4 text-violet-400" />
          <span className="text-sm font-semibold text-foreground">Live with {theirName}</span>
        </div>
        <div className="flex items-center gap-3">
          {distKm && (
            <div className="text-right">
              <p className="text-xs font-bold text-emerald-400">{distMi} mi</p>
              <p className="text-[10px] text-muted-foreground">{distKm} km</p>
            </div>
          )}
          {!hasTheirPos && (
            <span className="text-xs text-amber-400 flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" /> Waiting for their location…
            </span>
          )}
          <button
            onClick={onPing}
            className="px-3 py-1.5 rounded-lg bg-violet-500/20 text-violet-400 text-xs font-semibold hover:bg-violet-500/30 transition-colors flex items-center gap-1"
          >
            <MapPin className="w-3 h-3" /> Ping
          </button>
          <div className="flex items-center gap-1 text-[10px] text-amber-400">
            <Radio className="w-3 h-3" />
            <span className="hidden sm:inline">Repeaters</span>
          </div>
          <button
            onClick={onEnd}
            className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs font-semibold hover:bg-red-500/30 transition-colors"
          >
            End
          </button>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1">
        <MapContainer center={center} zoom={11} style={{ height: "100%", width: "100%" }} className="z-0">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='© OpenStreetMap contributors'
          />
          {centerTarget && <MapRecenter lat={centerTarget.lat} lon={centerTarget.lon} />}
          {repeaters.filter(r => r.latitude && r.longitude).map(r => (
            <Marker key={r.id} position={[r.latitude, r.longitude]} icon={makeRepeaterIcon(r.status)}>
              <Popup>
                <div style={{ minWidth: 140 }}>
                  <strong>{r.callsign}</strong><br />
                  {r.frequency} MHz{r.offset ? ` (${r.offset})` : ""}<br />
                  {r.tone ? `PL: ${r.tone}` : ""}{r.tone && r.location ? " · " : ""}{r.location || ""}
                </div>
              </Popup>
            </Marker>
          ))}
          {hasMyPos && (
            <Marker position={[myLat, myLon]} icon={makeIcon("#8b5cf6")}>
              <Popup>
                <div className="text-sm">
                  <strong>You</strong>
                  {distMi && <p className="text-xs text-muted-foreground mt-1">{distMi} mi away</p>}
                </div>
              </Popup>
            </Marker>
          )}
          {hasTheirPos && (
            <Marker position={[theirLat, theirLon]} icon={makeIcon("#10b981")}>
              <Popup>
                <div className="text-sm">
                  <strong>{theirName}</strong>
                  {distMi && <p className="text-xs text-muted-foreground mt-1">{distMi} mi away</p>}
                </div>
              </Popup>
            </Marker>
          )}
          {hasMyPos && hasTheirPos && (
            <Polyline
              positions={[[myLat, myLon], [theirLat, theirLon]]}
              pathOptions={{ color: "#8b5cf6", weight: 2, dashArray: "6 4", opacity: 0.7 }}
            />
          )}
        </MapContainer>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CineplexMode() {
  const { mybbUser } = useMyBBAuth();
  const [session, setSession] = useState(null);
  const [step, setStep] = useState("pick"); // pick | waiting | incoming | live
  const pollRef = useRef(null);

  const { data: repeaters = [] } = useQuery({
    queryKey: ["repeaters-map"],
    queryFn: () => base44.entities.Repeater.list(),
    staleTime: 300000,
  });

  const myUID = String(mybbUser?.uid || mybbUser?.username || "");

  // Auto-join from toast notification (role=target means we just accepted via the poller)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session");
    const role = params.get("role");
    if (!sessionId) return;

    const joinSession = async () => {
      const sessions = await base44.entities.LocationShare.filter({ id: sessionId });
      const s = sessions[0];
      if (!s || s.status !== "active") return;
      setSession(s);
      setStep("live");
      const isInitiator = role !== "target";
      startGPS(sessionId, isInitiator);
      startPolling(sessionId, isInitiator);
    };
    joinSession();
  }, []); // eslint-disable-line

  const gpsIntervalRef = useRef(null);

  // Push current GPS position to the session record
  const pushGPS = (sessionId, isInitiator) => {
    if (!navigator.geolocation) return;
    // Cache permission state — browser remembers the grant so no re-prompt
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        localStorage.setItem("gps_permission_granted", "1");
        const { latitude: lat, longitude: lon } = pos.coords;
        const field = isInitiator
          ? { initiator_lat: lat, initiator_lon: lon }
          : { target_lat: lat, target_lon: lon };
        await base44.entities.LocationShare.update(sessionId, field);
      },
      (err) => { console.warn("GPS error:", err.message); },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // Start continuous GPS updates every 10s
  const startGPS = (sessionId, isInitiator) => {
    pushGPS(sessionId, isInitiator); // immediate first ping
    gpsIntervalRef.current = setInterval(() => pushGPS(sessionId, isInitiator), 10000);
  };

  const stopGPS = () => {
    if (gpsIntervalRef.current) { clearInterval(gpsIntervalRef.current); gpsIntervalRef.current = null; }
  };

  // One-time GPS ping (used for manual Ping button)
  const pingGPS = (sessionId, isInitiator) => pushGPS(sessionId, isInitiator);

  // Poll session state
  const prevStatusRef = useRef(null);

  const pollSession = async (sessionId, isInitiator) => {
    const sessions = await base44.entities.LocationShare.filter({ id: sessionId });
    const s = sessions[0];
    if (!s) return;
    const prev = prevStatusRef.current;
    prevStatusRef.current = s.status;
    if (isInitiator && prev === "pending" && s.status === "active") notifyAccepted(s.target_username);
    if (isInitiator && prev === "pending" && s.status === "declined") notifyDeclined(s.target_username);
    setSession(s);
    if (s.status === "active") setStep("live");
    if (s.status === "declined" || s.status === "ended") handleEnd(false);
  };

  const startPolling = (sessionId, isInitiator) => {
    prevStatusRef.current = "pending";
    pollRef.current = setInterval(() => pollSession(sessionId, isInitiator), 15000);
  };

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  };

  // Subscribe to real-time updates
  useEffect(() => {
    const unsub = base44.entities.LocationShare.subscribe((event) => {
      if (session && event.data?.id === session.id) {
        const next = event.data;
        const isInitiator = session.initiator_uid === myUID;
        if (isInitiator && session.status === "pending" && next.status === "active") notifyAccepted(next.target_username);
        if (isInitiator && session.status === "pending" && next.status === "declined") notifyDeclined(next.target_username);
        setSession(next);
        if (next.status === "active") setStep("live");
        if (next.status === "declined" || next.status === "ended") handleEnd(false);
      }
    });
    return unsub;
  }, [session?.id, session?.status]);

  // Check for incoming requests on mount
  useEffect(() => {
    const checkIncoming = async () => {
      const pending = await base44.entities.LocationShare.filter({ target_uid: myUID, status: "pending" });
      if (pending.length > 0) {
        setSession(pending[0]);
        setStep("incoming");
      }
    };
    checkIncoming();
  }, [myUID]);

  const handleSelect = async (member) => {
    const now = new Date();
    const expires = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString();
    const s = await base44.entities.LocationShare.create({
      initiator_uid: String(myUID),
      initiator_username: mybbUser.username,
      initiator_avatar: mybbUser.avatar || "",
      target_uid: String(member.uid || member.username),
      target_username: member.username,
      target_avatar: member.avatar || "",
      status: "pending",
      expires_at: expires,
    });
    setSession(s);
    setStep("waiting");
    startGPS(s.id, true);
    startPolling(s.id, true);
  };

  const handleAccept = async () => {
    await base44.entities.LocationShare.update(session.id, { status: "active" });
    setSession(prev => ({ ...prev, status: "active" }));
    setStep("live");
    startGPS(session.id, false);
    startPolling(session.id, false);
  };

  const handleDecline = async () => {
    await base44.entities.LocationShare.update(session.id, { status: "declined" });
    setSession(null);
    setStep("pick");
  };

  const handleCancel = async () => {
    if (session) await base44.entities.LocationShare.update(session.id, { status: "ended" });
    handleEnd(false);
  };

  const handleEnd = (updateDB = true) => {
    if (updateDB && session) {
      base44.entities.LocationShare.update(session.id, { status: "ended" }).catch(() => {});
    }
    stopGPS();
    stopPolling();
    setSession(null);
    setStep("pick");
  };

  useEffect(() => () => { stopGPS(); stopPolling(); }, []); // eslint-disable-line

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Simplex Mode" showBack />
      {step === "pick" && <UserPicker onSelect={handleSelect} />}
      {step === "waiting" && session && <WaitingScreen session={session} onCancel={handleCancel} />}
      {step === "incoming" && session && (
        <IncomingRequest session={session} onAccept={handleAccept} onDecline={handleDecline} />
      )}
      {step === "live" && session && (
        <LiveMap session={session} myUID={myUID} onEnd={() => handleEnd(true)} onPing={() => pingGPS(session.id, session.initiator_uid === myUID)} repeaters={repeaters} />
      )}
    </div>
  );
}