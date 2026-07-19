import React from "react";
import { Shield, BadgeCheck, MapPin, Calendar, Star, Award, MessageSquare, UserPlus, Edit, LogOut } from "lucide-react";
import ProfileBanner from "./ProfileBanner";
import GroupTag from "./GroupTag";

export default function ProfileHeader({
  banner, avatar, displayName, callsign, role, groups, avatarFrame,
  location, joinDate, level, reputation, isSelf, onEdit, onMessage, onFollow, onSignOut,
}) {
  const roleBadge =
    role === "admin" ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
    : role === "moderator" ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
    : "bg-white/[0.05] text-muted-foreground border-white/[0.08]";

  return (
    <div className="operator-card">
      <div className="relative h-28">
        <ProfileBanner banner={banner} />
      </div>
      <div className="px-4 pb-3 -mt-12 relative">
        <div className="flex items-end gap-3">
          <div className={`avatar-frame avatar-frame-${avatarFrame || "common"}`}>
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-violet-950/50 flex items-center justify-center">
              {avatar ? (
                <img src={avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl font-bold text-primary">{(displayName || "?")[0]}</span>
              )}
            </div>
          </div>
          <div className="flex-1 pb-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="text-lg font-bold text-foreground truncate">{displayName || "MIST Member"}</h2>
              <BadgeCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            </div>
            {callsign && callsign !== displayName && <p className="text-xs text-primary truncate">{callsign}</p>}
            {role && (
              <span className={`mt-1 inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded border ${roleBadge}`}>
                <Shield className="w-2.5 h-2.5" />{role.charAt(0).toUpperCase() + role.slice(1)}
              </span>
            )}
          </div>
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

        <div className="flex gap-2 mt-3">
          {isSelf ? (
            <>
              <button onClick={onEdit} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium">
                <Edit className="w-3.5 h-3.5" />Edit Profile
              </button>
              <button onClick={onSignOut} className="flex items-center justify-center py-2 px-3 rounded-lg bg-secondary border border-border text-destructive text-xs font-medium">
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <>
              <button onClick={onMessage} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium">
                <MessageSquare className="w-3.5 h-3.5" />Message
              </button>
              <button onClick={onFollow} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-secondary border border-border text-foreground text-xs font-medium">
                <UserPlus className="w-3.5 h-3.5" />Follow
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}