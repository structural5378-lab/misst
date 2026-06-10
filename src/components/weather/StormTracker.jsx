import React from "react";
import { Cloud, Wind, Droplets, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const stormSeverityColors = {
  tropical_depression: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  tropical_storm: "bg-green-500/20 text-green-400 border-green-500/30",
  hurricane: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  major_hurricane: "bg-red-500/20 text-red-400 border-red-500/30",
};

const stormIcons = {
  tropical_depression: Cloud,
  tropical_storm: Wind,
  hurricane: AlertTriangle,
  major_hurricane: AlertTriangle,
};

export default function StormTracker() {
  const { data: storms, isLoading, error } = useQuery({
    queryKey: ["noaa-storms"],
    queryFn: async () => {
      // NOAA Atlantic Hurricane Database API
      const response = await fetch(
        "https://services.weather.gov/products/locations/AT/awips/URPNAT2"
      );
      
      if (!response.ok) {
        throw new Error("Storm data unavailable");
      }
      
      const data = await response.text();
      // Parse tropical cyclone advisory data
      return parseStormData(data);
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 15 * 60 * 1000, // 15 minutes
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.07]">
        <div className="flex justify-center py-6">
          <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !storms || storms.length === 0) {
    return (
      <div className="p-4 rounded-xl bg-gradient-to-r from-teal-500/10 to-cyan-500/10 border border-teal-500/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-teal-500/20 flex items-center justify-center">
            <Cloud className="w-5 h-5 text-teal-400" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">Atlantic Storm Tracker</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              No active tropical systems in the Atlantic basin
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">
              Source: NOAA National Hurricane Center
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          Atlantic Storm Tracker
        </h4>
        <span className="text-xs text-muted-foreground">
          Source: NOAA NHC
        </span>
      </div>

      <div className="space-y-2">
        {storms.map((storm, idx) => {
          const StormIcon = stormIcons[storm.category] || Cloud;
          const colorClass = stormSeverityColors[storm.category] || stormSeverityColors.tropical_storm;

          return (
            <div
              key={idx}
              className={`p-3 rounded-xl border ${colorClass}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`w-10 h-10 rounded-lg ${colorClass} flex items-center justify-center`}>
                    <StormIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h5 className="text-sm font-bold text-foreground">{storm.name}</h5>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 font-semibold uppercase">
                        {storm.category.replace("_", " ")}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
                      <div className="flex items-center gap-1.5 text-xs text-foreground/80">
                        <Wind className="w-3 h-3" />
                        <span>Max Winds: {storm.max_winds} mph</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-foreground/80">
                        <Droplets className="w-3 h-3" />
                        <span>Pressure: {storm.pressure} mb</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-foreground/80">
                        <Cloud className="w-3 h-3" />
                        <span>Moving: {storm.movement}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-foreground/80">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Location: {storm.location}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-muted-foreground text-center">
        Data provided by NOAA National Hurricane Center • Updates every 15 minutes
      </p>
    </div>
  );
}

// Parse NOAA tropical cyclone advisory text
function parseStormData(text) {
  const storms = [];
  
  // Simple parser for tropical cyclone advisories
  // This is a basic implementation - real parsing would be more complex
  const stormBlocks = text.split(/\n\s*\n/);
  
  stormBlocks.forEach(block => {
    if (block.includes("TROPICAL") || block.includes("HURRICANE")) {
      const nameMatch = block.match(/([A-Z]+)\.\.\.([A-Z\s]+)(?:ADVISORY|INTERMEDIATE)/);
      const windMatch = block.match(/MAXIMUM SUSTAINED WINDS[.:]\s*(\d+)/);
      const pressureMatch = block.match(/MINIMUM CENTRAL PRESSURE[.:]\s*(\d+)/);
      const movementMatch = block.match(/MOVEMENT[.:]\s*(.+?)(?:\n|$)/);
      const locationMatch = block.match(/LOCATION[.:]\s*(.+?)(?:\n|$)/);
      
      if (nameMatch && windMatch) {
        const maxWinds = parseInt(windMatch[1]);
        let category = "tropical_storm";
        
        if (maxWinds >= 157) category = "major_hurricane";
        else if (maxWinds >= 111) category = "hurricane";
        else if (maxWinds >= 39) category = "tropical_storm";
        else category = "tropical_depression";
        
        storms.push({
          name: nameMatch[1] || "Unknown",
          category,
          max_winds: maxWinds,
          pressure: pressureMatch ? parseInt(pressureMatch[1]) : null,
          movement: movementMatch ? movementMatch[1].trim() : "Unknown",
          location: locationMatch ? locationMatch[1].trim() : "Unknown",
        });
      }
    }
  });
  
  return storms;
}