import { useState } from "react";
import { Plus, Hash, Star, MessageCircle, Radio, ChevronDown, BellOff } from "lucide-react";
import RoomList from "@/components/chatV2/community/RoomList";
import ConversationListV2 from "@/components/chatV2/ConversationListV2";
import ManageRoomDialog from "@/components/chatV2/community/ManageRoomDialog";

const LOGO = "https://media.base44.com/images/public/6a24d788be1af31b2258fab2/ef2f5095f_EA7D7629-51E2-49DA-AE8B-4017441D651F.png";

// HubNav — the unified left rail. New Message action, community switcher,
// three filter tabs (Channels / Direct / Starred), the active community's
// rooms (with unread badges + favorites), the DM conversation list, and a
// footer card showing the community's linked repeater.
export default function HubNav({
  mistUser, community, communities, commLoading,
  rooms, memberships, roomsLoading, reloadRooms,
  conversations, dmLoading, presenceByUser,
  sel, navTab, setNavTab,
  onSelectChannel, onSelectDM, onNewMessage,
  totalDMUnread, totalChannelUnread, starredRooms, myRole, updateMembership,
}) {
  const [showCommMenu, setShowCommMenu] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [showManage, setShowManage] = useState(false);

  const isAdmin = ["community_owner", "community_admin"].includes(myRole);

  const pickCommunity = (id) => {
    setShowCommMenu(false);
    if (!id || id === community?.id) return;
    localStorage.setItem("selected_community_id", id);
    window.dispatchEvent(new Event("storage"));
  };

  const tabs = [
    { id: "channels", label: "Channels", icon: Hash, badge: totalChannelUnread },
    { id: "dm", label: "Direct", icon: MessageCircle, badge: totalDMUnread },
    { id: "starred", label: "Starred", icon: Star, badge: starredRooms.length },
  ];

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Brand + New Message */}
      <header className="flex items-center justify-between gap-2 px-4 h-14 shrink-0 border-b border-border">
        <div className="hidden xl:flex items-center gap-2 min-w-0">
          <img src={LOGO} alt="MISST" className="w-6 h-6 object-contain shrink-0 drop-shadow-[0_0_6px_rgba(139,92,246,0.5)]" />
          <span className="text-sm font-extrabold tracking-[0.2em] text-violet-300 uppercase truncate">MISST</span>
        </div>
        <span className="xl:hidden text-sm font-bold text-foreground">Messages</span>
        <button
          onClick={onNewMessage}
          className="inline-flex items-center gap-1.5 px-3 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white text-sm font-semibold shadow-lg shadow-violet-500/20 hover:brightness-110 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" /> New
        </button>
      </header>

      {/* Community switcher */}
      <div className="relative px-3 pt-3 shrink-0">
        <button
          onClick={() => setShowCommMenu((v) => !v)}
          className="w-full flex items-center gap-2.5 px-3 h-12 rounded-xl bg-secondary/50 border border-border hover:border-primary/40 transition-colors"
        >
          {community?.logo_url
            ? <img src={community.logo_url} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
            : <div className="w-8 h-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center text-sm font-bold shrink-0">{(community?.name || "C")[0]}</div>}
          <div className="min-w-0 flex-1 text-left">
            <p className="text-sm font-semibold truncate leading-tight">{community?.name || (commLoading ? "Loading…" : "No community")}</p>
            <p className="text-[11px] text-muted-foreground leading-tight truncate">{rooms.length} channels</p>
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        </button>
        {showCommMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowCommMenu(false)} />
            <div className="absolute left-3 right-3 top-16 z-20 rounded-xl border border-border bg-popover shadow-xl py-1 max-h-72 overflow-y-auto">
              {(communities || []).map((c) => (
                <button key={c.id} onClick={() => pickCommunity(c.id)} className={`w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-muted/60 ${c.id === community?.id ? "bg-primary/10" : ""}`}>
                  {c.logo_url ? <img src={c.logo_url} alt="" className="w-7 h-7 rounded-lg object-cover" /> : <div className="w-7 h-7 rounded-lg bg-primary/15 text-primary flex items-center justify-center text-xs font-bold">{(c.name || "C")[0]}</div>}
                  <span className="text-sm truncate flex-1">{c.name}</span>
                </button>
              ))}
              {(!communities || !communities.length) && <p className="px-3 py-3 text-xs text-muted-foreground">No communities joined.</p>}
            </div>
          </>
        )}
      </div>

      {/* Filter tabs */}
      <div className="px-3 pt-2 shrink-0">
        <div className="flex gap-1 p-1 rounded-xl bg-secondary/40 border border-border">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = navTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setNavTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg text-[12px] font-semibold transition-colors ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.label}</span>
                {!!t.badge && (
                  <span className={`min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center ${active ? "bg-primary-foreground/25" : "bg-destructive text-destructive-foreground"}`}>{t.badge > 9 ? "9+" : t.badge}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* List body */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {navTab === "channels" && (
          <RoomList
            rooms={rooms}
            memberships={memberships}
            activeRoomId={sel?.type === "channel" ? sel.id : null}
            onSelect={onSelectChannel}
            loading={roomsLoading}
            onToggleFavorite={(rid) => updateMembership?.(rid, { favorite: !memberships[rid]?.favorite })}
            onTogglePin={(rid) => updateMembership?.(rid, { pinned: !memberships[rid]?.pinned })}
            isAdmin={isAdmin}
            onCreateRoom={() => { setEditingRoom(null); setShowManage(true); }}
            onEditRoom={(r) => { setEditingRoom(r); setShowManage(true); }}
          />
        )}
        {navTab === "dm" && (
          <ConversationListV2
            conversations={conversations}
            activeId={sel?.type === "dm" ? sel.id : null}
            onSelect={onSelectDM}
            presenceByUser={presenceByUser}
            myId={mistUser?.id}
            loading={dmLoading}
          />
        )}
        {navTab === "starred" && <StarredList rooms={starredRooms} memberships={memberships} sel={sel} onSelect={onSelectChannel} />}
      </div>

      {/* Footer: linked repeater */}
      <footer className="shrink-0 border-t border-border p-3">
        <div className="flex items-center gap-3 px-2.5 py-2.5 rounded-xl bg-secondary/40 border border-border">
          <div className="w-9 h-9 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
            <Radio className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-foreground leading-tight truncate">{community?.primary_repeater || "No repeater linked"}</p>
            <p className="text-[10px] text-muted-foreground leading-tight truncate">
              {community?.frequency ? `${community.frequency} MHz` : "—"}{community?.pl_tone ? ` · ${community.pl_tone}` : ""}{community?.callsign ? ` · ${community.callsign}` : ""}
            </p>
          </div>
        </div>
      </footer>

      {showManage && (
        <ManageRoomDialog
          community={community}
          room={editingRoom}
          user={mistUser}
          onClose={() => { setShowManage(false); setEditingRoom(null); reloadRooms(); }}
        />
      )}
    </div>
  );
}

function StarredList({ rooms, memberships, sel, onSelect }) {
  if (!rooms.length) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-6 text-muted-foreground">
        <Star className="w-8 h-8 mb-2 opacity-30" />
        <p className="text-sm">No starred channels yet.</p>
        <p className="text-xs mt-1">Star channels to pin them here for quick access.</p>
      </div>
    );
  }
  return (
    <div className="h-full overflow-y-auto">
      {rooms.map((r) => {
        const active = sel?.type === "channel" && sel.id === r.id;
        const m = memberships[r.id];
        return (
          <button key={r.id} onClick={() => onSelect(r.id)} className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors border-b border-border/40 ${active ? "bg-primary/10" : "hover:bg-muted/30"}`}>
            <Hash className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-sm font-medium truncate flex-1">{r.name}</span>
            {m?.muted && <BellOff className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
            {(m?.unread_count || 0) > 0 && (
              <span className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">{m.unread_count > 9 ? "9+" : m.unread_count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}