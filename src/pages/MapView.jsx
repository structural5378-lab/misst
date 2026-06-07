import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import PageHeader from "@/components/layout/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

export default function MapView() {
  const [tab, setTab] = useState("all");

  const { data: repeaters } = useQuery({
    queryKey: ["repeaters"],
    queryFn: () => base44.entities.Repeater.list("-created_date", 100),
    initialData: [],
  });

  const markersData = repeaters.filter((r) => r.latitude && r.longitude);

  return (
    <div className="h-screen flex flex-col">
      <PageHeader title="Map" showBack />
      <div className="px-4 py-2">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-secondary/50 w-full grid grid-cols-4 text-xs">
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            <TabsTrigger value="repeaters" className="text-xs">Repeaters</TabsTrigger>
            <TabsTrigger value="members" className="text-xs">Members</TabsTrigger>
            <TabsTrigger value="nets" className="text-xs">Nets</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div className="flex-1 relative">
        <MapContainer
          center={[26.1, -80.3]}
          zoom={8}
          className="w-full h-full"
          style={{ height: "100%", minHeight: "400px" }}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          />
          {markersData.map((r) => (
            <Marker key={r.id} position={[r.latitude, r.longitude]}>
              <Popup>
                <div className="text-sm">
                  <strong>{r.callsign}</strong>
                  <br />
                  {r.frequency?.toFixed(3)} MHz
                  <br />
                  {r.location}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}