import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useMistUser } from "@/hooks/useMistUser";
import { useMembersSearch } from "@/hooks/useMembersSearch";
import {
  MessageSquare, Search, Users, Shield, ChevronRight, X, Loader2, BadgeCheck,
} from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import LicenseBadge from "@/components/profile/LicenseBadge";

const LOGO_URL = "https://media.base44.com/images/public/6a24d788be1af31b2258fab2/5e4366214_insomniacsgmrslogo.png";

function roleStyle(role) {
  if (role === "admin") return { label: "Admin", cls: "bg-amber-500/20 text-amber-400 border-amber-500/30" };
  return null;
}

function relativeTime(iso) {
  if (!iso) return "Never";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "Never";
  const diff = Date.now() - then;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "Just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  return new Date(iso).toLocaleDateString();
}

// ─── Member Profile Sheet ─────────────────────────────────────────────────────
function MemberSheet({ member, onClose, onMessage, isSelf }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-card border border-border rounded-t-2xl overflow-y-auto max-h-[85vh] animate-in slide-in-from-bottom-4"
        onClick={e => e.stopPropagation()}
      >
        {/* Banner */}
        <div className="h-24 bg-gradient-to-br from-violet-900/60 via-indigo-900/60 to-background relative">
          <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/30 text-white/70 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 pb-8">
          {/* Avatar */}
          <div className="flex items-end justify-between mt-4 mb-4">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-violet-500/50 bg-violet-950 shadow-lg shadow-violet-900/40">
              <img src={member.avatar_url || LOGO_URL} alt={member.display_name}
                className="w-full h-full object-cover" onError={e => { e.target.src = LOGO_URL; }} />
            </div>
            {!isSelf && (
              <button
                onClick={() => onMessage(member)}
                className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" /> Message
              </button>
            )}
          </div>

          {/* Name & Role */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h2 className="text-lg font-bold text-foreground">{member.display_name}</h2>
            {member.is_verified && (
              <BadgeCheck className="w-4 h-4 text-emerald-400" aria-label="Verified" />
            )}
            {roleStyle(member.role) && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-0.5 ${roleStyle(member.role).cls}`}>
                <Shield className="w-2.5 h-2.5" />{roleStyle(member.role).label}
              </span>
            )}
          </div>
          {member.username && <p className="text-xs text-muted-foreground">@{member.username}</p>}
          <div className="mt-2">
            <LicenseBadge callsign={member.callsign} licenseStatus={member.license_status} size="md" showCallsign />
          </div>

          {/* Info */}
          <div className="grid grid-cols-2 gap-3 mt-5">
            <div className="flex flex-col items-center py-3 rounded-xl bg-secondary/60 border border-border">
              <span className="text-sm font-bold text-foreground">{relativeTime(member.last_active)}</span>
              <span className="text-[10px] text-muted-foreground">Last Active</span>
            </div>
            <div className="flex flex-col items-center py-3 rounded-xl bg-secondary/60 border border-border">
              <span className="text-sm font-bold text-foreground truncate max-w-full px-2">{member.location || "—"}</span>
              <span className="text-[10px] text-muted-foreground">Location</span>
            </div>
          </div>

          {member.bio && (
            <p className="text-sm text-muted-foreground mt-4 leading-relaxed">{member.bio}</p>
          )}
        </div>
        {/* Safe area spacer for bottom nav */}
        <div className="h-24" />
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Members() {
  const { mistUser } = useMistUser();
  const navigate = useNavigate();
  const {
    query, setQuery, members, total, hasMore,
    isLoading, isFetchingMore, loadMore,
  } = useMembersSearch({ pageSize: 20 });

  const [selectedMember, setSelectedMember] = React.useState(null);
  const sentinelRef = useRef(null);

  // Infinite scroll via IntersectionObserver.
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) loadMore();
    }, { rootMargin: "200px" });
    obs.observe(node);
    return () => obs.disconnect();
  }, [hasMore, loadMore]);

  const admins = members.filter(m => m.role === "admin").length;

  const handleMessage = (member) => {
    setSelectedMember(null);
    const params = new URLSearchParams({
      new_dm: member.id,
      name: member.display_name || member.username || "",
      avatar: member.avatar_url || "",
      callsign: member.callsign || "",
    });
    navigate(`/messages?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="Members" showBack />

      <div className="px-4 py-4 space-y-4">
        {/* Stats bar */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col items-center py-3 rounded-xl bg-secondary/40 border border-border">
            <span className="text-xl font-bold text-violet-400">{total}</span>
            <span className="text-[10px] text-muted-foreground">Members</span>
          </div>
          <div className="flex flex-col items-center py-3 rounded-xl bg-secondary/40 border border-border">
            <span className="text-xl font-bold text-amber-400">{admins}</span>
            <span className="text-[10px] text-muted-foreground">Admins</span>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by name, username, or call sign…"
            className="w-full bg-secondary border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center py-16 gap-3">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-muted-foreground">Loading members...</p>
          </div>
        )}

        {/* Empty */}
        {!isLoading && members.length === 0 && (
          <div className="text-center py-20">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No members found</p>
          </div>
        )}

        {/* Member List */}
        <div className="space-y-2">
          {members.map(member => {
            const isSelf = mistUser?.id === member.id;
            const rs = roleStyle(member.role);
            return (
              <div
                key={member.id}
                onClick={() => setSelectedMember(member)}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] active:scale-[0.99] transition-all cursor-pointer"
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-2xl overflow-hidden bg-violet-950/50 border border-violet-500/20">
                    <img
                      src={member.avatar_url || LOGO_URL}
                      alt={member.display_name}
                      className="w-full h-full object-cover"
                      onError={e => { e.target.onerror = null; e.target.src = LOGO_URL; }}
                    />
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-sm font-semibold text-foreground truncate">{member.display_name}</span>
                    {member.is_verified && <BadgeCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                    {isSelf && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-400 border border-violet-500/30 font-bold">You</span>}
                    {rs && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${rs.cls}`}>
                        {rs.label}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {member.username && (
                      <span className="text-[11px] text-muted-foreground truncate">@{member.username}</span>
                    )}
                    <LicenseBadge callsign={member.callsign} licenseStatus={member.license_status} size="sm" showCallsign={false} className="!py-0.5 !px-2" />
                    <span className="text-[10px] text-muted-foreground">· {relativeTime(member.last_active)}</span>
                  </div>
                </div>

                {/* Action */}
                <div className="flex items-center gap-2 shrink-0">
                  {!isSelf && (
                    <button
                      onClick={e => { e.stopPropagation(); handleMessage(member); }}
                      className="p-2 rounded-lg bg-violet-600/20 hover:bg-violet-600/40 text-violet-400 transition-colors"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  )}
                  <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Infinite scroll sentinel */}
        {hasMore && (
          <div ref={sentinelRef} className="flex justify-center py-4">
            {isFetchingMore ? (
              <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
            ) : (
              <button onClick={loadMore} className="text-xs text-muted-foreground hover:text-foreground">
                Load more
              </button>
            )}
          </div>
        )}
      </div>

      {/* Member Profile Sheet */}
      {selectedMember && (
        <MemberSheet
          member={selectedMember}
          isSelf={mistUser?.id === selectedMember.id}
          onClose={() => setSelectedMember(null)}
          onMessage={handleMessage}
        />
      )}
    </div>
  );
}