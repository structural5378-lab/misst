import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Wrench, Activity, Crown } from 'lucide-react';

// DashboardQuickActions — four large futuristic action tiles (Chat, Tools,
// Activity, Rankings) matching the command-center reference. Each tile links to
// existing MISST routes — no placeholders. Gradient border via the --tile-glow
// CSS var; accent glow localized behind the icon.
const TILES = [
  { icon: MessageSquare, label: 'Chat', path: '/messages', glow: 'rgba(6,182,212,0.55)', color: 'text-cyan-300' },
  { icon: Wrench, label: 'Tools', path: '/tools', glow: 'rgba(249,157,0,0.55)', color: 'text-orange-300' },
  { icon: Activity, label: 'Activity', path: '/alerts', glow: 'rgba(139,92,246,0.55)', color: 'text-violet-300' },
  { icon: Crown, label: 'Rankings', path: '/leaderboard', glow: 'rgba(255,205,64,0.55)', color: 'text-yellow-300' },
];

export default function DashboardQuickActions() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {TILES.map((t) => {
        const Icon = t.icon;
        return (
          <Link
            key={t.label}
            to={t.path}
            className="mist-quick-tile rounded-2xl p-4 flex flex-col items-center justify-center gap-2.5 active:scale-95 transition-transform"
            style={{ '--tile-glow': t.glow }}
          >
            <div className="w-12 h-12 rounded-xl bg-white/[0.04] flex items-center justify-center" style={{ boxShadow: `0 0 24px -5px ${t.glow}` }}>
              <Icon className={`w-6 h-6 ${t.color}`} />
            </div>
            <span className="text-xs font-bold tracking-widest uppercase text-white/85">{t.label}</span>
          </Link>
        );
      })}
    </div>
  );
}