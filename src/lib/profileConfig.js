export const BANNERS = {
  carbon:   { id: 'carbon',   name: 'Carbon Fiber',      rarity: 'common',    class: 'banner-carbon',   animated: false },
  galaxy:   { id: 'galaxy',   name: 'Galaxy',            rarity: 'rare',      class: 'banner-galaxy',   animated: true },
  lightning:{ id: 'lightning',name: 'Lightning',         rarity: 'rare',      class: 'banner-lightning',animated: true },
  neon:     { id: 'neon',     name: 'Neon Purple',       rarity: 'epic',      class: 'banner-neon',    animated: true },
  storm:    { id: 'storm',    name: 'Storm Chaser',      rarity: 'epic',      class: 'banner-storm',   animated: true },
  nightops: { id: 'nightops', name: 'Night Ops',        rarity: 'epic',      class: 'banner-nightops', animated: true },
  radiotower:{id: 'radiotower',name: 'Radio Tower',     rarity: 'epic',      class: 'banner-radiotower',animated: true },
  aurora:   { id: 'aurora',   name: 'Aurora',           rarity: 'legendary', class: 'banner-aurora',  animated: true },
  matrix:   { id: 'matrix',   name: 'Digital Matrix',   rarity: 'legendary', class: 'banner-matrix',  animated: true },
  tactical: { id: 'tactical', name: 'Military Tactical',rarity: 'legendary', class: 'banner-tactical',animated: false },
  founder:  { id: 'founder',  name: 'Founder Exclusive', rarity: 'founder',   class: 'banner-founder',  animated: true, image: 'https://media.base44.com/images/public/6a24d788be1af31b2258fab2/6d090e943_generated_image.png' },
  holiday:  { id: 'holiday',  name: 'Holiday Limited',  rarity: 'seasonal',   class: 'banner-holiday', animated: true },
};

export const GROUPS = {
  founder:           { id: 'founder',           name: 'Founder',            icon: 'Crown',       gradient: 'linear-gradient(135deg, #fbbf24, #f59e0b, #b45309)', textColor: '#78350f', glow: '0 0 12px rgba(251,191,36,0.4)', priority: 100 },
  owner:             { id: 'owner',             name: 'Owner',               icon: 'Crown',       gradient: 'linear-gradient(135deg, #a855f7, #7c3aed)',       textColor: '#fff',    glow: '0 0 10px rgba(168,85,247,0.3)', priority: 95 },
  administrator:    { id: 'administrator',    name: 'Administrator',       icon: 'Shield',      gradient: 'linear-gradient(135deg, #ef4444, #dc2626)',       textColor: '#fff',    glow: '0 0 10px rgba(239,68,68,0.3)', priority: 90 },
  developer:         { id: 'developer',         name: 'Developer',           icon: 'Code',        gradient: 'linear-gradient(135deg, #10b981, #047857)',       textColor: '#fff',    glow: '0 0 10px rgba(16,185,129,0.3)', priority: 88 },
  moderator:         { id: 'moderator',         name: 'Moderator',           icon: 'ShieldAlert', gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',       textColor: '#fff',    glow: '0 0 10px rgba(59,130,246,0.3)', priority: 85 },
  club_owner:        { id: 'club_owner',        name: 'Club Owner',          icon: 'Users',       gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)',       textColor: '#fff',    glow: '0 0 10px rgba(6,182,212,0.3)', priority: 80 },
  repeater_trustee:  { id: 'repeater_trustee',  name: 'Repeater Trustee',    icon: 'RadioTower',  gradient: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',       textColor: '#fff',    glow: '0 0 10px rgba(139,92,246,0.3)', priority: 75 },
  emergency_team:   { id: 'emergency_team',   name: 'Emergency Team',      icon: 'ShieldAlert', gradient: 'linear-gradient(135deg, #f97316, #ea580c)',       textColor: '#fff',    glow: '0 0 10px rgba(249,115,22,0.3)', priority: 72 },
  ares:              { id: 'ares',              name: 'ARES',                icon: 'Radio',       gradient: 'linear-gradient(135deg, #6366f1, #4f46e5)',       textColor: '#fff',    glow: '0 0 10px rgba(99,102,241,0.3)', priority: 70 },
  skywarn:           { id: 'skywarn',           name: 'SKYWARN',             icon: 'CloudRain',   gradient: 'linear-gradient(135deg, #0ea5e9, #0284c7)',       textColor: '#fff',    glow: '0 0 10px rgba(14,165,233,0.3)', priority: 68 },
  vip:               { id: 'vip',               name: 'VIP',                 icon: 'Star',        gradient: 'linear-gradient(135deg, #fbbf24, #f59e0b)',       textColor: '#78350f', glow: '0 0 12px rgba(251,191,36,0.4)', priority: 67 },
  lifetime:          { id: 'lifetime',          name: 'Lifetime Member',    icon: 'Gem',         gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',       textColor: '#fff',    glow: '0 0 10px rgba(99,102,241,0.3)', priority: 63 },
  amateur_extra:     { id: 'amateur_extra',     name: 'Amateur Extra',       icon: 'GraduationCap',gradient: 'linear-gradient(135deg, #a855f7, #9333ea)',      textColor: '#fff',    glow: '0 0 10px rgba(168,85,247,0.3)', priority: 62 },
  sponsor:           { id: 'sponsor',           name: 'Sponsor',             icon: 'Heart',       gradient: 'linear-gradient(135deg, #ec4899, #db2777)',       textColor: '#fff',    glow: '0 0 10px rgba(236,72,153,0.3)', priority: 65 },
  gmrs_operator:    { id: 'gmrs_operator',    name: 'GMRS Operator',       icon: 'BadgeCheck',  gradient: 'linear-gradient(135deg, #14b8a6, #0d9488)',       textColor: '#fff',    glow: '0 0 8px rgba(20,184,166,0.25)', priority: 60 },
  general:           { id: 'general',           name: 'General',             icon: 'Award',       gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',       textColor: '#fff',    glow: '0 0 8px rgba(139,92,246,0.25)', priority: 58 },
  technician:        { id: 'technician',        name: 'Technician',          icon: 'Award',       gradient: 'linear-gradient(135deg, #64748b, #475569)',       textColor: '#fff',    glow: '0 0 8px rgba(100,116,139,0.25)', priority: 55 },
  beta_tester:       { id: 'beta_tester',       name: 'Beta Tester',         icon: 'Zap',         gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',       textColor: '#fff',    glow: '0 0 10px rgba(245,158,11,0.3)', priority: 50 },
};

export const PRESTIGE_BADGES = [
  { id: 'founder',            name: 'Founder',            icon: 'Crown',       rarity: 'founder',   description: 'Founded a MIST community' },
  { id: 'administrator',     name: 'Administrator',      icon: 'Shield',      rarity: 'legendary', description: 'Platform administrator' },
  { id: 'repeater_owner',    name: 'Repeater Owner',     icon: 'RadioTower',  rarity: 'epic',      description: 'Manages a repeater' },
  { id: 'net_control',       name: 'Net Control',        icon: 'Mic',         rarity: 'rare',      description: 'Hosted a net session' },
  { id: 'emergency_volunteer',name: 'Emergency Volunteer',icon: 'ShieldAlert',rarity: 'epic',      description: 'Participated in emergency operations' },
  { id: 'road_warrior',      name: 'Road Warrior',       icon: 'Car',         rarity: 'legendary', description: 'Traveled 10,000+ miles for radio' },
  { id: 'rf_explorer',       name: 'RF Explorer',        icon: 'Radio',       rarity: 'epic',      description: 'Visited 25+ repeaters' },
  { id: 'legendary_operator',name: 'Legendary Operator', icon: 'Zap',        rarity: 'legendary', description: 'Reached level 20+' },
  { id: 'community_mentor',  name: 'Community Mentor',   icon: 'Sparkles',    rarity: 'rare',      description: 'Given 25+ helpful answers' },
  { id: 'streak_365',        name: '365 Day Streak',     icon: 'Flame',       rarity: 'mythic',    description: 'Active for 365 consecutive days' },
  { id: 'mythic_achievement',name: 'Mythic Achievement',icon: 'Star',       rarity: 'mythic',    description: 'Earned 1,000+ achievement score' },
];

export function deriveGroups(user, mybbUser, stats) {
  const groups = [];
  const s = stats || {};
  if (s.is_founder) groups.push(GROUPS.founder);
  if (mybbUser?.role === 'admin') groups.push(GROUPS.administrator);
  if (mybbUser?.role === 'moderator') groups.push(GROUPS.moderator);
  if ((s.repeaters_managed || 0) >= 1) groups.push(GROUPS.repeater_trustee);
  if ((s.emergency_activations || 0) >= 3) groups.push(GROUPS.ares);
  if ((s.emergency_activations || 0) >= 1) groups.push(GROUPS.emergency_team);
  if ((s.emergency_activations || 0) >= 1) groups.push(GROUPS.skywarn);
  if (s.gmrs_license) groups.push(GROUPS.gmrs_operator);
  if (s.ham_license_class === 'technician') groups.push(GROUPS.technician);
  if (s.ham_license_class === 'general') groups.push(GROUPS.general);
  if (s.ham_license_class === 'amateur_extra') groups.push(GROUPS.amateur_extra);
  if ((s.reputation || 0) >= 100) groups.push(GROUPS.vip);
  if ((s.years_active || 0) >= 2) groups.push(GROUPS.lifetime);
  groups.sort((a, b) => b.priority - a.priority);
  return groups;
}

export function deriveBadges(stats, user, mybbUser) {
  const s = stats || {};
  return PRESTIGE_BADGES.filter(b => {
    switch (b.id) {
      case 'founder':             return s.is_founder >= 1;
      case 'administrator':       return mybbUser?.role === 'admin';
      case 'repeater_owner':      return (s.repeaters_managed || 0) >= 1;
      case 'net_control':         return (s.net_control_sessions || 0) >= 1;
      case 'emergency_volunteer': return (s.emergency_activations || 0) >= 1;
      case 'road_warrior':        return (s.miles_traveled || 0) >= 10000;
      case 'rf_explorer':         return (s.repeaters_visited || 0) >= 25;
      case 'legendary_operator':  return (s.level || 1) >= 20;
      case 'community_mentor':    return (s.helpful_answers || 0) >= 25;
      case 'streak_365':          return (s.daily_login_streak || 0) >= 365;
      case 'mythic_achievement':  return (s.achievement_score || 0) >= 1000;
      default: return false;
    }
  });
}

export function selectBanner(stats, mybbUser, userBanner) {
  if (userBanner && BANNERS[userBanner]) return BANNERS[userBanner];
  const s = stats || {};
  if (s.is_founder || mybbUser?.role === 'admin') return BANNERS.founder;
  if ((s.level || 1) >= 25) return BANNERS.tactical;
  if ((s.level || 1) >= 20) return BANNERS.aurora;
  if ((s.level || 1) >= 15) return BANNERS.nightops;
  if ((s.level || 1) >= 12) return BANNERS.neon;
  if ((s.level || 1) >= 10) return BANNERS.lightning;
  if ((s.level || 1) >= 5) return BANNERS.galaxy;
  if ((s.emergency_activations || 0) >= 1) return BANNERS.storm;
  if ((s.repeaters_visited || 0) >= 10) return BANNERS.radiotower;
  if ((s.forum_posts || 0) >= 100) return BANNERS.matrix;
  return BANNERS.carbon;
}

export function getAvatarFrame(achievements, mybbUser) {
  if (!achievements || achievements.length === 0) return null;
  const rarities = achievements.map(a => a.rarity);
  if (rarities.includes('founder') || mybbUser?.role === 'admin') return 'founder';
  if (rarities.includes('mythic')) return 'mythic';
  if (rarities.includes('legendary')) return 'legendary';
  if (rarities.includes('epic')) return 'epic';
  if (rarities.includes('rare')) return 'rare';
  return 'common';
}