import React from "react";
import { Link } from "react-router-dom";
import { Radio, MapPin } from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";

export default function RepeaterCard({ repeater }) {
  return (
    <Link
      to={`/repeaters/${repeater.id}`}
      className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors"
    >
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <Radio className="w-6 h-6 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground truncate">{repeater.callsign} Repeater</span>
          <StatusBadge status={repeater.status || "online"} />
        </div>
        <p className="text-xs text-primary mt-0.5">
          {repeater.frequency?.toFixed(3)} MHz {repeater.offset}
        </p>
        <div className="flex items-center gap-1 mt-0.5">
          <MapPin className="w-3 h-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground truncate">{repeater.location}</span>
        </div>
      </div>
    </Link>
  );
}