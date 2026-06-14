import React from "react";
import { Link } from "react-router-dom";
import { Radio, MapPin, Users, MessageSquare, Wrench, Camera, UserCircle2, CloudSun } from "lucide-react";

const items = [
  { icon: Radio, label: "Repeaters", path: "/repeaters", color: "text-primary" },
  { icon: MapPin, label: "Map", path: "/map", color: "text-emerald-400" },
  { icon: Users, label: "Nets", path: "/nets", color: "text-purple-400" },
  { icon: MessageSquare, label: "Forum", path: "/community-forum", color: "text-blue-400" },
  { icon: Camera, label: "Gallery", path: "/gallery", color: "text-pink-400" },
  { icon: UserCircle2, label: "Members", path: "/members", color: "text-cyan-400" },
  { icon: Wrench, label: "Tools", path: "/tools", color: "text-orange-400" },
  { icon: CloudSun, label: "Weather", path: "/weather", color: "text-yellow-400" },
];

export default function QuickAccessGrid() {
  return (
    <div className="grid grid-cols-4 gap-2">
      {items.map(({ icon: Icon, label, path, color }) => (
        <Link
          key={label}
          to={path}
          className="flex flex-col items-center gap-2 p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
        >
          <div className="w-11 h-11 rounded-xl bg-card flex items-center justify-center border border-border">
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
        </Link>
      ))}
    </div>
  );
}