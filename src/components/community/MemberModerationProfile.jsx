import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { mist } from '@/api/mist';
import { format } from 'date-fns';
import { X, Shield, Clock, MessageSquare, Heart, Flag, Megaphone, StickyNote, FileText, Activity } from 'lucide-react';
import MemberHistoryTab from './MemberHistoryTab';
import MemberNotesTab from './MemberNotesTab';

const ROLE_LABELS = {
  community_owner: 'Owner', community_admin: 'Admin', net_control: 'Net Control',
  moderator: 'Moderator', trusted_member: 'Trusted', member: 'Member', guest: 'Guest',
};
const STATUS_TONE = {
  active: 'bg-emerald-500/15 text-emerald-400', pending: 'bg-amber-500/15 text-amber-400',
  suspended: 'bg-orange-500/15 text-orange-400', banned: 'bg-rose-500/15 text-rose-400',
  left: 'bg-slate-500/15 text-slate-400',
};

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-border bg-card/40 p-2.5 flex items-center gap-2">
      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-base font-bold leading-none">{value ?? 0}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{label}</p>
      </div>
    </div>
  );
}

export default function MemberModerationProfile({ community, target, onClose }) {
  const [tab, setTab] = useState('overview');
  const { data, isLoading } = useQuery({
    queryKey: ['member-mod-profile', community.id, target.user_id],
    queryFn: async () => (await mist.functions.invoke('getMemberModerationProfile', { community_id: community.id, target_user_id: target.user_id })).data,
  });

  const member = data?.member || target;
  const user = data?.user;
  const stats = data?.stats || {};
  const name = user?.name || target.user_name || 'Member';
  const avatar = user?.avatar || target.user_avatar;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-background/90 backdrop-blur sticky top-0">
        <button onClick={onClose} className="p-2 -ml-2 rounded-lg hover:bg-muted/60 min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label="Close">
          <X className="w-5 h-5" />
        </button>
        {avatar ? (
          <img src={avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold">{(name || '?')[0]}</div>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-base font-semibold truncate">{name}</h1>
          <p className="text-[11px] text-muted-foreground truncate">
            {target.user_callsign ? `${target.user_callsign} · ` : ''}{user?.email || target.user_email}
          </p>
        </div>
      </header>

      <div className="flex gap-1 p-2 border-b border-border bg-card/30 overflow-x-auto scrollbar-hide">
        {[
          { id: 'overview', label: 'Overview', icon: Activity },
          { id: 'history', label: 'History', icon: Shield },
          { id: 'notes', label: 'Notes', icon: StickyNote },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${tab === t.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
              <Icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-12"><div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : tab === 'overview' ? (
          <>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">{ROLE_LABELS[member.role] || member.role}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-medium capitalize ${STATUS_TONE[member.status] || 'bg-slate-500/15 text-slate-400'}`}>{member.status}</span>
              {member.muted && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 font-medium">
                  Muted{member.muted_until ? ` until ${format(new Date(member.muted_until), 'MMM d, h:mm a')}` : ' (permanent)'}
                </span>
              )}
              {member.joined_date && <span className="text-[10px] text-muted-foreground">Joined {format(new Date(member.joined_date), 'MMM d, yyyy')}</span>}
              {data?.lastActive && <span className="text-[10px] text-muted-foreground">· Last active {format(new Date(data.lastActive), 'MMM d, h:mm a')}</span>}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              <Stat icon={MessageSquare} label="Messages" value={stats.totalMessages} />
              <Stat icon={Heart} label="Reactions" value={stats.totalReactions} />
              <Stat icon={Megaphone} label="Announcements" value={stats.announcementsCreated} />
              <Stat icon={FileText} label="Deleted Msgs" value={stats.deletedMessages} />
              <Stat icon={Flag} label="Reports Filed" value={stats.reportsFiled} />
              <Stat icon={Shield} label="Reports Against" value={stats.reportsAgainst} />
              <Stat icon={StickyNote} label="Mod Notes" value={stats.notesCount} />
              <Stat icon={Clock} label="Last Active" value={data?.lastActive ? format(new Date(data.lastActive), 'MMM d') : '—'} />
            </div>

            <div>
              <h3 className="text-xs font-semibold text-muted-foreground mb-2">Recent History</h3>
              <div className="space-y-1.5">
                {(data?.recentHistory || []).length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No moderation history yet.</p>
                ) : data.recentHistory.slice(0, 6).map((h) => (
                  <div key={h.id} className="flex items-start gap-2 p-2 rounded-lg bg-card/40 border border-border">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-foreground"><span className="font-medium">{h.action}</span> {h.reason ? `· ${h.reason}` : ''}</p>
                      <p className="text-[10px] text-muted-foreground">{h.admin_name} · {h.created_date ? format(new Date(h.created_date), 'MMM d, h:mm a') : ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : tab === 'history' ? (
          <MemberHistoryTab community={community} targetUser={target} memberName={name} />
        ) : (
          <MemberNotesTab community={community} targetUser={target} />
        )}
      </div>
    </div>
  );
}