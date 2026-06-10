import React, { useState } from "react";
import { ExternalLink, MapPin, Waves, Sun, Anchor, Play, X } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";

// All directUrl values sourced from official city/tourism/resort sites
const floridaCams = [
  {
    name: "Fort Lauderdale Beach",
    location: "Fort Lauderdale, FL",
    // PTZtv - live 24/7, featured on visitlauderdale.com official page
    youtubeId: "pXx3YQVSUGg",
    directUrl: "https://www.visitlauderdale.com/plan-your-vacation/live-beach-cam/",
    type: "beach",
  },
  {
    name: "Clearwater Beach",
    location: "Clearwater, FL",
    // Official City of Clearwater page uses ipcamlive - link to official page
    directUrl: "https://www.myclearwater.com/Visit-the-Beach/Watch-Live-Video-of-Clearwater-Beach",
    type: "beach",
  },
  {
    name: "Pensacola Beach – West Cam",
    location: "Pensacola Beach, FL",
    // Santa Rosa Island Authority official YouTube live stream
    youtubeId: "HKIc6CYlMzI",
    directUrl: "https://pensacolabeach.com/pensacola-beach-live-cams/",
    type: "beach",
  },
  {
    name: "Pensacola Beach – East Cam",
    location: "Pensacola Beach, FL",
    // Santa Rosa Island Authority official YouTube live stream
    youtubeId: "890WmHX7h6U",
    directUrl: "https://pensacolabeach.com/pensacola-beach-live-cams/",
    type: "beach",
  },
  {
    name: "New Smyrna Beach",
    location: "New Smyrna Beach, FL",
    // Volusia County official YouTube live streams
    youtubeId: "kB2PZC-ow68",
    directUrl: "https://www.volusia.org/services/public-protection/beach-safety/beachcams-and-daily-safety-report.stml",
    type: "beach",
  },
  {
    name: "Ponce Inlet Beach",
    location: "Ponce Inlet, FL",
    // Volusia County official YouTube live stream
    youtubeId: "3Z97TxN9qQ8",
    directUrl: "https://www.volusia.org/services/public-protection/beach-safety/beachcams-and-daily-safety-report.stml",
    type: "beach",
  },
  {
    name: "Key West – Mallory Square",
    location: "Key West, FL",
    // Official Mallory Square webcam site
    directUrl: "https://www.mallorysquare.com/key-west-webcam/",
    type: "harbor",
  },
  {
    name: "Panama City Beach",
    location: "Panama City Beach, FL",
    // Official PCBeach.org tourism site list
    directUrl: "https://pcbeach.org/live-beach-webcams/",
    type: "beach",
  },
  {
    name: "Miami Beach – 1st Street",
    location: "Miami Beach, FL",
    // Official City of Miami Beach page
    directUrl: "https://www.miamibeachfl.gov/city-hall/fire/ocean-rescue/1st-street-live-webcam/",
    type: "beach",
  },
  {
    name: "Fort Myers Beach",
    location: "Fort Myers Beach, FL",
    // Official Fort Myers Beach Chamber site
    directUrl: "https://www.fortmyersbeach.org/fort-myers-beach-webcams/",
    type: "beach",
  },
  {
    name: "Destin Beach",
    location: "Destin, FL",
    // Official City of Destin webcam page
    directUrl: "https://www.cityofdestin.com/711/LIVE-Webcams",
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

function CamCard({ cam }) {
  const [playing, setPlaying] = useState(false);
  const TypeIcon = typeIcons[cam.type] || Waves;
  const colorClass = typeColors[cam.type] || typeColors.beach;

  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/[0.07] hover:border-violet-500/30 transition-all overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/[0.07]">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg ${colorClass} flex items-center justify-center shrink-0`}>
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
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-violet-600/30 text-muted-foreground hover:text-violet-300 text-xs font-medium transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            Site
          </a>
        </div>
      </div>

      {/* Video area */}
      <div className="relative bg-black aspect-video">
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2 py-1 rounded bg-red-600/90 text-white text-xs font-semibold pointer-events-none">
          <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          LIVE
        </div>

        {cam.youtubeId && playing ? (
          <>
            <button
              onClick={() => setPlaying(false)}
              className="absolute top-3 right-3 z-20 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${cam.youtubeId}?autoplay=1&mute=1&rel=0&modestbranding=1`}
              title={cam.name}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </>
        ) : (
          <button
            onClick={() => cam.youtubeId ? setPlaying(true) : window.open(cam.directUrl, "_blank")}
            className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-900/20 to-teal-900/20 hover:from-violet-900/40 hover:to-teal-900/40 transition-all group"
          >
            {cam.youtubeId ? (
              // YouTube thumbnail preview
              <div className="relative w-full h-full">
                <img
                  src={`https://img.youtube.com/vi/${cam.youtubeId}/hqdefault.jpg`}
                  alt={cam.name}
                  className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-red-600/90 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                    <Play className="w-6 h-6 text-white ml-1" fill="white" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center p-6">
                <div className="w-14 h-14 rounded-full bg-violet-600/30 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <ExternalLink className="w-7 h-7 text-violet-300" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">View Official Cam</p>
                <p className="text-xs text-muted-foreground">Opens official site</p>
              </div>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export default function LiveCams() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="📡 Live Cams" showBack />

      <div className="px-4 py-4 space-y-4">
        {/* Info Banner */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-violet-500/10 to-teal-500/10 border border-violet-500/20">
          <div className="flex items-start gap-3">
            <Sun className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-foreground">Live Cams</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Sourced from official city, county, and tourism sites across Florida. YouTube cams play in-app; others open the official site.
              </p>
            </div>
          </div>
        </div>

        {/* Camera Cards */}
        <div className="space-y-4">
          {floridaCams.map((cam, idx) => (
            <CamCard key={idx} cam={cam} />
          ))}
        </div>

        <div className="text-center py-4">
          <p className="text-xs text-muted-foreground">
            📡 Streams sourced from official city & tourism sites
          </p>
        </div>
      </div>
    </div>
  );
}