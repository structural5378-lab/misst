import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useMistUser } from "@/hooks/useMistUser";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { useQuery } from '@tanstack/react-query';
import { Bell, LogOut, Share2, Shield, Award, Radio, Flame, X } from 'lucide-react';
import GroupTag from './GroupTag';
import BadgeShowcase from './BadgeShowcase';
import PremiumBadgeRow from '@/components/premium/PremiumBadgeRow';
import PremiumAvatarFrame from '@/components/premium/PremiumAvatarFrame';
import { getLevelProgress } from '@/components/achievements/LevelBar';
import { RARITIES } from '@/lib/rarityConfig';
import { ICON_MAP } from '@/components/achievements/iconMap';
import { deriveGroups, deriveBadges, getAvatarFrame } from '@/lib/profileConfig';
import { MISST_ASSETS } from '@/lib/misstAssets';

const LOGO_URL = 'https://media.base44.com/images/public/6a24d788be1af31b2258fab2/5e4366214_insomniacsgmrslogo.png';

// Compact stat cards — icon + large number + small label, horizontal row.
const STATS = [
  { icon: Award, label: 'Score', key: 'achievement_score', color: 'text-violet-300', accent: '#a78bfa' },
  { icon: Radio, label: 'Check-ins', key: 'net_checkins', color: 'text-cyan-300', accent: '#22d3ee' },
  { icon: Flame, label: 'Streak', key: 'daily_login_streak', color: 'text-orange-300', accent: '#fb923c' },
];

// OperatorCard — the cinematic operator identity hero, rebuilt around the
// MISST asset pack. Layered identity emblem (back→front):
//   MISST_IDENTITY_ENERGY (ambient) → MISST_AVATAR_ENERGY (halo) →
//   PremiumAvatarFrame (Lighting Engine active-badge effect) → avatar →
//   MISST_AVATAR_FRAME (tactical ring) → MISST_LEVEL_SHIELD (level, HTML number).
// All existing hooks/data/badge systems are preserved unchanged.
export default function OperatorCard({ onLogout, alertsLink = '/alerts' }) {
  const { mybbUser } = useMistUser();
  const { isAdmin } = useAdminAccess();
  const [user, setUser] = useState(null);
  const [selectedBadge, setSelectedBadge] = useState(null);

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: syncData } = useQuery({
    queryKey: ['operator-card-stats'],
    queryFn: async () => {
      const u = user || (await base44.auth.me());
      const res = await base44.functions.invoke('syncUserStats', { uid: mybbUser?.uid || u?.id });
      return res.data;
    },
    enabled: !!mybbUser?.uid || !!user,
    staleTime: 30000,
  });

  const { data: achievements = [] } = useQuery({
    queryKey: ['operator-card-achievements'],
    queryFn: async () => await base44.entities.UserAchievement.list(),
    staleTime: 15000,
  });

  const stats = syncData?.stats || {};
  const groups = deriveGroups(user, mybbUser, stats);
  const badges = deriveBadges(stats, user, mybbUser);
  const avatarFrame = getAvatarFrame(achievements, mybbUser);
  const { level } = getLevelProgress(stats.xp || 0);

  const callsign = user?.callsign || mybbUser?.username || 'MIST Member';
  const displayName = user?.full_name || callsign;
  const avatarUrl = mybbUser?.avatar || LOGO_URL;

  const handleShare = async () => {
    const url = window.location.origin + '/profile';
    try {
      if (navigator.share) await navigator.share({ title: callsign, url });
      else await navigator.clipboard?.writeText(url);
    } catch {}
  };

  return (
    <>
      <section className="relative rounded-3xl overflow-hidden border border-violet-500/20 shadow-[0_0_50px_-14px_rgba(139,92,246,0.45)]">
        {/* Atmospheric hero background artwork (decorative only) */}
        <img src={MISST_ASSETS.MISST_DASHBOARD_BACKGROUND.url} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover opacity-50" />
        <img src={MISST_ASSETS.MISST_IDENTITY_ENERGY.url} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-screen" />
        {/* readability overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/55 via-black/35 to-black/70" />

        <div className="relative z-10 p-5 sm:p-6">
          {/* Minimal action cluster — top-right */}
          <div className="flex justify-end gap-1.5 mb-4">
            <Link to={alertsLink} className="p-2 rounded-xl bg-white/[0.05] border border-white/10 text-white/70 hover:text-white hover:border-violet-400/30 transition-colors" aria-label="Notifications">
              <Bell className="w-4 h-4" />
            </Link>
            <button onClick={handleShare} className="p-2 rounded-xl bg-white/[0.05] border border-white/10 text-white/70 hover:text-white hover:border-violet-400/30 transition-colors" title="Share profile">
              <Share2 className="w-4 h-4" />
            </button>
            {onLogout && (
              <button onClick={onLogout} className="p-2 rounded-xl bg-white/[0.05] border border-white/10 text-white/70 hover:text-rose-300 hover:border-rose-400/30 transition-colors" title="Sign out">
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Identity area: layered avatar emblem (left) + identity text (right) */}
          <div className="flex items-center gap-5 sm:gap-6">
            {/* Avatar emblem stack */}
            <div className="relative shrink-0 w-48 h-48 sm:w-52 sm:h-52 lg:w-56 lg:h-56">
              {/* energy halo behind */}
              <img src={MISST_ASSETS.MISST_AVATAR_ENERGY.url} alt="" aria-hidden className="absolute inset-0 w-full h-full object-contain opacity-80" />
              {/* centered avatar + frame + shield */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-40 h-40 sm:w-44 sm:h-44 lg:w-48 lg:h-48">
                  <PremiumAvatarFrame userId={user?.id} avatarFrame={avatarFrame} className="rounded-full">
                    <div className="w-full h-full rounded-full overflow-hidden bg-violet-950/60 ring-1 ring-violet-400/25">
                      <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" onError={(e) => { e.target.src = LOGO_URL; }} />
                    </div>
                  </PremiumAvatarFrame>
                  {/* tactical frame on top (decorative ring) */}
                  <img src={MISST_ASSETS.MISST_AVATAR_FRAME.url} alt="" aria-hidden className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
                  {/* level shield attached bottom-right — number rendered in HTML */}
                  <div className="absolute -bottom-2 -right-2 sm:-bottom-3 sm:-right-3 w-14 h-14 sm:w-16 sm:h-16">
                    <img src={MISST_ASSETS.MISST_LEVEL_SHIELD.url} alt="" className="w-full h-full object-contain" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                      <span className="text-[7px] sm:text-[8px] font-bold text-violet-100 tracking-widest">LVL</span>
                      <span className="text-base sm:text-lg font-black text-white">{level}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* identity text */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight tracking-tight break-words" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.7)' }}>{displayName}</h2>
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="absolute inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 opacity-75 animate-ping" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </span>
              </div>
              {callsign && callsign !== displayName && (
                <p className="text-base sm:text-lg font-bold text-violet-300 tracking-wide mt-1 break-words">{callsign}</p>
              )}
              <p className="text-xs font-medium text-white/55 mt-1">GMRS Operator</p>
              {isAdmin && (
                <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-lg bg-violet-500/15 border border-violet-400/30">
                  <Shield className="w-3.5 h-3.5 text-violet-300" />
                  <span className="text-[11px] font-bold text-violet-200 tracking-wide">Founder</span>
                </div>
              )}
              {/* active premium badge row (existing system) */}
              <div className="mt-3">
                <PremiumBadgeRow userId={user?.id} max={6} size="md" />
              </div>
            </div>
          </div>

          {/* Stats — compact horizontal row of 3 cards */}
          <div className="grid grid-cols-3 gap-3 mt-5">
            {STATS.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.key} className="rounded-2xl py-3 flex flex-col items-center gap-1 bg-white/[0.05] border border-white/10 backdrop-blur-md" style={{ boxShadow: `0 0 20px -6px ${s.accent}66` }}>
                  <Icon className={`w-5 h-5 ${s.color}`} />
                  <span className="text-2xl font-black text-white leading-none tabular-nums" style={{ textShadow: `0 0 16px ${s.accent}55` }}>{stats[s.key] ?? 0}</span>
                  <span className="text-[9px] font-semibold text-white/45 tracking-wide leading-none">{s.label}</span>
                </div>
              );
            })}
          </div>

          {/* groups + achievement showcase (existing systems) */}
          <div className="mt-4 space-y-3">
            {groups.filter((g) => g.id !== 'administrator').length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {groups.filter((g) => g.id !== 'administrator').slice(0, 4).map((g) => <GroupTag key={g.id} group={g} />)}
              </div>
            )}
            {badges.length > 0 && (
              <BadgeShowcase badges={badges.filter((b) => b.id !== 'administrator')} onBadgeClick={setSelectedBadge} align="start" />
            )}
          </div>
        </div>
      </section>

      {/* Badge detail popup — unchanged */}
      {selectedBadge && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={() => setSelectedBadge(null)}>
          <div className="w-full max-w-lg bg-card border border-border rounded-t-2xl p-6 ach-sheet-up relative" onClick={(e) => e.stopPropagation()} style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            <div className="flex justify-center mb-3"><div className="w-10 h-1 rounded-full bg-border" /></div>
            <button onClick={() => setSelectedBadge(null)} className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-secondary text-muted-foreground">
              <X className="w-5 h-5" />
            </button>
            {(() => {
              const rarity = RARITIES[selectedBadge.rarity] || RARITIES.common;
              const Icon = ICON_MAP[selectedBadge.icon] || ICON_MAP.Award;
              return (
                <div className="flex flex-col items-center text-center">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center prestige-badge-glow-${selectedBadge.rarity}`} style={{ background: rarity.gradient, color: rarity.iconColor }}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <span className="mt-3 text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full" style={{ color: rarity.colors.primary, background: `${rarity.colors.primary}15`, border: `1px solid ${rarity.colors.primary}30` }}>
                    {rarity.label}
                  </span>
                  <h3 className="text-lg font-bold text-foreground mt-2">{selectedBadge.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-xs">{selectedBadge.description}</p>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </>
  );
}