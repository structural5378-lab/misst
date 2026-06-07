import React from "react";
import { Radio, Users, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NetCard({ net }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border/50">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Radio className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">{net.name}</h4>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-primary">{net.schedule}</span>
            <span className="text-xs text-muted-foreground">· {net.time}</span>
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-xs text-muted-foreground">{net.description}</span>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <Users className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{net.member_count || 0} Joined</span>
          </div>
        </div>
      </div>
      <Button size="sm" className="h-8 bg-primary/90 hover:bg-primary text-primary-foreground rounded-full px-5 text-xs font-semibold">
        Join
      </Button>
    </div>
  );
}