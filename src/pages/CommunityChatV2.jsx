import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, VolumeX } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { useMistUser } from "@/hooks/useMistUser";
import { useChatV2Presence } from "@/hooks/useChatV2Presence";
import { useCommunityRooms } from "@/hooks/useCommunityRooms";
import { useRoomMessages } from "@/hooks/useRoomMessages";
import { formatDayLabel, isSameDay, presenceStatus, isTypingNow } from "@/lib/chatV2/chatV2Utils";
import RoomList from "@/components/chatV2/community/RoomList";
import RoomHeader from "@/components/chatV2/community/RoomHeader";
import RoomIcon from "@/components/chatV2/community/RoomIcon";
import ManageRoomDialog from "@/components/chatV2/community/ManageRoomDialog";
import PinnedMessagesSheet from "@/components/chatV2/community/PinnedMessagesSheet";
import MessageBubbleV2 from "@/components/chatV2/MessageBubbleV2";
import MessageComposerV2 from "@/components/chatV2/MessageComposerV2";

// CommunityChatV2 — Discord-style community rooms surface for Chat V2.
// Auto-seeds default rooms, shows a room list (pinned/favorites/rooms), and a
// realtime room window with replies, reactions, mentions, pinning, search,
// presence, and admin room management. DMs are untouched.
function DaySep({ date }) {
  return (
    <div className="flex justify-center my-3">
      <span className="text-[11px] font-medium text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full">{formatDayLabel(date)}</span>
    </div>
  );
}

export default function CommunityChatV2() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { mistUser } = useMistUser();

  const [community, setCommunity] = useState(null);
  const [members, setMembers] = useState([]);
  const [myRole, setMyRole] = useState(null);
  const [myMember, setMyMember] = useState(null);
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [showManage, setShowManage] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [showPinned, setShowPinned] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [highlightId, setHighlightId] = useState(null);

  // Load community + active members + my role.
  useEffect(() => {
    if (!slug) return;
    let active = true;
    (async () => {
      const list = await base44.entities.Community.filter({ slug }, "-created_date", 1).catch(() => []);
      const c = (list || [])[0];
      if (!active) return;
      setCommunity(c);
      if (c) {
        const m = await base44.entities.CommunityMember.filter({ community_id: c.id, status: "active" }, "-joined_date", 500).catch(() => []);
        if (!active) return;
        setMembers(m || []);
        const me = (m || []).find((x) => x.user_id === mistUser?.id);
        setMyRole(me?.role || null);
        setMyMember(me || null);
      }
    })();
    return () => { active = false; };
  }, [slug, mistUser?.id]);

  const isAdmin = ["community_owner", "community_admin"].includes(myRole);
  const canModerate = ["community_owner", "community_admin", "moderator"].includes(myRole);
  const { toast } = useToast();

  const meMuted = useMemo(() => {
    if (!myMember?.muted) return false;
    if (!myMember.muted_until) return true;
    return new Date(myMember.muted_until).getTime() > Date.now();
  }, [myMember]);
  const { rooms, memberships, loading, reload, markRead, updateMembership } = useCommunityRooms(community?.id, mistUser);
  const presence = useChatV2Presence(mistUser);

  // Auto-select the first visible room.
  useEffect(() => {
    if (!activeRoomId && rooms.length) {
      const first = rooms.find((r) => !r.is_archived && !(r.is_hidden && !isAdmin)) || rooms[0];
      setActiveRoomId(first?.id || null);
    }
  }, [rooms, activeRoomId, isAdmin]);

  const activeRoom = rooms.find((r) => r.id === activeRoomId) || null;
  const msgs = useRoomMessages({ roomId: activeRoomId, user: mistUser, community });

  // Mark read on room open.
  useEffect(() => {
    if (activeRoomId && activeRoom) {
      const last = msgs.messages[msgs.messages.length - 1];
      markRead(activeRoomId, last?.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRoomId]);

  const onlineMembers = useMemo(
    () => members.filter((m) => {
      const p = presence.presenceByUser[m.user_id];
      return p && presenceStatus(p) === "online";
    }),
    [members, presence.presenceByUser]
  );

  const typingNames = useMemo(
    () => members.filter((m) => {
      const p = presence.presenceByUser[m.user_id];
      return p && p.user_id !== mistUser?.id && isTypingNow(p, `room:${activeRoomId}`);
    }).map((m) => m.user_name || "Someone"),
    [members, presence.presenceByUser, activeRoomId, mistUser?.id]
  );

  const roomMembership = activeRoomId ? memberships[activeRoomId] : null;
  const muted = !!roomMembership?.muted;

  const canPost = useMemo(() => {
    if (!activeRoom || !myRole) return false;
    if (meMuted) return false;
    if (activeRoom.is_archived) return false;
    if (activeRoom.is_locked && !isAdmin) return false;
    if (activeRoom.type === "readonly") return false;
    if (activeRoom.type === "admin") return isAdmin;
    return true;
  }, [activeRoom, myRole, isAdmin, meMuted]);

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
    if (bottom && activeRoomId) {
      const last = msgs.messages[msgs.messages.length - 1];
      if (last && last.sender_id !== mistUser?.id) markRead(activeRoomId, last.id);
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
    const hours = window.prompt("Mute duration in hours (leave blank for permanent):", "1");
    if (hours === null) return;
    const reason = window.prompt("Reason (optional):", "") || "";
    const extra = { reason };
    if (hours.trim() && !isNaN(Number(hours))) extra.mute_duration_hours = Number(hours);
    await moderateUser("mute", message, extra);
  };
  const onSuspendUser = async (message) => {
    const reason = window.prompt("Reason for suspension (optional):", "") || "";
    await moderateUser("suspend", message, { reason });
  };
  const onKickUser = async (message) => {
    const reason = window.prompt("Reason for removal (optional):", "") || "";
    await moderateUser("kick", message, { reason });
  };
  const onBanUser = async (message) => {
    const reason = window.prompt("Reason for ban (optional):", "") || "";
    await moderateUser("ban", message, { reason });
  };

  const handleSend = async (body) => {
    try {
      await msgs.send(body, { replyTo, roomName: activeRoom?.name });
      setReplyTo(null);
    } catch (e) {
      const data = e?.response?.data || e?.data || {};
      if (data.muted) {
        setMyMember((m) => ({ ...(m || {}), muted: true, muted_until: data.muted_until || "" }));
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

  if (!community) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Community header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-background/80 backdrop-blur sticky top-0 z-20">
        <button onClick={() => navigate("/chat-v2")} className="p-2 -ml-2 rounded-lg hover:bg-muted/60 min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label="Back to messages">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 min-w-0">
          {community.logo_url
            ? <img src={community.logo_url} alt="" className="w-8 h-8 rounded-lg object-cover" />
            : <div className="w-8 h-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center text-sm font-bold">{(community.name || "C")[0]}</div>}
          <div className="min-w-0">
            <h1 className="text-base font-semibold leading-tight truncate">{community.name}</h1>
            <p className="text-[11px] text-muted-foreground leading-tight">{members.length} members · {onlineMembers.length} online</p>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Room list */}
        <aside className={`${activeRoomId ? "hidden md:flex" : "flex"} flex-col w-full md:w-72 md:border-r border-border bg-card/30 min-h-0`}>
          <RoomList
            rooms={rooms} memberships={memberships} activeRoomId={activeRoomId}
            onSelect={setActiveRoomId} loading={loading}
            onToggleFavorite={(rid) => updateMembership(rid, { favorite: !memberships[rid]?.favorite })}
            onTogglePin={(rid) => updateMembership(rid, { pinned: !memberships[rid]?.pinned })}
            isAdmin={isAdmin}
            onCreateRoom={() => { setEditingRoom(null); setShowManage(true); }}
            onEditRoom={(r) => { setEditingRoom(r); setShowManage(true); }}
          />
        </aside>

        {/* Room window */}
        <main className={`${activeRoomId ? "flex" : "hidden md:flex"} flex-1 min-w-0 flex-col min-h-0`}>
          {activeRoom ? (
            <>
              <RoomHeader
                room={activeRoom} community={community}
                memberCount={members.length} onlineCount={onlineMembers.length}
                typingNames={typingNames} muted={muted}
                onBack={() => setActiveRoomId(null)}
                onToggleMute={() => updateMembership(activeRoom.id, { muted: !muted })}
                onSearch={() => setShowSearch((v) => !v)}
                onOpenInfo={() => setShowPinned(true)}
                onManage={isAdmin ? () => { setEditingRoom(activeRoom); setShowManage(true); } : null}
              />

              {showSearch && (
                <form onSubmit={doSearch} className="px-3 py-2 border-b border-border bg-background/60">
                  <input
                    value={searchQ} onChange={(e) => setSearchQ(e.target.value)}
                    placeholder="Search in this room…" autoFocus
                    className="w-full rounded-xl bg-secondary/50 border border-border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </form>
              )}

              <div ref={msgs.scrollRef} onScroll={onScroll} className="flex-1 overflow-y-auto py-3">
                {msgs.loadingMore && <div className="flex justify-center py-2"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}
                {msgs.loading ? (
                  <div className="flex justify-center py-10"><div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
                ) : msgs.messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center px-6 text-muted-foreground">
                    <RoomIcon name={activeRoom.icon} className="w-10 h-10 mb-3 opacity-40" />
                    <p className="text-sm font-medium">No messages yet</p>
                    <p className="text-xs">Be the first to post in {activeRoom.name}.</p>
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
                          isMine={m.sender_id === mistUser?.id}
                          myId={mistUser?.id}
                          showAvatar={showAvatar}
                          onRetry={() => {}}
                          onEdit={msgs.editMessage}
                          onDelete={msgs.deleteMessage}
                          onReact={msgs.react}
                          onReply={setReplyTo}
                          onReplyJump={scrollToMessage}
                          onPin={canModerate ? msgs.pin : undefined}
                          pinned={m.pinned}
                          canModerate={canModerate && m.sender_id !== mistUser?.id}
                          onAnnounce={canModerate ? msgs.announce : undefined}
                          onSticky={canModerate ? msgs.sticky : undefined}
                          onMuteUser={canModerate ? onMuteUser : undefined}
                          onSuspendUser={canModerate ? onSuspendUser : undefined}
                          onKickUser={canModerate ? onKickUser : undefined}
                          onBanUser={canModerate ? onBanUser : undefined}
                        />
                      </div>
                    );
                  })
                )}
              </div>

              {meMuted && (
                <div className="border-t border-border bg-amber-500/10 px-4 py-2.5 flex items-center justify-center gap-2 text-xs text-amber-400">
                  <VolumeX className="w-4 h-4 shrink-0" />
                  <span>{myMember?.muted_until
                    ? `You have been muted by the community administration until ${new Date(myMember.muted_until).toLocaleString()}.`
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
                    placeholder={`Message #${activeRoom.name}`}
                    replyTo={replyTo}
                    onCancelReply={() => setReplyTo(null)}
                    onTyping={(v) => presence.setTyping(`room:${activeRoom.id}`, v)}
                  />
                </>
              ) : (
                <div className="border-t border-border bg-background/60 px-4 py-3 text-center text-sm text-muted-foreground">
                  {meMuted ? "You are muted — read-only until the mute is lifted."
                    : activeRoom.type === "readonly" ? "This room is read-only."
                    : activeRoom.type === "admin" && !isAdmin ? "Only admins can post here."
                    : activeRoom.is_locked ? "This room is locked."
                    : "You cannot post in this room."}
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">Select a room</div>
          )}
        </main>
      </div>

      {showManage && (
        <ManageRoomDialog
          community={community}
          room={editingRoom}
          user={mistUser}
          onClose={() => { setShowManage(false); setEditingRoom(null); reload(); }}
        />
      )}
      {showPinned && activeRoom && (
        <PinnedMessagesSheet
          room={activeRoom}
          onClose={() => setShowPinned(false)}
          onJump={(id) => { setShowPinned(false); scrollToMessage(id); }}
          onUnpin={isAdmin ? msgs.pin : null}
        />
      )}
    </div>
  );
}