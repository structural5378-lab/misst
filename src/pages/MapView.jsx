import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import PageHeader from "@/components/layout/PageHeader";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

export default function MapView() {
  const [tab, setTab] = useState("db");

  // Local DB repeaters
  const { data: dbRepeaters = [] } = useQuery({
    queryKey: ["repeaters"],
    queryFn: () => base44.entities.Repeater.list("-created_date", 100),
  });

  // Live RepeaterBook data
  const { data: liveData, isLoading: liveLoading, refetch: refetchLive } = useQuery({
    queryKey: ["repeaterbook"],
    queryFn: async () => {
      const res = await base44.functions.invoke("fetchRepeaterBook", {
        lat: 25.77,
        lng: -80.19,
        distance: 150,
        band: "GMRS",
      });
      return res.data?.repeaters || [];
    },
    staleTime: 300000, // 5 min cache
    enabled: tab === "live",
  });

  const markersSource = tab === "live"
    ? (liveData || []).filter((r) => r.latitude && r.longitude)
    : dbRepeaters.filter((r) => r.latitude && r.longitude);

  return (
    <div className="h-screen flex flex-col">
      <PageHeader
        title="Repeater Map"
        showBack
        rightAction={
          tab === "live" ? (
            <button
              onClick={() => refetchLive()}
              className="p-2 text-violet-400 hover:text-violet-300"
            >
              <RefreshCw className={`w-4 h-4 ${liveLoading ? "animate-spin" : ""}`} />
            </button>
          ) : null
        }
      />
      <div className="px-4 py-2">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-secondary/50 w-full grid grid-cols-2 text-xs">
            <TabsTrigger value="db" className="text-xs">Community</TabsTrigger>
            <TabsTrigger value="live" className="text-xs">Live (RepeaterBook)</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {tab === "live" && liveLoading && (
        <div className="flex items-center justify-center gap-2 py-3 text-xs text-muted-foreground">
          <div className="w-3 h-3 border border-violet-400 border-t-transparent rounded-full animate-spin" />
          Fetching live repeaters...
        </div>
      )}

      <div className="flex-1 relative">
        <MapContainer
          center={[25.77, -80.19]}
          zoom={9}
          className="w-full h-full"
          style={{ height: "100%", minHeight: "400px" }}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          />
          {markersSource.map((r, i) => (
            <Marker key={r.id || i} position={[r.latitude, r.longitude]}>
              <Popup>
                <div className="text-sm font-sans">
                  <p className="font-bold text-base">{r.callsign}</p>
                  <p>{r.frequency?.toFixed(4)} MHz &nbsp;|&nbsp; {r.offset}</p>
                  {r.tone && <p>Tone: {r.tone}</p>}
                  <p className="text-gray-500 mt-1">{r.location}</p>
                  {r.owner_callsign && <p className="text-gray-500">Trustee: {r.owner_callsign}</p>}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Count badge */}
        <div className="absolute bottom-4 left-4 z-[1000] px-3 py-1.5 rounded-full bg-black/70 backdrop-blur text-xs text-white border border-white/10">
          {markersSource.length} repeaters
          {tab === "live" && " from RepeaterBook"}
        </div>
      </div>
    </div>
  );
}