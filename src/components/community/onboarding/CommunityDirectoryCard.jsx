import React from "react";
import { Users, MapPin, Radio, Lock, Globe, Loader2, Check } from "lucide-react";

function distanceMi(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lat2 == null) return null;
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}

const VIS_BADGE = {
  public: { label: "Public", icon: Globe, cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  private: { label: "Private", icon: Lock, cls: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
};

export default function CommunityDirectoryCard({ community, coords, busy, onJoin }) {
  const badge = VIS_BADGE[community.visibility] || VIS_BADGE.public;
  const VIcon = badge.icon;
  const dist = coords ? distanceMi(coords.lat, coords.lon, community.location_lat, community.location_lon) : null;
  const isPublic = community.visibility === "public";

  return (
    <div className="rounded-2xl overflow-hidden bg-card/60 border border-white/[0.08] backdrop-blur-md hover:border-primary/30 transition-all flex flex-col">
      {/* Banner */}
      <div className="relative h-24 bg-gradient-to-br from-primary/30 via-accent/20 to-background">
        {community.banner_url && (
          <img src={community.banner_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
        <span className={`absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badge.cls}`}>
          <VIcon className="w-2.5 h-2.5" /> {badge.label}
        </span>
      </div>

      {/* Body */}
      <div className="p-4 -mt-8 relative flex-1 flex flex-col">
        <div className="flex items-end gap-2 mb-2">
          <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-card bg-secondary flex items-center justify-center shrink-0">
            {community.logo_url ? (
              <img src={community.logo_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <Users className="w-5 h-5 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0 pb-1">
            <h3 className="text-sm font-bold text-foreground truncate">{community.name}</h3>
            {community.callsign && <p className="text-[11px] text-primary truncate">{community.callsign}</p>}
          </div>
        </div>

        {community.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{community.description}</p>
        )}

        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground mb-3">
          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{community.member_count || 0}</span>
          {community.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{community.location}</span>}
          {dist != null && <span className="flex items-center gap-1 text-primary"><MapPin className="w-3 h-3" />{dist} mi</span>}
          {community.primary_repeater && <span className="flex items-center gap-1"><Radio className="w-3 h-3" />{community.primary_repeater}</span>}
          {community.frequency && <span className="text-cyan-400">{community.frequency} MHz</span>}
        </div>

        <button
          onClick={onJoin}
          disabled={busy}
          className={`mt-auto w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all active:scale-[0.98] ${
            isPublic
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-secondary border border-border text-foreground hover:border-primary/40"
          }`}
        >
          {busy ? (
            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {isPublic ? "Joining…" : "Sending…"}</>
          ) : isPublic ? (
            <><Check className="w-3.5 h-3.5" /> Join Community</>
          ) : (
            <><Lock className="w-3.5 h-3.5" /> Request to Join</>
          )}
        </button>
      </div>
    </div>
  );
}