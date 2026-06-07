import React from "react";
import { useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Radio, MapPin, Signal, Star } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";

export default function RepeaterDetail() {
  const { id } = useParams();

  const { data: repeater, isLoading } = useQuery({
    queryKey: ["repeater", id],
    queryFn: async () => {
      const list = await base44.entities.Repeater.filter({ id });
      return list[0];
    },
  });

  if (isLoading || !repeater) {
    return (
      <div>
        <PageHeader title="Repeater" showBack />
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={repeater.callsign} showBack />
      <div className="px-4 pt-4 space-y-4">
        {/* Hero */}
        <div className="relative w-full h-48 rounded-2xl bg-secondary/50 overflow-hidden flex items-center justify-center">
          {repeater.image_url ? (
            <img src={repeater.image_url} alt={repeater.callsign} className="w-full h-full object-cover" />
          ) : (
            <Radio className="w-16 h-16 text-primary/30" />
          )}
        </div>

        {/* Info */}
        <div className="p-4 rounded-2xl bg-card border border-border/50 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">{repeater.callsign} Repeater</h2>
            <StatusBadge status={repeater.status || "online"} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-secondary/50">
              <p className="text-xs text-muted-foreground">Frequency</p>
              <p className="text-sm font-semibold text-primary">{repeater.frequency?.toFixed(3)} MHz</p>
            </div>
            <div className="p-3 rounded-xl bg-secondary/50">
              <p className="text-xs text-muted-foreground">Offset</p>
              <p className="text-sm font-semibold text-foreground">{repeater.offset || "N/A"}</p>
            </div>
            <div className="p-3 rounded-xl bg-secondary/50">
              <p className="text-xs text-muted-foreground">PL Tone</p>
              <p className="text-sm font-semibold text-foreground">{repeater.tone || "None"}</p>
            </div>
            <div className="p-3 rounded-xl bg-secondary/50">
              <p className="text-xs text-muted-foreground">Owner</p>
              <p className="text-sm font-semibold text-foreground">{repeater.owner_callsign || "N/A"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">{repeater.location || "Unknown"}</span>
          </div>
          {repeater.description && (
            <p className="text-sm text-muted-foreground">{repeater.description}</p>
          )}
        </div>

        <Button className="w-full bg-primary/90 hover:bg-primary h-11 rounded-xl">
          <Star className="w-4 h-4 mr-2" />
          Add to Favorites
        </Button>
      </div>
    </div>
  );
}