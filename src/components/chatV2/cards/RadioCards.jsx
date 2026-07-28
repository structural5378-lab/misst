import { Radio, CalendarClock, Headphones, Wifi, MapPin, Activity, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { formatTime } from "@/lib/chatV2/chatV2Utils";

const SHELL = "w-full rounded-2xl border overflow-hidden msg-card-in";

function Head({ icon: Icon, label, color, sub, action }) {
  return (
    <div className="flex items-center gap-2 px-3 pt-2.5 pb-2">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
        {sub && <p className="text-sm font-semibold text-foreground truncate">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

function Row({ label, value, icon: Icon }) {
  return (
    <div className="flex items-center justify-between py-1 text-xs">
      <span className="text-muted-foreground flex items-center gap-1.5">{Icon && <Icon className="w-3 h-3" />}{label}</span>
      <span className="text-foreground font-medium truncate ml-2">{value || "—"}</span>
    </div>
  );
}

function Foot({ message }) {
  return (
    <div className="flex items-center justify-between px-3 pb-2 pt-1 text-[10px] text-muted-foreground">
      <span className="truncate">{message?.sender_name || "System"}</span>
      <span>{formatTime(message?.created_date)}</span>
    </div>
  );
}

function JoinButton({ to }) {
  if (to) {
    return (
      <Link to={to} className="flex-1 h-9 rounded-xl bg-accent/20 text-accent-foreground text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-accent/30 transition-colors" style={{ color: "hsl(var(--accent))" }}>
        Join <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    );
  }
  return (
    <button className="flex-1 h-9 rounded-xl bg-accent/20 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-accent/30 transition-colors" style={{ color: "hsl(var(--accent))" }}>
      Join <ArrowRight className="w-3.5 h-3.5" />
    </button>
  );
}

export function ActiveNetCard({ data, message }) {
  const to = data.id ? `/nets/${data.id}/control` : null;
  return (
    <div className={`${SHELL} bg-emerald-500/10 border-emerald-500/30`}>
      <Head icon={Radio} label="Active Net" color="bg-emerald-500/20 text-emerald-300" sub={data.name || "Net In Progress"} action={<span className="flex items-center gap-1 text-[10px] font-bold text-emerald-300"><span className="w-2 h-2 rounded-full bg-emerald-400 mist-pulse-ring" />LIVE</span>} />
      <div className="px-3 pb-2">
        <Row label="Frequency" value={data.frequency ? `${data.frequency} MHz` : "—"} icon={Wifi} />
        <Row label="Tone" value={data.tone || "—"} icon={Activity} />
        <Row label="Net Control" value={data.net_control || "—"} icon={Headphones} />
        {data.checkins != null && <Row label="Check-ins" value={data.checkins} icon={Radio} />}
      </div>
      <div className="px-3 pb-3"><JoinButton to={to} /></div>
      <Foot message={message} />
    </div>
  );
}

export function ScheduledNetCard({ data, message }) {
  return (
    <div className={`${SHELL} bg-accent/10 border-accent/30`} style={{ borderColor: "hsl(var(--accent) / 0.3)" }}>
      <Head icon={CalendarClock} label="Scheduled Net" color="bg-accent/20 text-cyan-300" sub={data.name || "Upcoming Net"} />
      <div className="px-3 pb-2">
        <Row label="Schedule" value={data.schedule || "—"} icon={CalendarClock} />
        <Row label="Time" value={data.time || "—"} icon={CalendarClock} />
        <Row label="Frequency" value={data.frequency ? `${data.frequency} MHz` : "—"} icon={Wifi} />
      </div>
      <div className="px-3 pb-3">
        <button className="w-full h-9 rounded-xl bg-accent/15 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-accent/25 transition-colors" style={{ color: "hsl(var(--accent))" }}>
          Set Reminder
        </button>
      </div>
      <Foot message={message} />
    </div>
  );
}

export function RadioCheckinCard({ data, message }) {
  const bars = Math.max(1, Math.min(5, Number(data.signal) || 3));
  return (
    <div className={`${SHELL} bg-background/60 border-border`}>
      <Head icon={Headphones} label="Radio Check-in" color="bg-primary/20 text-primary" sub={data.callsign || "Operator"} />
      <div className="px-3 pb-3 space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex items-end gap-0.5 h-8">
            {[1, 2, 3, 4, 5].map((b) => (
              <span key={b} className={`w-1.5 rounded-sm ${b <= bars ? "bg-emerald-400" : "bg-muted/40"}`} style={{ height: `${b * 18}%` }} />
            ))}
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            {data.net_name && <Row label="Net" value={data.net_name} />}
            {data.location && <p className="text-[11px] text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{data.location}</p>}
          </div>
        </div>
        {data.notes && <p className="text-xs text-foreground/90 leading-relaxed">{data.notes}</p>}
      </div>
      <Foot message={message} />
    </div>
  );
}

export function RepeaterCard({ data, message }) {
  return (
    <div className={`${SHELL} bg-accent/10 border-accent/30`} style={{ borderColor: "hsl(var(--accent) / 0.3)" }}>
      <Head icon={Wifi} label="Repeater Online" color="bg-accent/20 text-cyan-300" sub={data.callsign || "Repeater"} action={<span className="flex items-center gap-1 text-[10px] font-bold text-emerald-300"><span className="w-2 h-2 rounded-full bg-emerald-400 mist-pulse-ring" />ONLINE</span>} />
      <div className="px-3 pb-2">
        <Row label="Frequency" value={data.frequency ? `${data.frequency} MHz` : "—"} icon={Radio} />
        <Row label="Tone" value={data.tone || "—"} icon={Activity} />
        {data.users_monitoring != null && <Row label="Monitoring" value={data.users_monitoring} icon={Headphones} />}
        {data.current_net && <Row label="Current Net" value={data.current_net} icon={Radio} />}
        {data.next_net && <Row label="Next Net" value={data.next_net} icon={CalendarClock} />}
      </div>
      <div className="px-3 pb-3"><JoinButton to={data.net_id ? `/nets/${data.net_id}/control` : null} /></div>
      <Foot message={message} />
    </div>
  );
}