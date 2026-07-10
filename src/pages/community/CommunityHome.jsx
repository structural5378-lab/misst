import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCommunity } from '@/contexts/CommunityContext';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  MessageSquare,
  MessageCircle,
  Users,
  Calendar,
  Radio,
  Image as ImageIcon,
  FileText,
} from 'lucide-react';

export default function CommunityHome() {
  const { community, permissions, hasPermission } = useCommunity();
  const navigate = useNavigate();
  const slug = community.slug;

  const { data: memberCount } = useQuery({
    queryKey: ['community-member-count', community.id],
    queryFn: async () => {
      const res = await base44.entities.CommunityMember.filter({
        community_id: community.id,
        is_active: true,
      });
      return res.length;
    },
    staleTime: 60 * 1000,
  });

  const quickAccess = [
    { icon: MessageSquare, label: 'Forum', path: `/c/${slug}/forum`, perm: null },
    { icon: MessageCircle, label: 'Chat', path: `/c/${slug}/chat`, perm: null },
    { icon: Users, label: 'Members', path: `/c/${slug}/members`, perm: null },
    { icon: Calendar, label: 'Events', path: `/c/${slug}/events`, perm: null },
    { icon: Radio, label: 'Repeaters', path: `/c/${slug}/repeaters`, perm: null },
    { icon: ImageIcon, label: 'Gallery', path: `/c/${slug}/gallery`, perm: null },
    { icon: FileText, label: 'Files', path: `/c/${slug}/files`, perm: null },
  ];

  const filtered = quickAccess.filter((item) => item.perm === null || hasPermission(item.perm));

  return (
    <div className="p-4 space-y-4">
      {community.banner_url && (
        <div className="h-32 rounded-xl overflow-hidden">
          <img src={community.banner_url} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-foreground">{community.name}</h1>
        {community.callsign && (
          <p className="text-primary text-sm font-medium">{community.callsign}</p>
        )}
        {community.description && (
          <p className="text-muted-foreground text-sm mt-1">{community.description}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {filtered.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm font-medium text-foreground">{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="text-center text-muted-foreground text-xs pt-4">
        {memberCount !== undefined && `${memberCount} members · `}
        {community.visibility === 'public' ? 'Public' : 'Private'} · {community.plan} plan
      </div>

      {permissions.community_role && (
        <div className="text-center text-xs text-muted-foreground">
          Your role: <span className="text-primary font-medium">{permissions.community_role}</span>
        </div>
      )}
    </div>
  );
}