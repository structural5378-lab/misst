import React from "react";
import { Calendar, Users, Flame } from "lucide-react";

export default function MembershipFooter({ joined, club, streak }) {
  const pills = [
    { icon: Calendar, label: joined || "MIST", color: "text-violet-300", bg: "bg-violet-500/10 border-violet-500/30" },
    { icon: Users, label: club || "Insomniacs GMRS", color: "text-cyan-300", bg: "bg-cyan-500/10 border-cyan-500/30" },
    { icon: Flame, label: `${streak || 0}d streak`, color: "text-orange-300", bg: "bg-orange-500/10 border-orange-500/30" },
  ];
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {pills.map((p, i) => {
        const Icon = p.icon;
        return (
          <span
            key={i}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${p.bg} text-xs font-medium ${p.color}`}
          >
            <Icon className="w-3.5 h-3.5" />
            {p.label}
          </span>
        );
      })}
    </div>
  );
}