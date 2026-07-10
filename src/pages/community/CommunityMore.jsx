import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCommunity } from '@/contexts/CommunityContext';
import { Calendar, Radio, Image as ImageIcon, FileText, Shield } from 'lucide-react';

export default function CommunityMore() {
  const { community, hasPermission } = useCommunity();
  const navigate = useNavigate();
  const slug = community.slug;

  const items = [
    { icon: Calendar, label: 'Events', path: `/c/${slug}/events` },
    { icon: Radio, label: 'Repeaters', path: `/c/${slug}/repeaters` },
    { icon: ImageIcon, label: 'Gallery', path: `/c/${slug}/gallery` },
    { icon: FileText, label: 'Files', path: `/c/${slug}/files` },
  ];

  if (hasPermission('community:manage_settings')) {
    items.push({ icon: Shield, label: 'Admin', path: `/c/${slug}/admin` });
  }

  return (
    <div className="p-4 space-y-2">
      <h2 className="text-lg font-bold text-foreground mb-4">More</h2>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm font-medium text-foreground">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}