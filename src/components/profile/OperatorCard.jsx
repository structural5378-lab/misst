import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useMistUser } from "@/hooks/useMistUser";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { useQuery } from '@tanstack/react-query';
import { Bell, LogOut, Share2, Shield, Award, Radio, Flame, X } from 'lucide-react';
import HeroArtwork from './HeroArtwork';
import { heroSeed, heroTheme, heroPrompt } from '@/hooks/useHeroArtwork';
import GroupTag from './GroupTag';
import BadgeShowcase from './BadgeShowcase';
import PremiumBadgeRow from '@/components/premium/PremiumBadgeRow';
import PremiumAvatarFrame from '@/components/premium/PremiumAvatarFrame';
import { getLevelProgress } from '@/components/achievements/LevelBar';
import { RARITIES } from '@/lib/rarityConfig';
import { ICON_MAP } from '@/components/achievements/iconMap';
import { deriveGroups, deriveBadges, getAvatarFrame } from '@/lib/profileConfig';

const LOGO_URL = 'https://media.base44.com/images/public/6a24d788be1af31b2258fab2/5e4366214_insomniacsgmrslogo.png';

// Futuristic stat cards (Score / Check-ins / Streak) — accent-colored glow per card.
const STATS = [
  { icon: Award, label: 'Score', key: 'achievement_score', color: 'text-violet-300', glow: 'rgba(139,92,246,0.42)' },
  { icon: Radio, label: 'Check-ins', key: 'net_checkins', color: 'text-emerald-300', glow: 'rgba(34,197,94,0.42)' },
  { icon: Flame, label: 'Streak', key: 'daily_login_streak', color: 'text-orange-300', glow: 'rgba(249,115,22,0.42)' },
];

// OperatorCard — the MISST command-center profile hero. A dark glass panel with a
// dimmed AI hero backdrop (subtle storm atmosphere), large framed avatar with a
// level emblem, prominent identity, three futuristic stat cards, the Founder
// badge, profile actions, and the existing premium-badge row + group tags +
// achievement showcase. Premium avatar framing reuses the centralized Lighting
// Engine via PremiumAvatarFrame (no duplicate effect system).
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
  const club = stats?.club_membership || 'Insomniacs GMRS';
  const heroRoleKey = isAdmin ? 'admin' : mybbUser?.role;
  const heroSeedVal = heroSeed({ uid: mybbUser?.uid || user?.id, role: heroRoleKey, level: stats.level, community: club });
  const heroPromptVal = heroPrompt(heroTheme({ role: heroRoleKey, level: stats.level, community: club }), club);

  const handleShare = async () => {
    const url = window.location.origin + '/profile';
    try {
      if (navigator.share) await navigator.share({ title: callsign, url });
      else await navigator.clipboard?.writeText(url);
    } catch {}
  };

  return (
    <>
      <div className="relative rounded-3xl mist-hero-panel overflow-hidden">
        {/* Subtle atmospheric backdrop — AI hero artwork, heavily dimmed to read as storm texture */}
        <div className="absolute inset-0 opacity-[0.14] pointer-events-none">
          <HeroArtwork seed={heroSeedVal} prompt={heroPromptVal} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/25 to-black/55 pointer-events-none" />

        <div className="relative p-4 space-y-3.5 z-10">
          {/* Identity row: framed avatar + level emblem, name/callsign/status, actions */}
          <div className="flex items-start gap-3.5">
            <div className="relative shrink-0">
              <PremiumAvatarFrame userId={user?.id} avatarFrame={avatarFrame} className="rounded-full">
                <div className="w-[86px] h-[86px] rounded-full overflow-hidden bg-violet-950/60 ring-1 ring-violet-400/30">
                  <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" onError={(e) => { e.target.src = LOGO_URL; }} />
                </div>
              </PremiumAvatarFrame>
              <div className="absolute -bottom-1 -right-1 mist-level-emblem rounded-xl w-9 h-9 flex flex-col items-center justify-center leading-none">
                <span className="text-[6px] font-bold text-violet-100 tracking-widest">LVL</span>
                <span className="text-sm font-black text-white">{level}</span>
              </div>
            </div>

            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white leading-tight tracking-tight break-words drop-shadow-[0_2px_8px_rgba(139,92,246,0.45)]">{displayName}</h2>
                <span className="relative flex h-2.5 w-2.5 shrink-0 mt-1">
                  <span className="absolute inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 opacity-75 animate-ping" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </span>
              </div>
              {callsign && callsign !== displayName && (
                <p className="text-sm font-bold text-violet-300 tracking-wider mt-0.5 break-words">{callsign}</p>
              )}
              <p className="text-[11px] font-semibold text-white/45 uppercase tracking-[0.18em] mt-0.5">GMRS Operator</p>
            </div>

            <div className="flex flex-col gap-2 shrink-0">
              <Link to={alertsLink} className="p-2 rounded-full bg-white/[0.06] border border-white/10 text-white/80 hover:text-white hover:border-violet-400/40 transition-colors" aria-label="Notifications">
                <Bell className="w-4 h-4" />
              </Link>
              <button onClick={handleShare} className="p-2 rounded-full bg-white/[0.06] border border-white/10 text-white/80 hover:text-white hover:border-violet-400/40 transition-colors" title="Share Profile">
                <Share2 className="w-4 h-4" />
              </button>
              {onLogout && (
                <button onClick={onLogout} className="p-2 rounded-full bg-white/[0.06] border border-white/10 text-white/80 hover:text-rose-400 hover:border-rose-400/40 transition-colors" title="Sign Out">
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-3 gap-2.5">
            {STATS.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.key} className="mist-stat-card rounded-2xl px-2.5 py-2.5 flex flex-col items-center gap-1" style={{ boxShadow: `0 0 18px -5px ${s.glow}` }}>
                  <div className="w-7 h-7 rounded-lg bg-white/[0.05] flex items-center justify-center">
                    <Icon className={`w-4 h-4 ${s.color}`} />
                  </div>
                  <span className="text-xl font-black text-white leading-none tabular-nums">{stats[s.key] ?? 0}</span>
                  <span className="text-[8px] font-semibold text-white/45 uppercase tracking-widest">{s.label}</span>
                </div>
              );
            })}
          </div>

          {/* Founder / Admin holographic badge */}
          {isAdmin && (
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-violet-500/30 to-fuchsia-500/20 border border-violet-400/40 shadow-[0_0_22px_rgba(139,92,246,0.4)]">
              <Shield className="w-4 h-4 text-violet-200" />
              <span className="text-[11px] font-black text-white tracking-[0.2em] uppercase">Founder</span>
            </div>
          )}

          {/* Premium badges — existing system, single row */}
          <PremiumBadgeRow userId={user?.id} max={6} size="md" />

          {/* Group tags */}
          {groups.filter((g) => g.id !== 'administrator').length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {groups.filter((g) => g.id !== 'administrator').slice(0, 4).map((g) => <GroupTag key={g.id} group={g} />)}
            </div>
          )}

          {/* Achievement showcase */}
          {badges.length > 0 && (
            <BadgeShowcase badges={badges.filter((b) => b.id !== 'administrator')} onBadgeClick={setSelectedBadge} align="start" />
          )}
        </div>
      </div>

      {/* Badge detail popup */}
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