import React from "react";
import { Shield, Radio, Award } from "lucide-react";

// Role + GMRS badges shown beside sender names and in member lists.
export function roleBadge(role) {
  switch (role) {
    case "community_owner": return { label: "Owner", cls: "text-violet-300 bg-violet-500/15", Icon: Shield };
    case "community_admin": return { label: "Admin", cls: "text-violet-300 bg-violet-500/15", Icon: Shield };
    case "moderator": return { label: "Mod", cls: "text-cyan-300 bg-cyan-500/15", Icon: Shield };
    case "net_control": return { label: "NC", cls: "text-emerald-300 bg-emerald-500/15", Icon: Radio };
    case "trusted_member": return { label: "Trusted", cls: "text-sky-300 bg-sky-500/15", Icon: Award };
    default: return null;
  }
}

export function gmrsBadge(callsign) {
  if (!callsign) return null;
  return { label: "GMRS", cls: "text-amber-300 bg-amber-500/15", Icon: Award };
}

export function Badge({ badge }) {
  if (!badge) return null;
  const { label, cls, Icon } = badge;
  return <span className={`inline-flex items-center gap-0.5 text-[9px] font-semibold px-1 py-0.5 rounded-full ${cls}`}><Icon className="w-2.5 h-2.5" />{label}</span>;
}

export function SenderBadges({ member }) {
  if (!member) return null;
  const out = [];
  const rb = roleBadge(member.role);
  if (rb) out.push(rb);
  const gb = gmrsBadge(member.user_callsign);
  if (gb) out.push(gb);
  return (
    <span className="inline-flex items-center gap-1">
      {out.map((b, i) => <Badge key={i} badge={b} />)}
    </span>
  );
}