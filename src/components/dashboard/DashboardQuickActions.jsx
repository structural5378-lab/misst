import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { MISST_ASSETS } from '@/lib/misstAssets';

// DashboardQuickActions — four MISST feature modules. The approved artwork is
// the dominant upper visual of each tile; title + descriptor sit beneath; a
// subtle status indicator and arrow affordance complete the portal feel.
// Dark glass with a subtle per-tile accent glow (restrained — no heavy borders).
// Mobile: 2×2. Desktop: 4-column row. Routes unchanged.
const MODULES = [
{ art: MISST_ASSETS.MISST_TILE_CHAT, title: 'Chat', subtitle: 'Conversations', path: '/messages', live: true, status: '2 Unread', glow: 'rgba(139,92,246,0.22)', ring: 'rgba(139,92,246,0.35)' },
{ art: MISST_ASSETS.MISST_TILE_TOOLS, title: 'Tools', subtitle: 'Utilities & gear', path: '/tools', status: 'Active', glow: 'rgba(6,182,212,0.20)', ring: 'rgba(6,182,212,0.30)' },
{ art: MISST_ASSETS.MISST_TILE_ACTIVITY, title: 'Activity', subtitle: 'Live operator ops', path: '/alerts', live: true, status: 'Live', glow: 'rgba(34,197,94,0.20)', ring: 'rgba(34,197,94,0.30)' },
{ art: MISST_ASSETS.MISST_TILE_RANKINGS, title: 'Rankings', subtitle: 'Leaderboard', path: '/leaderboard', status: 'Top 25%', glow: 'rgba(245,158,11,0.20)', ring: 'rgba(245,158,11,0.30)' }];


export default function DashboardQuickActions() {
  return null;
































}