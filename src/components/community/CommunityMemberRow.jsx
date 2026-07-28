import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { ChevronDown, Crown, Users } from 'lucide-react';
import { format } from 'date-fns';
import MemberRoleManager from './MemberRoleManager';

const ROLES = [
  { value: 'member', label: 'Member' },
  { value: 'trusted_member', label: 'Trusted' },
  { value: 'net_control', label: 'Net Control' },
  { value: 'moderator', label: 'Moderator' },
  { value: 'community_admin', label: 'Admin' },
];

const ROLE_LABELS = {
  community_owner: 'Owner', community_admin: 'Admin', net_control: 'Net Control',
  moderator: 'Moderator', trusted_member: 'Trusted', member: 'Member', guest: 'Guest',
};

const STATUS_BADGE = {
  active: 'bg-emerald-500/15 text-emerald-400',
  pending: 'bg-amber-500/15 text-amber-400',
  suspended: 'bg-orange-500/15 text-orange-400',
  banned: 'bg-rose-500/15 text-rose-400',
  rejected: 'bg-slate-500/15 text-slate-400',
  left: 'bg-slate-500/15 text-slate-400',
};

export default function CommunityMemberRow({ member, communityId, onChanged, onOpenProfile }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showRoles, setShowRoles] = useState(false);
  const isOwner = member.role === 'community_owner';

  const act = async (action, extra = {}) => {
    setBusy(true);
    try {
      await base44.functions.invoke('manageCommunityMembership', {
        action, community_id: communityId, target_user_id: member.user_id, ...extra,
      });
      setOpen(false);
      onChanged?.();
    } catch (e) {
      alert(e?.response?.data?.error || e.message || 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  const setRole = async (role) => {
    setBusy(true);
    try {
      await base44.functions.invoke('manageCommunityMembership', {
        action: 'set_role', community_id: communityId, target_user_id: member.user_id, role,
      });
      setOpen(false);
      onChanged?.();
    } catch (e) {
      alert(e?.response?.data?.error || e.message || 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl bg-card border border-border overflow-hidden">
      <div className="flex items-center gap-3 p-3">
        {member.user_avatar ? (
          <img src={member.user_avatar} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-sm font-bold text-primary shrink-0">
            {(member.user_name || '?')[0]}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold text-foreground truncate">{member.user_name}</p>
            {isOwner && <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {member.user_callsign ? `${member.user_callsign} · ` : ''}{member.user_email}
          </p>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">{ROLE_LABELS[member.role] || member.role}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium capitalize ${STATUS_BADGE[member.status] || 'bg-slate-500/15 text-slate-400'}`}>{member.status}</span>
            {member.muted && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 font-medium">Muted</span>}
            {member.joined_date && <span className="text-[10px] text-muted-foreground/70">Joined {format(new Date(member.joined_date), 'MMM yyyy')}</span>}
          </div>
        </div>
        {!isOwner && (
          <button onClick={() => setOpen((o) => !o)} disabled={busy} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground shrink-0">
            <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {open && !isOwner && (
        <div className="border-t border-border p-3 space-y-3 bg-secondary/20">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5">Roles</p>
            <button disabled={busy} onClick={() => setShowRoles(true)} className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-primary/15 text-primary border border-primary/30">
              <Users className="w-3.5 h-3.5" /> Manage Roles
            </button>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5">Moderation</p>
            <div className="flex flex-wrap gap-1.5">
              {member.status === 'active' && (
                <button disabled={busy} onClick={() => act('suspend')} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-orange-500/15 text-orange-400 border border-orange-500/30">Suspend</button>
              )}
              {member.status === 'suspended' && (
                <button disabled={busy} onClick={() => act('unsuspend')} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">Unsuspend</button>
              )}
              {member.muted ? (
                <button disabled={busy} onClick={() => act('unmute')} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">Unmute</button>
              ) : (
                <button disabled={busy} onClick={() => act('mute')} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30">Mute</button>
              )}
              {member.status !== 'banned' && (
                <button disabled={busy} onClick={() => act('ban')} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-rose-500/15 text-rose-400 border border-rose-500/30">Ban</button>
              )}
              {member.status === 'banned' && (
                <button disabled={busy} onClick={() => act('unban')} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">Unban</button>
              )}
              <button disabled={busy} onClick={() => act('kick')} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-500/15 text-slate-300 border border-slate-500/30">Remove</button>
              <button disabled={busy} onClick={() => onOpenProfile?.(member)} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-primary/15 text-primary border border-primary/30">Moderation Profile</button>
            </div>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5">Voice (future)</p>
            <div className="flex flex-wrap gap-1.5 items-center">
              {member.muted ? (
                <button disabled={busy} onClick={() => act('unmute', { context: 'voice' })} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">Voice Unmute</button>
              ) : (
                <button disabled={busy} onClick={() => act('mute', { context: 'voice' })} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30">Voice Mute</button>
              )}
              <button disabled={busy} onClick={() => act('kick', { context: 'voice' })} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-500/15 text-slate-300 border border-slate-500/30">Voice Kick</button>
              <span className="text-[10px] text-muted-foreground/70">Disconnect / room-lock enforced when voice ships</span>
            </div>
          </div>
        </div>
      )}

      {showRoles && (
        <MemberRoleManager member={member} onClose={() => setShowRoles(false)} onSaved={onChanged} />
      )}
    </div>
  );
}