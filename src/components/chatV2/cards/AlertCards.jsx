import { CloudLightning, Zap, Siren, MapPin, Clock, CheckCircle2 } from "lucide-react";
import { formatTime } from "@/lib/chatV2/chatV2Utils";

const SHELL = "w-full rounded-2xl border overflow-hidden msg-card-in";

function Head({ icon: Icon, label, color, sub }) {
  return (
    <div className="flex items-center gap-2 px-3 pt-2.5 pb-2">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
        {sub && <p className="text-sm font-semibold text-foreground truncate">{sub}</p>}
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-lg bg-background/40 border border-white/[0.04] px-2 py-1.5 text-center">
      <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-sm font-bold text-foreground leading-tight">{value}</p>
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

export function WeatherAlertCard({ data, message }) {
  const sev = data.severity || "Watch";
  const sevColor = sev === "Warning" ? "text-red-400" : sev === "Watch" ? "text-amber-400" : "text-sky-400";
  return (
    <div className={`${SHELL} bg-sky-500/10 border-sky-500/30`}>
      <Head icon={CloudLightning} label="Weather Alert" color="bg-sky-500/20 text-sky-300" sub={data.title || "Severe Weather"} />
      <div className="px-3 pb-3 space-y-2">
        <div className="rs-tile-radar h-20 rounded-xl border border-sky-500/20 bg-slate-900/50" />
        <div className="grid grid-cols-3 gap-2">
          <Metric label="Storm" value={data.storm_distance_miles != null ? `${data.storm_distance_miles}mi` : "—"} />
          <Metric label="Lightning" value={data.lightning_distance_miles != null ? `${data.lightning_distance_miles}mi` : "—"} />
          <Metric label="ETA" value={data.eta_minutes != null ? `${data.eta_minutes}m` : "—"} />
        </div>
        <div className="flex items-center justify-between">
          <span className={`text-xs font-bold ${sevColor}`}>{sev.toUpperCase()}</span>
          {data.community && <span className="text-[10px] text-muted-foreground truncate">{data.community}</span>}
        </div>
      </div>
      <Foot message={message} />
    </div>
  );
}

export function LightningAlertCard({ data, message }) {
  const dist = data.distance_miles != null ? `${data.distance_miles} mi` : "—";
  return (
    <div className={`${SHELL} bg-amber-500/10 border-amber-500/30`}>
      <Head icon={Zap} label="Lightning Alert" color="bg-amber-500/20 text-amber-300" sub={`${dist} away`} />
      <div className="px-3 pb-3 space-y-2">
        <div className="flex items-center gap-3">
          <div className="relative w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
            <div className="absolute inset-0 rounded-full bg-amber-400/20 mist-pulse-ring" />
            <Zap className="w-6 h-6 text-amber-300" />
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            {data.strike_time && <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{data.strike_time}</p>}
            {data.location && <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{data.location}</p>}
            <span className="inline-block text-[10px] font-bold text-amber-300 bg-amber-500/15 px-1.5 py-0.5 rounded-full">{data.severity || "Detected"}</span>
          </div>
        </div>
      </div>
      <Foot message={message} />
    </div>
  );
}

export function EmergencyTrafficCard({ data, message }) {
  const priority = data.priority || "Priority Traffic";
  return (
    <div className={`${SHELL} bg-red-500/10 border-red-500/40`}>
      <div className="flex items-center gap-2 px-3 pt-2.5 pb-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-500/20 text-red-300 shrink-0">
          <Siren className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-red-300">Emergency Traffic</p>
          <p className="text-sm font-semibold text-foreground truncate">{priority}</p>
        </div>
        <span className="mist-pulse-ring w-2.5 h-2.5 rounded-full bg-red-400" />
      </div>
      <div className="px-3 pb-3 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          {data.community && <Metric label="Community" value={data.community} />}
          {data.time && <Metric label="Time" value={data.time} />}
          {data.reporter && <Metric label="Reporting Op" value={data.reporter} />}
          {data.location && <Metric label="Location" value={data.location} />}
        </div>
        {data.details && <p className="text-xs text-foreground/90 leading-relaxed">{data.details}</p>}
        <button className="w-full h-9 rounded-xl bg-red-500/20 text-red-200 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-red-500/30 transition-colors">
          <CheckCircle2 className="w-4 h-4" /> Acknowledge
        </button>
      </div>
      <Foot message={message} />
    </div>
  );
}