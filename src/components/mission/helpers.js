import {
  CheckCircle, Clock, Car, Home, UserPlus, Siren, Flag, Eye, Hourglass,
  Play, Pause, Square, Radio, CloudLightning, MessageSquare, UserCheck,
} from "lucide-react";

export const CHECKIN_STATUSES = {
  checked_in: { label: "Checked In", color: "text-emerald-400", bg: "bg-emerald-500/15", border: "border-emerald-500/30", dot: "bg-emerald-400", Icon: CheckCircle },
  late: { label: "Late", color: "text-amber-400", bg: "bg-amber-500/15", border: "border-amber-500/30", dot: "bg-amber-400", Icon: Clock },
  mobile: { label: "Mobile", color: "text-cyan-400", bg: "bg-cyan-500/15", border: "border-cyan-500/30", dot: "bg-cyan-400", Icon: Car },
  base: { label: "Base", color: "text-blue-400", bg: "bg-blue-500/15", border: "border-blue-500/30", dot: "bg-blue-400", Icon: Home },
  visitor: { label: "Visitor", color: "text-violet-400", bg: "bg-violet-500/15", border: "border-violet-500/30", dot: "bg-violet-400", Icon: UserPlus },
  emergency: { label: "Emergency", color: "text-rose-400", bg: "bg-rose-500/15", border: "border-rose-500/30", dot: "bg-rose-400", Icon: Siren },
  priority: { label: "Priority", color: "text-orange-400", bg: "bg-orange-500/15", border: "border-orange-500/30", dot: "bg-orange-400", Icon: Flag },
  monitoring: { label: "Monitoring", color: "text-slate-400", bg: "bg-slate-500/15", border: "border-slate-500/30", dot: "bg-slate-400", Icon: Eye },
  pending: { label: "Pending", color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30", dot: "bg-yellow-400", Icon: Hourglass },
};

export const TIMELINE_ICONS = {
  net_started: { Icon: Play, color: "text-emerald-400", bg: "bg-emerald-500/15" },
  net_paused: { Icon: Pause, color: "text-amber-400", bg: "bg-amber-500/15" },
  net_resumed: { Icon: Play, color: "text-cyan-400", bg: "bg-cyan-500/15" },
  net_closed: { Icon: Square, color: "text-rose-400", bg: "bg-rose-500/15" },
  checkin: { Icon: UserCheck, color: "text-violet-400", bg: "bg-violet-500/15" },
  member_joined: { Icon: UserPlus, color: "text-blue-400", bg: "bg-blue-500/15" },
  priority: { Icon: Flag, color: "text-orange-400", bg: "bg-orange-500/15" },
  emergency: { Icon: Siren, color: "text-rose-400", bg: "bg-rose-500/15" },
  weather_alert: { Icon: CloudLightning, color: "text-cyan-400", bg: "bg-cyan-500/15" },
  note: { Icon: MessageSquare, color: "text-slate-400", bg: "bg-slate-500/15" },
};

export function statusConfig(status) {
  return CHECKIN_STATUSES[status] || CHECKIN_STATUSES.checked_in;
}

export function fmtDistance(miles) {
  if (miles == null) return null;
  if (miles < 10) return `${miles.toFixed(1)} mi`;
  return `${Math.round(miles)} mi`;
}