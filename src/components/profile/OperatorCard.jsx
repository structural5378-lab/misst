import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useMistUser } from "@/hooks/useMistUser";
import { useQuery } from '@tanstack/react-query';
import { Bell, LogOut, Calendar, Users, BadgeCheck, Award, Flame, X } from 'lucide-react';
import ProfileBanner from './ProfileBanner';
import GroupTag from './GroupTag';
import BadgeShowcase from './BadgeShowcase';
import PrestigeStats from './PrestigeStats';
import { getLevelProgress } from '@/components/achievements/LevelBar';
import { RARITIES } from '@/lib/rarityConfig';
import { ICON_MAP } from '@/components/achievements/iconMap';
import { deriveGroups, deriveBadges, selectBanner, getAvatarFrame } from '@/lib/profileConfig';

const LOGO_URL = 'https://media.base44.com/images/public/6a24d788be1af31b2258fab2/5e4366214_insomniacsgmrslogo.png';

export default function OperatorCard({ onLogout, alertsLink = '/alerts' }) {
  const { mybbUser } = useMistUser();
  const [user, setUser] = useState(null);
  const [selectedBadge, setSelectedBadge] = useState(null);

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: syncData } = useQuery({
    queryKey: ['operator-card-stats'],
    queryFn: async () => {
      const u = user || await base44.auth.me();
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
  const banner = selectBanner(stats, mybbUser, user?.profile_banner);
  const avatarFrame = getAvatarFrame(achievements, mybbUser);
  const { level, progress } = getLevelProgress(stats.xp || 0);

  const callsign = user?.callsign || mybbUser?.username || 'MIST Member';
  const displayName = user?.full_name || '';
  const avatarUrl = mybbUser?.avatar || LOGO_URL;
  const memberSince = user?.created_date
    ? new Date(user.created_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : null;
  const club = stats?.club_membership || 'Insomniacs GMRS';
  const streak = stats?.daily_login_streak || 0;

  return (
    <>
      <div className="operator-card">
        {/* Banner */}
        <div className="relative h-24">
          <ProfileBanner banner={banner} />
          <div className="absolute top-3 right-3 flex gap-2 z-10">
            <Link to={alertsLink} className="p-2 rounded-full bg-black/30 backdrop-blur-sm text-white/80 hover:text-white transition-colors">
              <Bell className="w-4 h-4" />
            </Link>
            {onLogout && (
              <button onClick={onLogout} className="p-2 rounded-full bg-black/30 backdrop-blur-sm text-white/80 hover:text-red-400 transition-colors" title="Sign Out">
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Identity */}
        <div className="px-4 pb-3 -mt-10 relative">
          <div className="flex items-end gap-3">
            <div className={`avatar-frame avatar-frame-${avatarFrame || 'common'}`}>
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-violet-950/50">
                <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" onError={(e) => { e.target.src = LOGO_URL; }} />
              </div>
            </div>
            <div className="flex-1 pb-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-foreground leading-tight truncate">{callsign}</h2>
                <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                  ● Online
                </span>
              </div>
              {displayName && displayName !== callsign && (
                <p className="text-xs text-muted-foreground truncate">{displayName}</p>
              )}
            </div>
            <Link to="/profile" className="text-[10px] text-violet-400 font-medium hover:text-violet-300 pb-1 shrink-0">
              Edit →
            </Link>
          </div>

          {/* Group Tags */}
          {groups.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {groups.slice(0, 4).map(g => <GroupTag key={g.id} group={g} />)}
            </div>
          )}

          {/* Badge Showcase */}
          {badges.length > 0 && (
            <div className="mt-3">
              <BadgeShowcase badges={badges} onBadgeClick={setSelectedBadge} />
            </div>
          )}

          {/* XP Bar */}
          <div className="mt-3 flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-xs">{level}</span>
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5">
                <span className="font-semibold text-foreground">Level {level}</span>
                <span>{(stats.xp || 0).toLocaleString()} XP</span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>

          {/* Prestige Stats */}
          <div className="mt-3">
            <PrestigeStats stats={stats} />
          </div>

          {/* Info Row */}
          <div className="flex items-center gap-3 mt-3 text-[10px] text-muted-foreground flex-wrap">
            {memberSince && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {memberSince}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" /> {club}
            </span>
            {stats?.gmrs_license && (
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <BadgeCheck className="w-3 h-3" /> GMRS
              </span>
            )}
            {stats?.ham_license_class && (
              <span className="flex items-center gap-1 text-violet-400 font-medium">
                <Award className="w-3 h-3" /> {stats.ham_license_class.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </span>
            )}
            {streak > 0 && (
              <span className="flex items-center gap-1 text-orange-400 font-medium">
                <Flame className="w-3 h-3" /> {streak}d streak
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Badge Detail Popup */}
      {selectedBadge && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={() => setSelectedBadge(null)}>
          <div className="w-full max-w-lg bg-card border border-border rounded-t-2xl p-6 ach-sheet-up relative" onClick={e => e.stopPropagation()} style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
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