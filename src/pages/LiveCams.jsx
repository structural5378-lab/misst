import React from "react";
import { ExternalLink, MapPin, Waves, Sun, Anchor } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";

const floridaCams = [
  // Key West & Southern Florida
  {
    name: "Key West - Mallory Square",
    location: "Key West, FL",
    lat: 24.5551,
    lng: -81.8077,
    embedUrl: "https://www.skylinewebcams.com/en/webcam/usa/florida/key-west/mallory-square.html",
    directUrl: "https://www.skylinewebcams.com/en/webcam/usa/florida/key-west/mallory-square.html",
    type: "harbor",
  },
  {
    name: "South Beach - Miami",
    location: "Miami Beach, FL",
    lat: 25.7617,
    lng: -80.1918,
    embedUrl: "https://www.skylinewebcams.com/en/webcam/usa/florida/miami-beach/south-beach.html",
    directUrl: "https://www.skylinewebcams.com/en/webcam/usa/florida/miami-beach/south-beach.html",
    type: "beach",
  },
  {
    name: "Fort Lauderdale Beach",
    location: "Fort Lauderdale, FL",
    lat: 26.1224,
    lng: -80.1373,
    embedUrl: "https://www.earthcam.com/usa/florida/fortlauderdale/beach/",
    directUrl: "https://www.earthcam.com/usa/florida/fortlauderdale/beach/",
    type: "beach",
  },
  // East Coast - Going North
  {
    name: "Daytona Beach - Main Street Pier",
    location: "Daytona Beach, FL",
    lat: 29.2108,
    lng: -81.0228,
    embedUrl: "https://www.skylinewebcams.com/en/webcam/usa/florida/daytona-beach/main-street-pier.html",
    directUrl: "https://www.skylinewebcams.com/en/webcam/usa/florida/daytona-beach/main-street-pier.html",
    type: "beach",
  },
  {
    name: "Cocoa Beach Pier",
    location: "Cocoa Beach, FL",
    lat: 28.3200,
    lng: -80.6076,
    embedUrl: "https://www.earthcam.com/usa/florida/cocoabeach/pier/",
    directUrl: "https://www.earthcam.com/usa/florida/cocoabeach/pier/",
    type: "beach",
  },
  {
    name: "Jacksonville Beach",
    location: "Jacksonville Beach, FL",
    lat: 30.2866,
    lng: -81.3934,
    embedUrl: "https://www.skylinewebcams.com/en/webcam/usa/florida/jacksonville-beach.html",
    directUrl: "https://www.skylinewebcams.com/en/webcam/usa/florida/jacksonville-beach.html",
    type: "beach",
  },
  // West Coast - Gulf of Mexico
  {
    name: "Clearwater Beach",
    location: "Clearwater, FL",
    lat: 27.9659,
    lng: -82.8001,
    embedUrl: "https://www.earthcam.com/usa/florida/clearwater/beach/",
    directUrl: "https://www.earthcam.com/usa/florida/clearwater/beach/",
    type: "beach",
  },
  {
    name: "Siesta Key Beach",
    location: "Sarasota, FL",
    lat: 27.2639,
    lng: -82.5437,
    embedUrl: "https://www.skylinewebcams.com/en/webcam/usa/florida/siesta-key.html",
    directUrl: "https://www.skylinewebcams.com/en/webcam/usa/florida/siesta-key.html",
    type: "beach",
  },
  {
    name: "Naples Pier",
    location: "Naples, FL",
    lat: 26.1420,
    lng: -81.8073,
    embedUrl: "https://www.earthcam.com/usa/florida/naples/pier/",
    directUrl: "https://www.earthcam.com/usa/florida/naples/pier/",
    type: "beach",
  },
  {
    name: "Fort Myers Beach",
    location: "Fort Myers Beach, FL",
    lat: 26.4518,
    lng: -81.9473,
    embedUrl: "https://www.skylinewebcams.com/en/webcam/usa/florida/fort-myers-beach.html",
    directUrl: "https://www.skylinewebcams.com/en/webcam/usa/florida/fort-myers-beach.html",
    type: "beach",
  },
  // Panhandle & Northern Gulf
  {
    name: "Destin Harbor",
    location: "Destin, FL",
    lat: 30.3935,
    lng: -86.4958,
    embedUrl: "https://www.earthcam.com/usa/florida/destin/harbor/",
    directUrl: "https://www.earthcam.com/usa/florida/destin/harbor/",
    type: "harbor",
  },
  {
    name: "Panama City Beach",
    location: "Panama City Beach, FL",
    lat: 30.1766,
    lng: -85.8055,
    embedUrl: "https://www.skylinewebcams.com/en/webcam/usa/florida/panama-city-beach.html",
    directUrl: "https://www.skylinewebcams.com/en/webcam/usa/florida/panama-city-beach.html",
    type: "beach",
  },
  {
    name: "Pensacola Beach",
    location: "Pensacola Beach, FL",
    lat: 30.3327,
    lng: -87.1422,
    embedUrl: "https://www.skylinewebcams.com/en/webcam/usa/florida/pensacola-beach.html",
    directUrl: "https://www.skylinewebcams.com/en/webcam/usa/florida/pensacola-beach.html",
    type: "beach",
  },
];

const typeIcons = {
  beach: Waves,
  harbor: Anchor,
};

const typeColors = {
  beach: "bg-teal-500/15 text-teal-400",
  harbor: "bg-blue-500/15 text-blue-400",
};

export default function LiveCams() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="🌴 Florida Beach Cams" showBack />

      <div className="px-4 py-4 space-y-4">
        {/* Info Banner */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-violet-500/10 to-teal-500/10 border border-violet-500/20">
          <div className="flex items-start gap-3">
            <Sun className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-foreground">Live Beach Cameras</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Real-time views from Key West to the Panhandle. Cameras are hosted externally — click to view in new tab.
              </p>
            </div>
          </div>
        </div>

        {/* Camera Cards */}
        <div className="space-y-3">
          {floridaCams.map((cam, idx) => {
            const TypeIcon = typeIcons[cam.type] || Waves;
            const colorClass = typeColors[cam.type] || typeColors.beach;

            return (
              <div
                key={idx}
                className="rounded-xl bg-white/[0.03] border border-white/[0.07] hover:border-violet-500/30 hover:bg-violet-500/5 transition-all overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-8 h-8 rounded-lg ${colorClass} flex items-center justify-center`}>
                          <TypeIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-foreground">{cam.name}</h4>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5" />
                            {cam.location}
                          </p>
                        </div>
                      </div>
                    </div>
                    <a
                      href={cam.directUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-600/30 hover:bg-violet-600/50 text-violet-300 text-xs font-medium transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Watch Live
                    </a>
                  </div>
                </div>

                {/* Embedded Preview (iframe) */}
                <div className="border-t border-white/[0.07] bg-black/20">
                  <iframe
                    src={cam.embedUrl}
                    title={cam.name}
                    className="w-full h-48"
                    loading="lazy"
                    allow="camera; microphone"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="text-center py-4">
          <p className="text-xs text-muted-foreground">
            📡 All camera streams are provided by external sources
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Having trouble? Cameras may be temporarily offline
          </p>
        </div>
      </div>
    </div>
  );
}