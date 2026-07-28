import { useEffect, useMemo, useState } from "react";
import { VolumeX, Search } from "lucide-react";
import { useRoomMessages } from "@/hooks/useRoomMessages";
import { useToast } from "@/components/ui/use-toast";
import { base44 } from "@/api/base44Client";
import { formatDayLabel, isSameDay, presenceStatus, isTypingNow } from "@/lib/chatV2/chatV2Utils";
import PremiumChannelHeader from "@/components/chatV2/PremiumChannelHeader";
import RoomIcon from "@/components/chatV2/community/RoomIcon";
import PinnedMessagesSheet from "@/components/chatV2/community/PinnedMessagesSheet";
import ManageRoomDialog from "@/components/chatV2/community/ManageRoomDialog";
import MessageBubbleV2 from "@/components/chatV2/MessageBubbleV2";
import MessageComposerV2 from "@/components/chatV2/MessageComposerV2";

// ChannelWindow — the message stream for one community channel. Reuses the
// realtime useRoomMessages hook (server-gated) and the existing bubble/composer
// components. Carries reply state, in-room search, scroll-to-message, bulk
// moderation, pinned messages, and room management for admins.
export default function ChannelWindow({
  room, community, user, members, myRole, myMember, presence,
  membership, markRead, updateMembership, onBack, onOpenInfo,
}) {
  const { toast } = useToast();
  const [replyTo, setReplyTo] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [highlightId, setHighlightId] = useState(null);
  const [showPinned, setShowPinned] = useState(false);
  const [showManage, setShowManage] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState(() => new Set());

  const isAdmin = ["community_owner", "community_admin"].includes(myRole);
  const canModerate = ["community_owner", "community_admin", "moderator"].includes(myRole);

  const meMuted = useMemo(() => {
    if (!myMember?.muted) return false;
    if (!myMember.muted_until) return true;
    return new Date(myMember.muted_until).getTime() > Date.now();
  }, [myMember]);

  const msgs = useRoomMessages({ roomId: room.id, user, community });
  const muted = !!membership?.muted;

  const canPost = useMemo(() => {
    if (!room || !myRole) return false;
    if (meMuted) return false;
    if (room.is_archived) return false;
    if (room.is_locked && !isAdmin) return false;
    if (room.type === "readonly") return false;
    if (room.type === "admin") return isAdmin;
    return true;
  }, [room, myRole, isAdmin, meMuted]);

  const onlineMembers = useMemo(() => members.filter((m) => {
    const p = presence.presenceByUser[m.user_id];
    return p && presenceStatus(p) === "online";
  }), [members, presence.presenceByUser]);

  const typingNames = useMemo(() => members.filter((m) => {
    const p = presence.presenceByUser[m.user_id];
    return p && p.user_id !== user?.id && isTypingNow(p, `room:${room.id}`);
  }).map((m) => m.user_name || "Someone"), [members, presence.presenceByUser, room.id, user?.id]);

  // Mark read on room open.
  useEffect(() => {
    if (room?.id) {
      const last = msgs.messages[msgs.messages.length - 1];
      markRead?.(room.id, last?.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.id]);

  const scrollToMessage = (id) => {
    if (!id || !msgs.scrollRef.current) return;
    const node = msgs.scrollRef.current.querySelector(`[data-msg-id="${id}"]`);
    if (!node) return;
    node.scrollIntoView({ block: "center", behavior: "smooth" });
    setHighlightId(id);
    setTimeout(() => setHighlightId(null), 1800);
  };

  const onScroll = (e) => {
    const el = e.currentTarget;
    const bottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    msgs.setAtBottom(bottom);
    if (el.scrollTop < 80 && msgs.hasMore && !msgs.loadingMore) msgs.loadMore();
    if (bottom && room.id) {
      const last = msgs.messages[msgs.messages.length - 1];
      if (last && last.sender_id !== user?.id) markRead?.(room.id, last.id);
    }
  };

  const moderateUser = async (action, message, extra = {}) => {
    try {
      await base44.functions.invoke("manageCommunityMembership", {
        action, community_id: community.id, target_user_id: message.sender_id, ...extra,
      });
      toast({ title: "Action complete", description: `${action} applied to ${message.sender_name}.` });
    } catch (e) {
      toast({ title: "Action failed", description: e?.response?.data?.error || e?.message, variant: "destructive" });
    }
  };
  const onMuteUser = async (message) => {
    const hours = window.prompt("Mute duration in hours (blank = permanent):", "1");
    if (hours === null) return;
    const reason = window.prompt("Reason (optional):", "") || "";
    const extra = { reason };
    if (hours.trim() && !isNaN(Number(hours))) extra.mute_duration_hours = Number(hours);
    await moderateUser("mute", message, extra);
  };
  const onSuspendUser = async (message) => { const reason = window.prompt("Reason (optional):", "") || ""; await moderateUser("suspend", message, { reason }); };
  const onKickUser = async (message) => { const reason = window.prompt("Reason (optional):", "") || ""; await moderateUser("kick", message, { reason }); };
  const onBanUser = async (message) => { const reason = window.prompt("Reason (optional):", "") || ""; await moderateUser("ban", message, { reason }); };

  const handleSend = async (body) => {
    try {
      await msgs.send(body, { replyTo, roomName: room.name });
      setReplyTo(null);
    } catch (e) {
      const data = e?.response?.data || e?.data || {};
      if (data.muted) {
        toast({ title: "You are muted", description: data.error, variant: "destructive" });
      } else if (data.slow_mode) {
        toast({ title: "Slow mode active", description: data.error });
      } else {
        toast({ title: "Message not sent", description: data.error || e?.message, variant: "destructive" });
      }
    }
  };

  const doSearch = (e) => {
    e.preventDefault();
    const q = searchQ.toLowerCase().trim();
    if (!q) return;
    const found = msgs.messages.find((m) => (m.body || "").toLowerCase().includes(q) && m.id);
    if (found) scrollToMessage(found.id);
  };

  // ---- Bulk moderation ----
  const toggleSelect = (id) => setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const selectableIds = () => msgs.messages.filter((m) => m.id && !String(m.id).startsWith("tmp_")).map((m) => m.id);
  const selectAll = () => setSelected(new Set(selectableIds()));
  const deselectAll = () => setSelected(new Set());
  const exitSelectMode = () => { setSelectMode(false); setSelected(new Set()); };
  const runBulk = async (fn, label) => {
    const ids = [...selected];
    if (!ids.length) return;
    try { await fn(ids); toast({ title: label, description: `${ids.length} message(s) updated.` }); exitSelectMode(); }
    catch (e) { toast({ title: "Bulk action failed", description: e?.response?.data?.error || e?.message, variant: "destructive" }); }
  };
  const bulkDelete = () => { if (!selected.size || !window.confirm(`Delete ${selected.size} message(s)? This action is logged.`)) return; runBulk((ids) => msgs.bulkDelete(ids, "bulk moderation"), "Deleted"); };
  const bulkPin = () => runBulk((ids) => msgs.bulkSet(ids, "pinned", true), "Pinned");
  const bulkAnnounce = () => runBulk((ids) => msgs.bulkSet(ids, "is_announcement", true), "Marked as Announcement");
  const bulkSticky = () => runBulk((ids) => msgs.bulkSet(ids, "is_sticky", true), "Sticky set");

  return (
    <div className="flex flex-col h-full min-w-0 flex-1 bg-background">
      <PremiumChannelHeader
        room={room}
        community={community}
        memberCount={members.length}
        onlineCount={onlineMembers.length}
        typingNames={typingNames}
        muted={muted}
        onBack={onBack}
        onToggleMute={() => updateMembership?.(room.id, { muted: !muted })}
        onSearch={() => setShowSearch((v) => !v)}
        onOpenInfo={onOpenInfo}
        onManage={isAdmin ? () => setShowManage(true) : null}
        onPinned={() => setShowPinned(true)}
        isAdmin={isAdmin}
        forceBack
      />

      {showSearch && (
        <form onSubmit={doSearch} className="px-3 py-2 border-b border-border bg-background/60">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={searchQ} onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Search in this room…" autoFocus
              className="w-full rounded-xl bg-secondary/50 border border-border pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </form>
      )}

      {canModerate && !selectMode && (
        <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border bg-card/30">
          <button onClick={() => setSelectMode(true)} className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-secondary/60 text-secondary-foreground hover:bg-secondary">
            Select Messages
          </button>
        </div>
      )}

      <div ref={msgs.scrollRef} onScroll={onScroll} className="flex-1 overflow-y-auto py-3">
        {msgs.loadingMore && <div className="flex justify-center py-2"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}
        {msgs.loading ? (
          <div className="flex justify-center py-10"><div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : msgs.messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 text-muted-foreground">
            <RoomIcon name={room.icon} className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm font-medium">No messages yet</p>
            <p className="text-xs">Be the first to post in #{room.name}.</p>
          </div>
        ) : (
          msgs.messages.map((m, i) => {
            const prev = msgs.messages[i - 1];
            const showDay = !prev || !isSameDay(prev.created_date, m.created_date);
            const showAvatar = !prev || prev.sender_id !== m.sender_id || showDay;
            return (
              <div key={m.id || m.client_temp_id} className={highlightId === (m.id || m.client_temp_id) ? "msg-highlight rounded-lg" : ""}>
                {showDay && <DaySep date={m.created_date} />}
                <MessageBubbleV2
                  message={m}
                  isMine={m.sender_id === user?.id}
                  myId={user?.id}
                  showAvatar={showAvatar}
                  onRetry={() => {}}
                  onEdit={msgs.editMessage}
                  onDelete={msgs.deleteMessage}
                  onReact={msgs.react}
                  onReply={setReplyTo}
                  onReplyJump={scrollToMessage}
                  onPin={canModerate ? msgs.pin : undefined}
                  pinned={m.pinned}
                  canModerate={canModerate && m.sender_id !== user?.id}
                  onAnnounce={canModerate ? msgs.announce : undefined}
                  onSticky={canModerate ? msgs.sticky : undefined}
                  onMuteUser={canModerate ? onMuteUser : undefined}
                  onSuspendUser={canModerate ? onSuspendUser : undefined}
                  onKickUser={canModerate ? onKickUser : undefined}
                  onBanUser={canModerate ? onBanUser : undefined}
                  selectMode={selectMode}
                  selected={selected.has(m.id)}
                  onToggleSelect={toggleSelect}
                />
              </div>
            );
          })
        )}
      </div>

      {selectMode ? (
        <div className="border-t border-border bg-card/50 px-3 py-2 mist-safe-bottom">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
            <span className="text-xs font-semibold text-foreground shrink-0 mr-1">{selected.size} selected</span>
            <button onClick={selectAll} className="text-[11px] px-2 py-1 rounded-lg bg-secondary/60 hover:bg-secondary shrink-0">Select All</button>
            <button onClick={deselectAll} className="text-[11px] px-2 py-1 rounded-lg bg-secondary/60 hover:bg-secondary shrink-0">Deselect</button>
            <div className="w-px h-5 bg-border shrink-0" />
            <button onClick={bulkDelete} className="text-[11px] px-2 py-1 rounded-lg bg-destructive/15 text-destructive hover:bg-destructive/25 shrink-0">Delete</button>
            <button onClick={bulkPin} className="text-[11px] px-2 py-1 rounded-lg bg-primary/15 text-primary hover:bg-primary/25 shrink-0">Pin</button>
            <button onClick={bulkAnnounce} className="text-[11px] px-2 py-1 rounded-lg bg-amber-500/15 text-amber-500 hover:bg-amber-500/25 shrink-0">Announce</button>
            <button onClick={bulkSticky} className="text-[11px] px-2 py-1 rounded-lg bg-primary/15 text-primary hover:bg-primary/25 shrink-0">Sticky</button>
            <div className="flex-1 min-w-1" />
            <button onClick={exitSelectMode} className="text-[11px] px-2.5 py-1 rounded-lg bg-primary text-primary-foreground font-medium shrink-0">Done</button>
          </div>
        </div>
      ) : (
        <>
          {meMuted && (
            <div className="border-t border-border bg-amber-500/10 px-4 py-2.5 flex items-center justify-center gap-2 text-xs text-amber-400">
              <VolumeX className="w-4 h-4 shrink-0" />
              <span>{myMember?.muted_until
                ? `Muted until ${new Date(myMember.muted_until).toLocaleString()}.`
                : "You have been permanently muted in this community."}</span>
            </div>
          )}
          {canPost ? (
            <>
              {typingNames.length > 0 && (
                <div className="px-4 pb-1 text-[11px] text-muted-foreground italic">{typingNames.join(", ")} typing…</div>
              )}
              <MessageComposerV2
                onSend={handleSend}
                placeholder={`Message #${room.name}`}
                replyTo={replyTo}
                onCancelReply={() => setReplyTo(null)}
                onTyping={(v) => presence.setTyping(`room:${room.id}`, v)}
              />
            </>
          ) : (
            <div className="border-t border-border bg-background/60 px-4 py-3 text-center text-sm text-muted-foreground">
              {meMuted ? "You are muted — read-only until the mute is lifted."
                : room.type === "readonly" ? "This room is read-only."
                : room.type === "admin" && !isAdmin ? "Only admins can post here."
                : room.is_locked ? "This room is locked."
                : "You cannot post in this room."}
            </div>
          )}
        </>
      )}

      {showPinned && (
        <PinnedMessagesSheet
          room={room}
          onClose={() => setShowPinned(false)}
          onJump={(id) => { setShowPinned(false); scrollToMessage(id); }}
          onUnpin={isAdmin ? msgs.pin : null}
        />
      )}
      {showManage && (
        <ManageRoomDialog
          community={community}
          room={room}
          user={user}
          onClose={() => setShowManage(false)}
        />
      )}
    </div>
  );
}

function DaySep({ date }) {
  return (
    <div className="flex justify-center my-3">
      <span className="text-[11px] font-medium text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full">{formatDayLabel(date)}</span>
    </div>
  );
}