import React, { useState, useEffect } from 'react';
import { mist } from '@/api/mist';
import { useMistUser } from "@/hooks/useMistUser";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { useQuery } from '@tanstack/react-query';
import { LogOut, Share2, Shield, Radio, Flame } from 'lucide-react';
import GroupTag from './GroupTag';
import { deriveGroups } from '@/lib/profileConfig';
import { MISST_ASSETS } from '@/lib/misstAssets';

const LOGO_URL = 'https://media.base44.com/images/public/6a24d788be1af31b2258fab2/5e4366214_insomniacsgmrslogo.png';

// Operator stats — clean inline row, accent per metric.
const STATS = [
  { icon: Radio, label: 'Check-ins', key: 'net_checkins', color: 'text-cyan-300', accent: '#22d3ee' },
  { icon: Flame, label: 'Streak', key: 'daily_login_streak', color: 'text-orange-300', accent: '#fb923c' },
];

// OperatorCard — the operator identity hero. Sits directly on the shared
// dashboard environment so the identity reads as part of one composed scene.
//
// Three-column cinematic layout (desktop): avatar emblem | identity | MISST
// hexagonal emblem. Mobile stacks avatar+identity, emblem hidden.
export default function OperatorCard({ onLogout }) {
  const { mybbUser } = useMistUser();
  const { isAdmin } = useAdminAccess();
  const [user, setUser] = useState(null);

  useEffect(() => { mist.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: syncData } = useQuery({
    queryKey: ['operator-card-stats'],
    queryFn: async () => {
      const u = user || (await mist.auth.me());
      const res = await mist.functions.invoke('syncUserStats', { uid: mybbUser?.uid || u?.id });
      return res.data;
    },
    enabled: !!mybbUser?.uid || !!user,
    staleTime: 30000,
  });

  const stats = syncData?.stats || {};
  const groups = deriveGroups(user, mybbUser, stats);

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
    <section className="relative">
      {/* Minimal action cluster — top-right, subtle */}
      <div className="relative flex justify-end gap-1 mb-3">
        <button onClick={handleShare} className="p-1.5 rounded-lg text-white/45 hover:text-white transition-colors" title="Share profile">
          <Share2 className="w-4 h-4" />
        </button>
        {onLogout && (
          <button onClick={onLogout} className="p-1.5 rounded-lg text-white/45 hover:text-rose-300 transition-colors" title="Sign out">
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Hero grid — avatar | identity side-by-side on all sizes; hex emblem on desktop */}
      <div className="relative grid grid-cols-[auto_1fr] lg:grid-cols-[auto_1fr_auto] gap-3 sm:gap-5 lg:gap-8 items-center">
        {/* Avatar emblem */}
        <div className="flex justify-center lg:justify-start">
          <div className="relative w-24 h-24 sm:w-36 sm:h-36 lg:w-44 lg:h-44">
            <img src={MISST_ASSETS.MISST_AVATAR_ENERGY.url} alt="" aria-hidden className="absolute inset-0 w-full h-full object-contain opacity-80" style={{ mixBlendMode: 'screen' }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-20 h-20 sm:w-28 sm:h-28 lg:w-36 lg:h-36">
                <div className="w-full h-full rounded-2xl overflow-hidden bg-violet-950/60 ring-1 ring-violet-400/25 relative" style={{ boxShadow: '0 0 0 1px rgba(139,92,246,0.35), 0 0 18px 2px rgba(139,92,246,0.45), 0 0 36px 6px rgba(6,182,212,0.18)' }}>
                  <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" onError={(e) => { e.target.src = LOGO_URL; }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Identity hierarchy */}
        <div className="min-w-0 text-left">
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white leading-tight tracking-tight break-words">{displayName}</h2>
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="absolute inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 opacity-75 animate-ping" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
          </div>
          {callsign && callsign !== displayName && (
            <p className="text-sm sm:text-base font-semibold text-violet-300/90 tracking-wider mt-1 break-words">{callsign}</p>
          )}
          <p className="text-[11px] font-medium text-white/40 mt-1.5 tracking-[0.15em] uppercase">GMRS Operator</p>
          <div className="mt-2.5 flex items-center gap-2 flex-wrap">
            {isAdmin && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-violet-500/10 border border-violet-400/20">
                <Shield className="w-3.5 h-3.5 text-violet-300" />
                <span className="text-[11px] font-bold text-violet-200 tracking-wide">Founder</span>
              </div>
            )}
          </div>
        </div>

        {/* MISST hexagonal emblem — prominent on desktop, hidden on mobile */}
        <div className="hidden lg:flex items-center justify-center">
          <div className="relative w-40 h-40 xl:w-48 xl:h-48">
            <img src={MISST_ASSETS.MISST_IDENTITY_ENERGY.url} alt="" className="w-full h-full object-contain" style={{ mixBlendMode: 'screen' }} />
          </div>
        </div>
      </div>

      {/* Stats — full-width strip */}
      <div className="relative mt-4 flex items-center justify-center lg:justify-start gap-6 sm:gap-8">
        {STATS.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.key} className="flex items-center gap-2">
              <Icon className={`w-4 h-4 ${s.color} shrink-0`} />
              <div className="flex flex-col leading-none">
                <span className="text-xl font-black text-white tabular-nums" style={{ textShadow: `0 0 14px ${s.accent}44` }}>{stats[s.key] ?? 0}</span>
                <span className="text-[9px] text-white/40 uppercase tracking-wider mt-1">{s.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Groups */}
      <div className="relative mt-5 space-y-3">
        {groups.filter((g) => g.id !== 'administrator').length > 0 && (
          <div className="flex flex-wrap justify-center lg:justify-start gap-1.5">
            {groups.filter((g) => g.id !== 'administrator').slice(0, 4).map((g) => <GroupTag key={g.id} group={g} />)}
          </div>
        )}
      </div>
    </section>
  );
}