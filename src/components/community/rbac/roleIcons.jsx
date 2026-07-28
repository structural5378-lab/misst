// Shared lucide icon map for community role badges/editor. Keeps a single
// import surface so role list rows and the editor render the same icon set.
import React from 'react';
import {
  Crown, Shield, ShieldAlert, ShieldCheck, RadioTower, User, Users, Star,
  BadgeCheck, Sparkles, Megaphone, Siren, Radio, GraduationCap, CalendarPlus,
  HandHeart, Briefcase, Terminal, Eye, Gavel, Zap, Award, Flame, Heart, Bookmark,
} from 'lucide-react';

export const ROLE_ICONS = {
  Crown, Shield, ShieldAlert, ShieldCheck, RadioTower, User, Users, Star,
  BadgeCheck, Sparkles, Megaphone, Siren, Radio, GraduationCap, CalendarPlus,
  HandHeart, Briefcase, Terminal, Eye, Gavel, Zap, Award, Flame, Heart, Bookmark,
};

export const ROLE_ICON_NAMES = Object.keys(ROLE_ICONS);

export function RoleIcon({ name, className }) {
  const I = ROLE_ICONS[name] || Shield;
  return <I className={className} />;
}