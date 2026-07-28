import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCommunity } from '@/contexts/CommunityContext';
import { Shield, ChevronLeft, Inbox, LayoutDashboard, Users, Settings, History, Trash2, Activity, ShieldCheck } from 'lucide-react';
import CommunityAdminOverview from '@/components/community/CommunityAdminOverview';
import CommunityMemberManager from '@/components/community/CommunityMemberManager';
import CommunitySettingsEditor from '@/components/community/CommunitySettingsEditor';
import CommunityAuditLogViewer from '@/components/community/CommunityAuditLogViewer';
import ModerationDashboard from '@/components/community/ModerationDashboard';
import DeletedMessagesViewer from '@/components/community/DeletedMessagesViewer';
import ModerationAnalytics from '@/components/community/ModerationAnalytics';
import CommunityRoleManager from '@/components/community/rbac/CommunityRoleManager';

export default function CommunityAdmin() {
  const { community, hasPermission } = useCommunity();
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');

  const canManage =
    hasPermission('community:admin') ||
    hasPermission('community:manage_settings') ||
    hasPermission('community:manage_members');

  if (!canManage) {
    return (
      <div className="p-4 text-center py-12">
        <Shield className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-muted-foreground text-sm">You do not have admin access to this community.</p>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'roles', label: 'Roles', icon: ShieldCheck },
    { id: 'moderation', label: 'Moderation', icon: Shield },
    { id: 'analytics', label: 'Analytics', icon: Activity },
    { id: 'deleted', label: 'Deleted', icon: Trash2 },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'audit', label: 'Audit Log', icon: History },
  ];

  return (
    <div className="p-4 space-y-4 pb-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(`/c/${community.slug}`)} className="p-1 -ml-1 text-muted-foreground hover:text-foreground">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <Shield className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold text-foreground">Community Admin</h1>
        </div>
        <Link
          to={`/c/${community.slug}/admin/requests`}
          className="flex items-center gap-1.5 text-xs font-medium text-primary px-2.5 py-1.5 rounded-lg bg-primary/10 border border-primary/20"
        >
          <Inbox className="w-3.5 h-3.5" /> Requests
        </Link>
      </div>

      <div className="flex gap-1 p-1 rounded-xl bg-card border border-border overflow-x-auto scrollbar-hide">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`shrink-0 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-[11px] font-semibold transition-colors ${
                tab === t.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'overview' && <CommunityAdminOverview />}
      {tab === 'members' && <CommunityMemberManager />}
      {tab === 'roles' && <CommunityRoleManager community={community} />}
      {tab === 'moderation' && <ModerationDashboard community={community} />}
      {tab === 'analytics' && <ModerationAnalytics community={community} />}
      {tab === 'deleted' && <DeletedMessagesViewer community={community} />}
      {tab === 'settings' && <CommunitySettingsEditor />}
      {tab === 'audit' && <CommunityAuditLogViewer />}
    </div>
  );
}