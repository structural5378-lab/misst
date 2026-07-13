import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Crown, Trophy, Star, Radio, Headphones, MapPin, MessageSquare, ShieldAlert } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import { calcLevel } from '@/components/achievements/LevelBar';

const SORT_OPTIONS = [
  { key: 'xp', label: 'XP', icon: Crown },
  { key: 'net_checkins', label: 'Check-ins', icon: Radio },
  { key: 'net_control_sessions', label: 'Net Control', icon: Headphones },
  { key: 'miles_traveled', label: 'Distance', icon: MapPin },
  { key: 'achievement_score', label: 'Achievements', icon: Trophy },
  { key: 'reputation', label: 'Reputation', icon: Star },
  { key: 'emergency_activations', label: 'Emergency', icon: ShieldAlert },
  { key: 'forum_posts', label: 'Forum', icon: MessageSquare },
];

export default function Leaderboard() {
  const [sortBy, setSortBy] = useState('xp');
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => { base44.auth.me().then(u => setCurrentUserId(u.id)).catch(() => {}); }, []);

  const { data: leaderboard = [], isLoading } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const res = await base44.functions.invoke('syncUserStats', { action: 'leaderboard' });
      return res.data?.leaderboard || [];
    },
    staleTime: 60000,
  });

  const sorted = [...leaderboard].sort((a, b) => (b[sortBy] || 0) - (a[sortBy] || 0));
  const myRank = sorted.findIndex(u => u.user_id === currentUserId);
  const activeSort = SORT_OPTIONS.find(s => s.key === sortBy);

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="Leaderboard" showBack />

      <div className="px-4 pt-4 space-y-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {SORT_OPTIONS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setSortBy(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                sortBy === key ? 'bg-violet-600 text-white' : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}>
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {myRank >= 0 && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
            <span className="text-2xl font-bold text-violet-400">#{myRank + 1}</span>
            <div>
              <p className="text-sm font-semibold text-foreground">Your Rank</p>
              <p className="text-xs text-muted-foreground">{sorted[myRank]?.user_name || 'You'}</p>
            </div>
          </div>
        )}

        {!isLoading && sorted.length === 0 && (
          <div className="text-center py-16">
            <Trophy className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No operators ranked yet. Be the first!</p>
          </div>
        )}

        <div className="space-y-2">
          {sorted.slice(0, 50).map((entry, i) => {
            const isMe = entry.user_id === currentUserId;
            const level = calcLevel(entry.xp || 0);
            const rankColors = ['text-amber-400', 'text-slate-300', 'text-orange-400'];
            return (
              <div key={entry.id || i}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                  isMe ? 'bg-violet-500/10 border-violet-500/30' : 'bg-white/[0.03] border-white/[0.06]'
                }`}>
                <span className={`text-lg font-bold w-8 text-center ${rankColors[i] || 'text-muted-foreground'}`}>{i + 1}</span>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shrink-0">
                  <span className="text-white text-sm font-bold">{(entry.user_name || '?')[0]?.toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {entry.user_name || 'Operator'} {isMe && <span className="text-violet-400">(You)</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">Level {level}</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-foreground">{(entry[sortBy] || 0).toLocaleString()}</span>
                  <p className="text-[10px] text-muted-foreground">{activeSort?.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}