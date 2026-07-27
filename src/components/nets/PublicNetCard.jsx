import React, { useState } from "react";
import { Radio, Users, Clock, SignalHigh, Hash, Mic, MapPin } from "lucide-react";
import { useMistUser } from "@/hooks/useMistUser";
import { base44 } from "@/api/base44Client";
import NetCheckInPanel from "@/components/nets/NetCheckInPanel";

// PublicNetCard — rich read-only net card for the public schedule.
// Shows LIVE NOW badge when a session is active; Join expands the check-in panel.
export default function PublicNetCard({ net, liveSession }) {
  const { mistUser, mybbUser } = useMistUser();
  const [showCheckin, setShowCheckin] = useState(false);
  const [favBusy, setFavBusy] = useState(false);
  const live = !!liveSession;
  const checkedIn = liveSession?.checkin_count || 0;

  const toggleFav = async () => {
    setFavBusy(true);
    try { await base44.entities.Net.update(net.id, { is_favorite: !net.is_favorite }); }
    catch {}
    setFavBusy(false);
  };

  return (
    <div className={`rounded-2xl bg-card/60 border backdrop-blur-md overflow-hidden ${live ? "border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.12)]" : "border-white/[0.06]"}`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary/10 overflow-hidden flex items-center justify-center shrink-0">
            {net.community_logo ? (
              <img src={net.community_logo} alt="" className="w-full h-full object-cover" />
            ) : (
              <Radio className="w-5 h-5 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-foreground truncate">{net.name}</h3>
              {live ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold uppercase tracking-wide">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live Now
                </span>
              ) : (
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Upcoming</span>
              )}
            </div>
            {net.community_name && <p className="text-[11px] text-muted-foreground">{net.community_name}</p>}
            {net.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{net.description}</p>}
          </div>
          <button
            onClick={toggleFav}
            disabled={favBusy}
            className={`text-lg leading-none ${net.is_favorite ? "text-amber-400" : "text-muted-foreground/50"}`}
            title="Favorite"
          >★</button>
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-3 text-xs">
          <Spec icon={Clock} label="Day" value={net.day_of_week || (JSON.parse(net.days || "[]").join(", ") || "—")} />
          <Spec icon={Clock} label="Time" value={net.time || "—"} />
          <Spec icon={SignalHigh} label="Frequency" value={net.frequency ? `${net.frequency} MHz` : "—"} />
          <Spec icon={Hash} label="Tone" value={net.tone || "—"} />
          <Spec icon={Radio} label="Repeater" value={net.repeater_callsign || "—"} />
          <Spec icon={Mic} label="Net Control" value={net.primary_net_control || net.net_control || "—"} />
          {net.expected_duration_minutes && <Spec icon={Clock} label="Duration" value={`${net.expected_duration_minutes} min`} />}
          <Spec icon={Users} label="Checked In" value={live ? `${checkedIn} live` : `${net.member_count || 0} joined`} />
        </div>

        <button
          onClick={() => setShowCheckin((v) => !v)}
          className={`mt-3 w-full py-2 rounded-xl text-sm font-semibold transition active:scale-[0.98] ${live ? "bg-emerald-500 text-white" : "bg-primary text-primary-foreground"}`}
        >
          {live ? "🟢 Join — Check In" : "Join Net"}
        </button>
      </div>

      {showCheckin && (
        <div className="px-4 pb-4 border-t border-white/[0.06] pt-3">
          <NetCheckInPanel net={net} />
          {live && (
            <p className="text-[11px] text-emerald-400 mt-2 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Net is live — your check-in will be reviewed by Net Control.
            </p>
          )}
          {!live && <p className="text-[11px] text-muted-foreground mt-2">This net isn't live yet. You can pre-check-in; Net Control will see it when the net opens.</p>}
        </div>
      )}
    </div>
  );
}

function Spec({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <Icon className="w-3 h-3 text-muted-foreground shrink-0" />
      <span className="text-muted-foreground">{label}:</span>
      <span className="text-foreground font-medium truncate">{value}</span>
    </div>
  );
}