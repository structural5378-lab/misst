import React from "react";
import { X, Settings, ChevronRight, Radio as RadioIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { MembersView, NetsView, EventsView, MediaView, PinnedView, FilesView, RepeaterView, StatsView } from "./CommunityViews";
import { Badge, roleBadge } from "./badges";

// CommunitySections — the full community info content (banner, description,
// owner/admins/mods, members, nets, events, media, files, pinned, repeater,
// stats, Mission Control shortcut, settings). Used by the desktop right rail
// (always visible) and the mobile slide-out info panel.
function Section({ title, children, action }) {
  return (
    <div className="border-b border-border">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{title}</h3>
        {action}
      </div>
      <div className="px-4 pb-4">{children}</div>
    </div>
  );
}

function PersonRow({ m }) {
  if (!m) return <p className="text-xs text-muted-foreground">—</p>;
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      {m.user_avatar ? <img src={m.user_avatar} alt="" className="w-8 h-8 rounded-full object-cover" /> : <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-[11px] font-semibold">{(m.user_name || "?")[0].toUpperCase()}</div>}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{m.user_name}</p>
        {m.user_callsign && <p className="text-[11px] text-muted-foreground truncate">{m.user_callsign}</p>}
      </div>
      <Badge badge={roleBadge(m.role)} />
    </div>
  );
}

export default function CommunitySections({ community, members, myRole, room, presenceByUser, onClose, onOpenSettings }) {
  const list = members || [];
  const owner = list.find((m) => m.role === "community_owner");
  const admins = list.filter((m) => m.role === "community_admin");
  const mods = list.filter((m) => m.role === "moderator");
  const canManage = ["community_owner", "community_admin"].includes(myRole);

  return (
    <div className="flex flex-col h-full min-h-0 bg-card/40 backdrop-blur-xl">
      {onClose && (
        <header className="flex items-center justify-between px-4 h-12 shrink-0 border-b border-border">
          <h2 className="text-sm font-bold">Community Info</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted/60 text-muted-foreground" aria-label="Close"><X className="w-5 h-5" /></button>
        </header>
      )}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="relative h-24 bg-gradient-to-br from-violet-600/30 to-fuchsia-600/20">
          {community?.banner_url && <img src={community.banner_url} alt="" className="w-full h-full object-cover" />}
          <div className="absolute -bottom-6 left-4">
            {community?.logo_url
              ? <img src={community.logo_url} alt="" className="w-14 h-14 rounded-2xl object-cover ring-4 ring-card" />
              : <div className="w-14 h-14 rounded-2xl bg-primary/15 text-primary flex items-center justify-center text-xl font-bold ring-4 ring-card">{(community?.name || "C")[0]}</div>}
          </div>
        </div>
        <div className="px-4 pt-8 pb-3 border-b border-border">
          <h3 className="text-base font-bold">{community?.name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{list.length} members</p>
          {community?.description && <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{community.description}</p>}
        </div>

        <Section title="Owner"><PersonRow m={owner} /></Section>
        {admins.length > 0 && <Section title="Administrators">{admins.map((m) => <PersonRow key={m.user_id} m={m} />)}</Section>}
        {mods.length > 0 && <Section title="Moderators">{mods.map((m) => <PersonRow key={m.user_id} m={m} />)}</Section>}
        <Section title="Members"><MembersView members={list} presenceByUser={presenceByUser} /></Section>
        <Section title="Upcoming Nets"><NetsView community={community} /></Section>
        <Section title="Upcoming Events"><EventsView community={community} /></Section>
        <Section title="Shared Media"><MediaView community={community} room={room} /></Section>
        <Section title="Files"><FilesView community={community} room={room} /></Section>
        <Section title="Pinned Messages"><PinnedView community={community} room={room} /></Section>
        <Section title="Repeater"><RepeaterView community={community} /></Section>
        <Section title="Statistics"><StatsView community={community} members={list} /></Section>
        <Section title="Mission Control">
          <Link to="/net-control" className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 hover:brightness-125 transition">
            <RadioIcon className="w-4 h-4 text-emerald-300" />
            <span className="text-sm font-semibold">Open Mission Control</span>
            <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground" />
          </Link>
        </Section>
        {canManage && (
          <Section title="Settings">
            <button onClick={onOpenSettings} className="flex items-center gap-2 rounded-xl border border-border bg-secondary/30 p-3 w-full hover:brightness-125 transition">
              <Settings className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Community Settings</span>
              <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground" />
            </button>
          </Section>
        )}
        <div className="h-4" />
      </div>
    </div>
  );
}