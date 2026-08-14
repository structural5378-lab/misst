import React from 'react';
import {
  Crown, Shield, Code, ShieldAlert, Users, RadioTower, Star, Gem,
  GraduationCap, Heart, BadgeCheck, Award, Zap, CloudRain, Radio,
} from 'lucide-react';

const ICON_MAP = {
  Crown, Shield, Code, ShieldAlert, Users, RadioTower, Star, Gem,
  GraduationCap, Heart, BadgeCheck, Award, Zap, CloudRain, Radio,
};

export default function GroupTag({ group }) {
  const Icon = ICON_MAP[group.icon] || Shield;
  return (
    <div
      className="group-pill"
      style={{ background: group.gradient, color: group.textColor, boxShadow: group.glow }}
    >
      <Icon className="w-3 h-3 shrink-0" />
      <span>{group.name}</span>
    </div>
  );
}