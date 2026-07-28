import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCommunity } from '@/contexts/CommunityContext';
import {
  MessageSquare,
  MessageCircle,
  Users,
  Calendar,
  Radio,
  Image as ImageIcon,
  FileText,
  Shield,
  ChevronRight,
  Award,
} from 'lucide-react';

export default function CommunityHome() {
  const { community, permissions, hasPermission } = useCommunity();
  const navigate = useNavigate();
  const slug = community.slug;

  // Community-scoped member count — uses the denormalized, community-owned
  // count maintained by manageCommunityMembership (never a cross-community query).
  const memberCount = community.member_count ?? 0;

  const quickAccess = [
    { icon: MessageSquare, label: 'Forum', path: `/c/${slug}/forum`, perm: null },
    { icon: MessageCircle, label: 'Chat', path: `/c/${slug}/chat`, perm: null },
    { icon: Users, label: 'Members', path: `/c/${slug}/members`, perm: null },
    { icon: Award, label: 'Staff', path: `/c/${slug}/staff`, perm: null },
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

      {(permissions.community_role === 'community_owner' || permissions.community_role === 'community_admin') && (
        <Link
          to={`/c/${slug}/admin`}
          className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-violet-500/15 to-fuchsia-500/15 border border-violet-500/30 hover:border-violet-500/50 transition-colors"
        >
          <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground">Community Admin</p>
            <p className="text-xs text-muted-foreground">Manage members, roles & moderation</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        </Link>
      )}

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