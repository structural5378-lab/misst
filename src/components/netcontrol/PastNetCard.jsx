import { Link } from "react-router-dom";
import { Calendar, Clock, Users, UserPlus, FileText } from "lucide-react";

// PastNetCard — summary of a completed net session. Shows date, duration,
// check-ins, visitors, and a link to the full log.
export default function PastNetCard({ session }) {
  const started = session.started_at ? new Date(session.started_at) : null;
  const ended = session.ended_at ? new Date(session.ended_at) : null;
  const duration = started && ended ? formatDur(ended.getTime() - started.getTime() - (session.paused_total || 0)) : "—";
  const dateStr = started ? started.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

  return (
    <Link to={`/nets/${session.net_id}/control`} className="block rounded-2xl bg-card/60 border border-white/[0.06] p-4 hover:border-violet-500/30 transition active:scale-[0.99]">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground truncate">{session.net_name}</h3>
        <FileText className="w-4 h-4 text-violet-300/60" />
      </div>
      <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
        <Info icon={Calendar} label="Date" value={dateStr} />
        <Info icon={Clock} label="Duration" value={duration} />
        <Info icon={Users} label="Check-ins" value={session.checkin_count || 0} />
        <Info icon={UserPlus} label="Visitors" value={session.visitors || 0} />
      </div>
    </Link>
  );
}

function Info({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="w-3 h-3 text-muted-foreground" />
      <span className="text-muted-foreground">{label}:</span>
      <span className="text-foreground font-medium">{value}</span>
    </div>
  );
}

function formatDur(ms) {
  const m = Math.round(ms / 60000);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}