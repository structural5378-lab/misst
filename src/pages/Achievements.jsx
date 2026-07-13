import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useMyBBAuth } from '@/lib/MyBBAuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Trophy, Search, BarChart3 } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import BadgeArtwork from '@/components/achievements/BadgeArtwork';
import BadgeDetailSheet from '@/components/achievements/BadgeDetailSheet';
import UnlockCelebration from '@/components/achievements/UnlockCelebration';
import LevelBar from '@/components/achievements/LevelBar';
import { ICON_MAP } from '@/components/achievements/iconMap';
import { ACHIEVEMENTS, COLLECTIONS, COLLECTIONS_ORDER, getAchievementsByCollection, getAchievementById } from '@/lib/achievementsData';
import { RARITY_SCORES } from '@/lib/rarityConfig';

export default function Achievements() {
  const { mybbUser } = useMyBBAuth();
  const [user, setUser] = useState(null);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [celebration, setCelebration] = useState(null);
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: syncData, isLoading: syncing } = useQuery({
    queryKey: ['sync-stats'],
    queryFn: async () => {
      const u = user || await base44.auth.me();
      const res = await base44.functions.invoke('syncUserStats', { uid: mybbUser?.uid || u?.id });
      return res.data;
    },
    enabled: !!mybbUser?.uid || !!user,
    staleTime: 30000,
  });

  const stats = syncData?.stats || {};
  const newlyUnlocked = syncData?.newlyUnlocked || [];

  const { data: userAchievements = [] } = useQuery({
    queryKey: ['user-achievements', user?.id],
    queryFn: async () => {
      const u = user || await base44.auth.me();
      return await base44.entities.UserAchievement.list();
    },
    enabled: !!user,
    staleTime: 15000,
  });

  useEffect(() => {
    if (newlyUnlocked.length > 0) setCelebration(newlyUnlocked[0].id);
  }, [newlyUnlocked]);

  const unlockedIds = new Set(userAchievements.map(a => a.achievement_id));
  const unlockedMap = {};
  userAchievements.forEach(a => { unlockedMap[a.achievement_id] = a; });

  const handleTogglePin = async (achievement) => {
    const ua = unlockedMap[achievement.id];
    if (!ua) return;
    await base44.entities.UserAchievement.update(ua.id, { is_pinned: !ua.is_pinned });
    queryClient.invalidateQueries(['user-achievements', user?.id]);
    setSelectedBadge(null);
  };

  const handleShare = async (achievement) => {
    const text = `🏆 I unlocked "${achievement.name}" on MIST! ${achievement.flavor}`;
    try {
      if (navigator.share) await navigator.share({ title: 'MIST Achievement', text });
      else await navigator.clipboard.writeText(text);
    } catch {}
  };

  const grouped = getAchievementsByCollection();
  const totalUnlocked = unlockedIds.size;
  const achievementScore = userAchievements.reduce((sum, a) => sum + (RARITY_SCORES[a.rarity] || 10), 0);

  const filterAch = (list) => {
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter(a => a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q));
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="Achievements" showBack rightAction={
        <Link to="/leaderboard" className="flex items-center gap-1 text-xs text-violet-400 font-medium">
          <BarChart3 className="w-4 h-4" /> Ranks
        </Link>
      } />

      <div className="px-4 pt-4 space-y-5">
        {syncing && (
          <div className="flex items-center justify-center py-4">
            <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        <LevelBar xp={stats.xp || 0} />

        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Unlocked', value: totalUnlocked, color: 'text-foreground' },
            { label: 'Total Badges', value: ACHIEVEMENTS.length, color: 'text-foreground' },
            { label: 'Score', value: achievementScore.toLocaleString(), color: 'text-amber-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex flex-col items-center py-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <span className={`text-2xl font-bold ${color}`}>{value.toLocaleString()}</span>
              <span className="text-[10px] text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search achievements..."
            className="w-full bg-secondary border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-violet-500" />
        </div>

        {COLLECTIONS_ORDER.map(colKey => {
          const col = COLLECTIONS[colKey];
          if (!col) return null;
          const colAch = filterAch(grouped[colKey] || []);
          if (colAch.length === 0) return null;
          const colUnlocked = colAch.filter(a => unlockedIds.has(a.id)).length;
          const Icon = ICON_MAP[col.icon] || Trophy;

          return (
            <div key={colKey}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Icon className="w-4 h-4 text-violet-400" /> {col.name}
                </h3>
                <span className="text-xs text-muted-foreground">{colUnlocked}/{colAch.length}</span>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {colAch.map(ach => {
                  const isUnlocked = unlockedIds.has(ach.id);
                  return (
                    <button key={ach.id} onClick={() => setSelectedBadge(ach)} className="flex flex-col items-center gap-1">
                      <BadgeArtwork achievement={ach} size="md" unlocked={isUnlocked} animate={isUnlocked} />
                      <span className={`text-[9px] text-center leading-tight max-w-[72px] truncate ${isUnlocked ? 'text-foreground' : 'text-muted-foreground/50'}`}>
                        {ach.secret && !isUnlocked ? '???' : ach.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {selectedBadge && (
        <BadgeDetailSheet
          achievement={selectedBadge}
          isUnlocked={unlockedIds.has(selectedBadge.id)}
          isPinned={unlockedMap[selectedBadge.id]?.is_pinned || false}
          stats={stats}
          onClose={() => setSelectedBadge(null)}
          onTogglePin={() => handleTogglePin(selectedBadge)}
          onShare={() => handleShare(selectedBadge)}
        />
      )}

      {celebration && (
        <UnlockCelebration
          achievementId={celebration}
          onClose={() => setCelebration(null)}
          onShare={() => { const a = getAchievementById(celebration); if (a) handleShare(a); }}
        />
      )}
    </div>
  );
}