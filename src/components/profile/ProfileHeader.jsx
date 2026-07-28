import React from "react";
import { Shield, BadgeCheck, MapPin, Calendar, Star, Award, MessageSquare, UserPlus, Edit, LogOut } from "lucide-react";
import GroupTag from "./GroupTag";
import HeroArtwork from "./HeroArtwork";
import LicenseBadge from "./LicenseBadge";
import { heroSeed, heroTheme, heroPrompt } from "@/hooks/useHeroArtwork";

export default function ProfileHeader({
  banner, avatar, displayName, callsign, role, groups, avatarFrame,
  location, joinDate, level, reputation, isSelf, onEdit, onMessage, onFollow, onSignOut,
}) {
  const roleBadge =
    role === "admin" ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
    : role === "moderator" ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
    : "bg-white/[0.05] text-muted-foreground border-white/[0.08]";

  const heroSeedVal = heroSeed({ uid: callsign || displayName, role, level });
  const heroPromptVal = heroPrompt(heroTheme({ role, level }));

  const glassBtn =
    "flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium backdrop-blur-md bg-black/30 hover:bg-black/45 border border-white/15 text-white transition-colors";

  return (
    <div className="operator-card overflow-hidden" style={{ boxShadow: "0 0 40px rgba(139,92,246,0.16), 0 0 14px rgba(139,92,246,0.10)" }}>
      {/* Banner */}
      <div className="relative h-40">
        <HeroArtwork seed={heroSeedVal} prompt={heroPromptVal} />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/10 to-transparent" />

        {/* Secondary actions aligned within the banner (glassmorphic) */}
        <div className="absolute top-3 right-3 flex gap-2">
          {isSelf ? (
            <button onClick={onSignOut} className={glassBtn} title="Sign out" aria-label="Sign out">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          ) : (
            <>
              <button onClick={onMessage} className={glassBtn}>
                <MessageSquare className="w-3.5 h-3.5" />Message
              </button>
              <button onClick={onFollow} className={glassBtn}>
                <UserPlus className="w-3.5 h-3.5" />Follow
              </button>
            </>
          )}
        </div>
      </div>

      {/* Identity row — overlaps the banner so the avatar integrates into it */}
      <div className="px-4 pb-3 -mt-28 relative">
        <div className="flex items-end gap-3">
          <div className={`avatar-frame avatar-frame-${avatarFrame || "common"}`}>
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-violet-950/50 flex items-center justify-center">
              {avatar ? (
                <img src={avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl font-bold text-primary">{(displayName || "?")[0]}</span>
              )}
            </div>
          </div>
          <div className="flex-1 pb-1.5 min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="text-lg font-bold text-foreground truncate drop-shadow-sm">{displayName || "MIST Member"}</h2>
              <BadgeCheck className="w-4 h-4 text-emerald-400 shrink-0 drop-shadow-sm" />
            </div>
            {callsign && callsign !== displayName && <p className="text-xs text-primary truncate drop-shadow-sm">{callsign}</p>}
            {role && (
              <span className={`mt-1 inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded border ${roleBadge}`}>
                <Shield className="w-2.5 h-2.5" />{role.charAt(0).toUpperCase() + role.slice(1)}
              </span>
            )}
          </div>
          {isSelf && (
            <button
              onClick={onEdit}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium mb-1.5 shrink-0 hover:bg-primary/90 transition-colors"
            >
              <Edit className="w-3.5 h-3.5" />Edit
            </button>
          )}
        </div>

        <div className="mt-2">
          <LicenseBadge callsign={callsign} licenseStatus={undefined} size="md" />
        </div>

        {groups.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {groups.slice(0, 4).map((g) => <GroupTag key={g.id} group={g} />)}
          </div>
        )}

        <div className="flex items-center gap-3 mt-3 text-[10px] text-muted-foreground flex-wrap">
          {location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{location}</span>}
          {joinDate && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Joined {new Date(joinDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>}
          <span className="flex items-center gap-1 text-yellow-400"><Star className="w-3 h-3" />Lv {level}</span>
          <span className="flex items-center gap-1 text-emerald-400"><Award className="w-3 h-3" />{reputation} rep</span>
        </div>
      </div>
    </div>
  );
}