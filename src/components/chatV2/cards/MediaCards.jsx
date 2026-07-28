import { Image as ImageIcon, FileText, MapPin, Calendar, BarChart3, Download, Navigation, Megaphone } from "lucide-react";
import { formatTime } from "@/lib/chatV2/chatV2Utils";
import { Link } from "react-router-dom";

const SHELL = "w-full rounded-2xl border overflow-hidden msg-card-in";

function fmtSize(bytes) {
  const n = Number(bytes);
  if (!n || n <= 0) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function Foot({ message, fallback }) {
  return (
    <div className="flex items-center justify-between px-3 pb-2 pt-1 text-[10px] text-muted-foreground">
      <span className="truncate">{message?.sender_name || fallback || "System"}</span>
      <span>{formatTime(message?.created_date)}</span>
    </div>
  );
}

export function PhotoCard({ data, message }) {
  const url = data.url || data;
  return (
    <div className={`${SHELL} bg-background/60 border-border`}>
      <div className="bg-black/30">
        {url ? (
          <img src={url} alt={data.name || ""} className="w-full max-h-64 object-cover" loading="lazy" />
        ) : (
          <div className="h-40 flex items-center justify-center text-muted-foreground/40"><ImageIcon className="w-8 h-8" /></div>
        )}
      </div>
      {(data.name || data.caption) && (
        <div className="px-3 py-2">
          {data.name && <p className="text-xs font-medium text-foreground truncate">{data.name}</p>}
          {data.caption && <p className="text-[11px] text-muted-foreground">{data.caption}</p>}
        </div>
      )}
      <Foot message={message} />
    </div>
  );
}

export function FileCard({ data, message }) {
  const url = data.url;
  return (
    <div className={`${SHELL} bg-background/60 border-border`}>
      <div className="flex items-center gap-3 px-3 py-3">
        <div className="w-10 h-10 rounded-lg bg-accent/15 flex items-center justify-center shrink-0" style={{ background: "hsl(var(--accent) / 0.15)" }}>
          <FileText className="w-5 h-5 text-cyan-300" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground truncate">{data.name || "File"}</p>
          <p className="text-[11px] text-muted-foreground">{fmtSize(data.size) || data.type || "Document"}</p>
        </div>
        {url && (
          <a href={url} download={data.name} target="_blank" rel="noreferrer" className="p-2 rounded-lg bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary">
            <Download className="w-4 h-4" />
          </a>
        )}
      </div>
      <Foot message={message} />
    </div>
  );
}

export function LocationCard({ data, message }) {
  const lat = data.lat ?? data.latitude;
  const lon = data.lon ?? data.longitude;
  return (
    <div className={`${SHELL} bg-background/60 border-border`}>
      <div className="flex items-center gap-2 px-3 pt-2.5 pb-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-accent/20 text-cyan-300 shrink-0" style={{ background: "hsl(var(--accent) / 0.2)" }}>
          <MapPin className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Shared Location</p>
          <p className="text-sm font-semibold text-foreground truncate">{data.label || (lat != null && lon != null ? `${lat.toFixed(4)}, ${lon.toFixed(4)}` : "Location")}</p>
        </div>
      </div>
      <div className="px-3 pb-3">
        <Link to="/radioscope" className="w-full h-9 rounded-xl bg-accent/15 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-accent/25 transition-colors" style={{ color: "hsl(var(--accent))" }}>
          <Navigation className="w-4 h-4" /> Open in RadioScope
        </Link>
      </div>
      <Foot message={message} />
    </div>
  );
}

export function EventCard({ data, message }) {
  return (
    <div className={`${SHELL} bg-violet-500/10 border-violet-500/30`}>
      <div className="flex items-center gap-2 px-3 pt-2.5 pb-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-violet-500/20 text-violet-300 shrink-0">
          <Calendar className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Community Event</p>
          <p className="text-sm font-semibold text-foreground truncate">{data.title || "Event"}</p>
        </div>
      </div>
      <div className="px-3 pb-3 space-y-1">
        {data.date && <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Calendar className="w-3 h-3" />{data.date}</p>}
        {data.location && <p className="text-xs text-muted-foreground flex items-center gap-1.5"><MapPin className="w-3 h-3" />{data.location}</p>}
        {data.description && <p className="text-xs text-foreground/90 leading-relaxed">{data.description}</p>}
        <button className="w-full h-9 rounded-xl bg-violet-500/20 text-violet-200 text-xs font-bold hover:bg-violet-500/30 transition-colors">RSVP</button>
      </div>
      <Foot message={message} />
    </div>
  );
}

export function PollCard({ data, message }) {
  const options = Array.isArray(data.options) ? data.options : [];
  const total = options.reduce((s, o) => s + (Number(o.votes) || 0), 0) || 1;
  return (
    <div className={`${SHELL} bg-background/60 border-border`}>
      <div className="flex items-center gap-2 px-3 pt-2.5 pb-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/20 text-primary shrink-0">
          <BarChart3 className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Poll</p>
          <p className="text-sm font-semibold text-foreground truncate">{data.question || "Poll"}</p>
        </div>
      </div>
      <div className="px-3 pb-3 space-y-1.5">
        {options.map((o, i) => {
          const pct = Math.round(((Number(o.votes) || 0) / total) * 100);
          return (
            <div key={i} className="relative overflow-hidden rounded-lg border border-border">
              <div className="absolute inset-y-0 left-0 bg-primary/15" style={{ width: `${pct}%` }} />
              <div className="relative flex items-center justify-between px-2.5 py-1.5 text-xs">
                <span className="text-foreground truncate">{o.text || o.label || `Option ${i + 1}`}</span>
                <span className="text-muted-foreground font-semibold ml-2">{pct}%</span>
              </div>
            </div>
          );
        })}
        {options.length === 0 && <p className="text-xs text-muted-foreground">No options provided.</p>}
        <p className="text-[10px] text-muted-foreground">{total - 1 <= 0 ? 0 : total - 1} votes</p>
      </div>
      <Foot message={message} />
    </div>
  );
}

export function SystemCard({ data, message }) {
  return (
    <div className="flex justify-center my-1">
      <div className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground bg-secondary/50 border border-border px-3 py-1 rounded-full">
        <Megaphone className="w-3 h-3 opacity-70" />
        {data.body || message?.body}
      </div>
    </div>
  );
}