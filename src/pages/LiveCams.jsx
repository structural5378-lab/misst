import React from "react";
import { ExternalLink, MapPin, Waves, Sun, Anchor } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";

const floridaCams = [
  // Key West & Southern Florida - EarthCam embed URLs
  {
    name: "South Beach - Miami",
    location: "Miami Beach, FL",
    embedUrl: "https://www.earthcam.com/embed/southbeach/",
    directUrl: "https://www.earthcam.com/usa/florida/miamibeach/southbeach/",
    type: "beach",
  },
  {
    name: "Naples Pier",
    location: "Naples, FL",
    embedUrl: "https://www.earthcam.com/embed/naples/",
    directUrl: "https://www.earthcam.com/usa/florida/naples/pier/",
    type: "beach",
  },
  {
    name: "Clearwater Beach",
    location: "Clearwater, FL",
    embedUrl: "https://www.earthcam.com/embed/clearwater/",
    directUrl: "https://www.earthcam.com/usa/florida/clearwater/beach/",
    type: "beach",
  },
  {
    name: "Fort Lauderdale Beach",
    location: "Fort Lauderdale, FL",
    embedUrl: "https://www.earthcam.com/embed/fortlauderdale/",
    directUrl: "https://www.earthcam.com/usa/florida/fortlauderdale/beach/",
    type: "beach",
  },
  {
    name: "Cocoa Beach Pier",
    location: "Cocoa Beach, FL",
    embedUrl: "https://www.earthcam.com/embed/cocoabeach/",
    directUrl: "https://www.earthcam.com/usa/florida/cocoabeach/pier/",
    type: "beach",
  },
  {
    name: "Destin Harbor",
    location: "Destin, FL",
    embedUrl: "https://www.earthcam.com/embed/destin/",
    directUrl: "https://www.earthcam.com/usa/florida/destin/harbor/",
    type: "harbor",
  },
  // Additional Florida Beach Cams
  {
    name: "Daytona Beach",
    location: "Daytona Beach, FL",
    embedUrl: "https://www.skylinewebcams.com/embed/webcam/usa/florida/daytona-beach.html",
    directUrl: "https://www.skylinewebcams.com/en/webcam/usa/florida/daytona-beach.html",
    type: "beach",
  },
  {
    name: "Key West - Mallory Square",
    location: "Key West, FL",
    embedUrl: "https://www.skylinewebcams.com/embed/webcam/usa/florida/key-west/mallory-square.html",
    directUrl: "https://www.skylinewebcams.com/en/webcam/usa/florida/key-west/mallory-square.html",
    type: "harbor",
  },
  {
    name: "Panama City Beach",
    location: "Panama City Beach, FL",
    embedUrl: "https://www.skylinewebcams.com/embed/webcam/usa/florida/panama-city-beach.html",
    directUrl: "https://www.skylinewebcams.com/en/webcam/usa/florida/panama-city-beach.html",
    type: "beach",
  },
  {
    name: "Jacksonville Beach",
    location: "Jacksonville Beach, FL",
    embedUrl: "https://www.skylinewebcams.com/embed/webcam/usa/florida/jacksonville-beach.html",
    directUrl: "https://www.skylinewebcams.com/en/webcam/usa/florida/jacksonville-beach.html",
    type: "beach",
  },
  {
    name: "Siesta Key Beach",
    location: "Sarasota, FL",
    embedUrl: "https://www.skylinewebcams.com/embed/webcam/usa/florida/siesta-key.html",
    directUrl: "https://www.skylinewebcams.com/en/webcam/usa/florida/siesta-key.html",
    type: "beach",
  },
  {
    name: "Fort Myers Beach",
    location: "Fort Myers Beach, FL",
    embedUrl: "https://www.skylinewebcams.com/embed/webcam/usa/florida/fort-myers-beach.html",
    directUrl: "https://www.skylinewebcams.com/en/webcam/usa/florida/fort-myers-beach.html",
    type: "beach",
  },
  {
    name: "Pensacola Beach",
    location: "Pensacola Beach, FL",
    embedUrl: "https://www.skylinewebcams.com/embed/webcam/usa/florida/pensacola-beach.html",
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
                Real-time views from Key West to the Panhandle. Watch directly in the app.
              </p>
            </div>
          </div>
        </div>

        {/* Camera Cards */}
        <div className="space-y-4">
          {floridaCams.map((cam, idx) => {
            const TypeIcon = typeIcons[cam.type] || Waves;
            const colorClass = typeColors[cam.type] || typeColors.beach;

            return (
              <div
                key={idx}
                className="rounded-xl bg-white/[0.03] border border-white/[0.07] hover:border-violet-500/30 hover:bg-violet-500/5 transition-all overflow-hidden"
              >
                {/* Header */}
                <div className="p-4 border-b border-white/[0.07]">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg ${colorClass} flex items-center justify-center`}>
                      <TypeIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-foreground">{cam.name}</h4>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5" />
                        {cam.location}
                      </p>
                    </div>
                    <a
                      href={cam.directUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600/30 hover:bg-violet-600/50 text-violet-300 text-xs font-medium transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Full Screen
                    </a>
                  </div>
                </div>

                {/* Live Video Feed */}
                <div className="relative bg-black aspect-video">
                  <div className="absolute top-3 left-3 z-10 flex items-center gap-2 px-2 py-1 rounded bg-red-600/90 text-white text-xs font-semibold">
                    <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    LIVE
                  </div>
                  <iframe
                    src={cam.embedUrl}
                    title={cam.name}
                    className="w-full h-full"
                    loading="lazy"
                    allow="camera; microphone; fullscreen; autoplay"
                    scrolling="no"
                    allowFullScreen
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