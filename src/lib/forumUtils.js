import {
  MessageSquare, Radio, Wrench, Users, Megaphone, Star,
  HelpCircle, Globe, BookOpen, Hash, FlaskConical, Shield, Zap,
} from "lucide-react";

export const CATEGORY_META = [
  { keywords: ["general", "chat", "talk", "lounge", "off-topic"], icon: MessageSquare, color: "violet" },
  { keywords: ["radio", "gmrs", "frequency", "rf", "antenna", "tech", "signal"], icon: Radio, color: "cyan" },
  { keywords: ["repair", "build", "diy", "equipment", "gear", "hardware"], icon: Wrench, color: "amber" },
  { keywords: ["member", "introduce", "about", "new", "welcome"], icon: Users, color: "emerald" },
  { keywords: ["news", "announce", "alert", "notice", "update"], icon: Megaphone, color: "rose" },
  { keywords: ["net", "activity", "on-air", "checkin", "roll"], icon: Star, color: "yellow" },
  { keywords: ["help", "support", "question", "faq", "troubleshoot"], icon: HelpCircle, color: "orange" },
  { keywords: ["digital", "internet", "app", "software", "mesh"], icon: Globe, color: "blue" },
  { keywords: ["test", "experiment", "lab", "prototype"], icon: FlaskConical, color: "teal" },
  { keywords: ["rules", "moderation", "report", "conduct"], icon: Shield, color: "red" },
  { keywords: ["power", "battery", "solar", "portable", "go-kit"], icon: Zap, color: "yellow" },
];

export const COLOR_MAP = {
  violet:  { bg: "bg-violet-500/15",  icon: "text-violet-400",  dot: "bg-violet-400",  border: "border-violet-500/30",  text: "text-violet-300" },
  cyan:    { bg: "bg-cyan-500/15",    icon: "text-cyan-400",    dot: "bg-cyan-400",    border: "border-cyan-500/30",    text: "text-cyan-300" },
  amber:   { bg: "bg-amber-500/15",   icon: "text-amber-400",   dot: "bg-amber-400",   border: "border-amber-500/30",   text: "text-amber-300" },
  emerald: { bg: "bg-emerald-500/15", icon: "text-emerald-400", dot: "bg-emerald-400", border: "border-emerald-500/30", text: "text-emerald-300" },
  rose:    { bg: "bg-rose-500/15",    icon: "text-rose-400",    dot: "bg-rose-400",    border: "border-rose-500/30",    text: "text-rose-300" },
  yellow:  { bg: "bg-yellow-500/15",  icon: "text-yellow-400",  dot: "bg-yellow-400",  border: "border-yellow-500/30",  text: "text-yellow-300" },
  orange:  { bg: "bg-orange-500/15",  icon: "text-orange-400",  dot: "bg-orange-400",  border: "border-orange-500/30",  text: "text-orange-300" },
  blue:    { bg: "bg-blue-500/15",    icon: "text-blue-400",    dot: "bg-blue-400",    border: "border-blue-500/30",    text: "text-blue-300" },
  teal:    { bg: "bg-teal-500/15",    icon: "text-teal-400",    dot: "bg-teal-400",    border: "border-teal-500/30",    text: "text-teal-300" },
  red:     { bg: "bg-red-500/15",     icon: "text-red-400",     dot: "bg-red-400",     border: "border-red-500/30",     text: "text-red-300" },
};

export function getCategoryMeta(name = "", color) {
  if (color && COLOR_MAP[color]) {
    const meta = CATEGORY_META.find(m => m.color === color);
    return { Icon: meta?.icon || Hash, colors: COLOR_MAP[color] };
  }
  const lower = (name || "").toLowerCase();
  for (const m of CATEGORY_META) {
    if (m.keywords.some(k => lower.includes(k))) {
      return { Icon: m.icon, colors: COLOR_MAP[m.color] };
    }
  }
  return { Icon: BookOpen, colors: COLOR_MAP["violet"] };
}

export function timeAgo(dateStr) {
  if (!dateStr) return "";
  const d = typeof dateStr === "number" ? dateStr * 1000 : new Date(dateStr).getTime();
  const diff = Date.now() - d;
  if (isNaN(diff)) return "";
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function parseJSON(field, fallback) {
  if (!field) return fallback;
  if (typeof field === "object") return field;
  try { return JSON.parse(field); } catch { return fallback; }
}

export const REACTION_EMOJIS = {
  like: "👍",
  thumbsup: "👍",
  heart: "❤️",
  laugh: "😂",
  wow: "😮",
  sad: "😢",
  angry: "😠",
  fire: "🔥",
  clap: "👏",
};

export const ROLE_BADGES = {
  platform_owner: { label: "Owner", color: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
  platform_admin: { label: "Admin", color: "text-rose-400 bg-rose-500/10 border-rose-500/30" },
  community_owner: { label: "Founder", color: "text-violet-400 bg-violet-500/10 border-violet-500/30" },
  community_admin: { label: "Admin", color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30" },
  moderator: { label: "Mod", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
  trusted_member: { label: "Trusted", color: "text-blue-400 bg-blue-500/10 border-blue-500/30" },
  member: { label: "Member", color: "text-muted-foreground bg-muted/30 border-border" },
};

export function getRoleBadge(role) {
  return ROLE_BADGES[role] || ROLE_BADGES.member;
}