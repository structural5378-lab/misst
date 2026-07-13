export const RARITIES = {
  common: {
    label: "Common", tier: 1,
    colors: { primary: "#94a3b8", secondary: "#64748b", glow: "rgba(148,163,184,0.3)" },
    gradient: "linear-gradient(135deg, #bfc5cf 0%, #94a3b8 50%, #64748b 100%)",
    borderGradient: "conic-gradient(from 0deg, #94a3b8, #cbd5e1, #94a3b8, #64748b, #94a3b8)",
    glow: "0 0 12px rgba(148,163,184,0.25)",
    holographic: false, particles: false, iconColor: "#1e293b",
  },
  rare: {
    label: "Rare", tier: 2,
    colors: { primary: "#3b82f6", secondary: "#1d4ed8", glow: "rgba(59,130,246,0.4)" },
    gradient: "linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #1d4ed8 100%)",
    borderGradient: "conic-gradient(from 0deg, #3b82f6, #93c5fd, #3b82f6, #1d4ed8, #3b82f6)",
    glow: "0 0 18px rgba(59,130,246,0.35)",
    holographic: false, particles: false, iconColor: "#fff",
  },
  epic: {
    label: "Epic", tier: 3,
    colors: { primary: "#a855f7", secondary: "#7c3aed", glow: "rgba(168,85,247,0.45)" },
    gradient: "linear-gradient(135deg, #c084fc 0%, #a855f7 50%, #7c3aed 100%)",
    borderGradient: "conic-gradient(from 0deg, #a855f7, #d8b4fe, #a855f7, #7c3aed, #a855f7)",
    glow: "0 0 22px rgba(168,85,247,0.4)",
    holographic: false, particles: true, particleCount: 3, iconColor: "#fff",
  },
  legendary: {
    label: "Legendary", tier: 4,
    colors: { primary: "#f59e0b", secondary: "#d97706", glow: "rgba(245,158,11,0.5)" },
    gradient: "linear-gradient(135deg, #fcd34d 0%, #f59e0b 50%, #d97706 100%)",
    borderGradient: "conic-gradient(from 0deg, #f59e0b, #fde68a, #f59e0b, #d97706, #f59e0b)",
    glow: "0 0 28px rgba(245,158,11,0.45)",
    holographic: false, particles: true, particleCount: 5, iconColor: "#78350f",
  },
  mythic: {
    label: "Mythic", tier: 5,
    colors: { primary: "#ec4899", secondary: "#8b5cf6", glow: "rgba(236,72,153,0.55)" },
    gradient: "linear-gradient(135deg, #f472b6 0%, #ec4899 30%, #a855f7 60%, #8b5cf6 100%)",
    borderGradient: "conic-gradient(from 0deg, #ec4899, #f9a8d4, #a855f7, #f472b6, #ec4899)",
    glow: "0 0 34px rgba(236,72,153,0.5)",
    holographic: true, particles: true, particleCount: 6, iconColor: "#fff",
  },
  founder: {
    label: "Founder", tier: 6,
    colors: { primary: "#fbbf24", secondary: "#f59e0b", glow: "rgba(251,191,36,0.6)" },
    gradient: "linear-gradient(135deg, #fde047 0%, #fbbf24 30%, #f59e0b 60%, #b45309 100%)",
    borderGradient: "conic-gradient(from 0deg, #fbbf24, #fef3c7, #f59e0b, #fbbf24, #d97706, #fbbf24)",
    glow: "0 0 40px rgba(251,191,36,0.55)",
    holographic: true, particles: true, particleCount: 8, iconColor: "#78350f",
  },
  seasonal: {
    label: "Seasonal", tier: 4,
    colors: { primary: "#10b981", secondary: "#059669", glow: "rgba(16,185,129,0.45)" },
    gradient: "linear-gradient(135deg, #34d399 0%, #10b981 50%, #059669 100%)",
    borderGradient: "conic-gradient(from 0deg, #10b981, #6ee7b7, #10b981, #059669, #10b981)",
    glow: "0 0 24px rgba(16,185,129,0.4)",
    holographic: false, particles: true, particleCount: 4, iconColor: "#064e3b",
  },
  club_exclusive: {
    label: "Club Exclusive", tier: 4,
    colors: { primary: "#06b6d4", secondary: "#0891b2", glow: "rgba(6,182,212,0.45)" },
    gradient: "linear-gradient(135deg, #22d3ee 0%, #06b6d4 50%, #0891b2 100%)",
    borderGradient: "conic-gradient(from 0deg, #06b6d4, #67e8f9, #06b6d4, #0891b2, #06b6d4)",
    glow: "0 0 24px rgba(6,182,212,0.4)",
    holographic: false, particles: true, particleCount: 4, iconColor: "#083344",
  },
  national_event: {
    label: "National Event", tier: 5,
    colors: { primary: "#ef4444", secondary: "#3b82f6", glow: "rgba(239,68,68,0.5)" },
    gradient: "linear-gradient(135deg, #ef4444 0%, #f87171 30%, #ffffff 50%, #60a5fa 70%, #3b82f6 100%)",
    borderGradient: "conic-gradient(from 0deg, #ef4444, #fca5a5, #3b82f6, #93c5fd, #ef4444)",
    glow: "0 0 30px rgba(239,68,68,0.45)",
    holographic: true, particles: true, particleCount: 6, iconColor: "#fff",
  },
  developer: {
    label: "Developer Award", tier: 6,
    colors: { primary: "#10b981", secondary: "#064e3b", glow: "rgba(16,185,129,0.6)" },
    gradient: "linear-gradient(135deg, #34d399 0%, #10b981 40%, #047857 70%, #064e3b 100%)",
    borderGradient: "conic-gradient(from 0deg, #10b981, #6ee7b7, #047857, #10b981, #064e3b, #10b981)",
    glow: "0 0 36px rgba(16,185,129,0.55)",
    holographic: true, particles: true, particleCount: 7, iconColor: "#fff",
  },
};

export const RARITY_ORDER = ['developer', 'founder', 'mythic', 'national_event', 'legendary', 'epic', 'seasonal', 'club_exclusive', 'rare', 'common'];

export const RARITY_SCORES = {
  common: 10, rare: 25, epic: 50, legendary: 100, mythic: 250,
  founder: 500, seasonal: 75, club_exclusive: 75, national_event: 150, developer: 300,
};

export const getRarityColor = (rarity) => RARITIES[rarity]?.colors.primary || "#94a3b8";