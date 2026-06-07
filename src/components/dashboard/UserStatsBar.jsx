import React from "react";
import { Star, Award, MessageSquare } from "lucide-react";

export default function UserStatsBar({ reputation = 0, badges = 0, forums = 0 }) {
  const stats = [
    { icon: Star, label: "Reputation", value: reputation },
    { icon: Award, label: "Badges", value: badges },
    { icon: MessageSquare, label: "Forums", value: forums },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {stats.map(({ icon: Icon, label, value }) => (
        <div key={label} className="flex flex-col items-center py-3 rounded-xl bg-secondary/50 border border-border/50">
          <span className="text-xl font-bold text-foreground">{value}</span>
          <span className="text-[10px] text-muted-foreground mt-0.5">{label}</span>
        </div>
      ))}
    </div>
  );
}