import React from "react";
import { Link } from "react-router-dom";
import { Radio, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function UpcomingNetsPreview({ nets = [] }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">Upcoming Nets</h3>
        <Link to="/nets" className="text-xs text-primary font-medium">View All</Link>
      </div>
      <div className="space-y-2">
        {nets.slice(0, 3).map((net) => (
          <div key={net.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/40 border border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Radio className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{net.name}</p>
                <p className="text-xs text-muted-foreground">{net.time}</p>
              </div>
            </div>
            <Button size="sm" variant="outline" className="h-7 text-xs border-primary/30 text-primary hover:bg-primary/10">
              Join
            </Button>
          </div>
        ))}
        {nets.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">No upcoming nets</p>
        )}
      </div>
    </div>
  );
}