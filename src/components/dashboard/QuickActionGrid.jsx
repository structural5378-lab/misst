import React from "react";
import { Link } from "react-router-dom";
import { Shield, Mic, Mail, MessageSquare } from "lucide-react";

const CARDS = [
  { icon: Shield, label: "Administrator", path: "/platform/admin", gradient: "from-amber-500 to-orange-600", glow: "shadow-amber-500/40", adminOnly: true },
  { icon: Mic, label: "Net Control", path: "/nets", gradient: "from-blue-500 to-cyan-500", glow: "shadow-cyan-500/40" },
  { icon: Mail, label: "Messages", path: "/messages", gradient: "from-violet-500 to-purple-600", glow: "shadow-violet-500/40" },
  { icon: MessageSquare, label: "Community", path: "/community-forum", gradient: "from-fuchsia-500 to-pink-600", glow: "shadow-fuchsia-500/40" },
];

export default function QuickActionGrid({ isAdmin }) {
  const items = CARDS.filter((c) => (c.adminOnly ? isAdmin : true));
  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map(({ icon: Icon, label, path, gradient, glow }) => (
        <Link key={label} to={path} aria-label={label} className="group">
          <div className={`relative h-24 rounded-2xl bg-gradient-to-br ${gradient} ${glow} shadow-lg flex flex-col items-center justify-center gap-2 transition-all active:scale-95 group-hover:scale-[1.02] overflow-hidden`}>
            <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
            <Icon className="w-7 h-7 text-white relative drop-shadow-lg" />
            <span className="text-xs font-bold text-white relative drop-shadow">{label}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}