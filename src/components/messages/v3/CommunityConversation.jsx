import React, { useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, Image as ImageIcon, Users, Calendar, Pin, FileText, VolumeX } from "lucide-react";
import { useRoomMessages } from "@/hooks/useRoomMessages";
import { useToast } from "@/components/ui/use-toast";
import { formatDayLabel, isSameDay, presenceStatus, isTypingNow } from "@/lib/chatV2/chatV2Utils";
import MessageBubbleV2 from "@/components/chatV2/MessageBubbleV2";
import MessageComposerV2 from "@/components/chatV2/MessageComposerV2";
import CommunityHeader from "./CommunityHeader";
import { SenderBadges } from "./badges";
import { MembersView, EventsView, MediaView, PinnedView, FilesView } from "./CommunityViews";
import { setActiveChatView, clearActiveChatView } from "@/lib/activeChatView";

// CommunityConversation — the single living chat for a community. Reuses the
// realtime useRoomMessages engine + MessageBubbleV2/Composer. A compact
// community header sits on top, a tab bar switches between Chat and alternate
// views (Media/Members/Events/Pinned/Files), and a repeater status bar sits
// directly above the fixed composer. Role badges render beside sender names.
const TABS = [
  { id: "chat", label: "Chat", Icon: MessageCircle },
  { id: "media", label: "Media", Icon: ImageIcon },
  { id: "members", label: "Members", Icon: Users },
  { id: "events", label: "Events", Icon: Calendar },
  { id: "pinned", label: "Pinned", Icon: Pin },
  { id: "files", label: "Files", Icon: FileText },
];

export default function CommunityConversation({ community, room, mistUser, members, myMember, myRole, presence, markRead, onOpenInfo, onBack }) {
  const { toast } = useToast();
  const [tab, setTab] = useState("chat");
  const [replyTo, setReplyTo] = useState(null);
  const [highlightId, setHighlightId] = useState(null);
  const atBottomRef = useRef(true);

  const memberByUser = useMemo(() => { const m = {}; (members || []).forEach((x) => { m[x.user_id] = x; }); return m; }, [members]);
  const msgs = useRoomMessages({ roomId: room?.id, user: mistUser, community });

  // Track that the user is actively viewing this community's chat so the
  // app-wide ChatNotificationListener can suppress in-app banners for messages
  // the user is already reading live (and auto-mark them read).
  useEffect(() => {
    setActiveChatView({ type: "community", communityId: community?.id, roomId: room?.id });
    return () => clearActiveChatView();
  }, [community?.id, room?.id]);

  // Auto-scroll to the latest message on room open, on new messages (when
  // already pinned to the bottom), and when the composer is focused (keyboard
  // opening) — so the user never has to manually drag the chat upward.
  useEffect(() => { if (msgs.scrollRef.current) msgs.scrollRef.current.scrollTop = msgs.scrollRef.current.scrollHeight; /* eslint-disable-next-line */ }, [room?.id]);
  useEffect(() => { if (atBottomRef.current && msgs.scrollRef.current) msgs.scrollRef.current.scrollTop = msgs.scrollRef.current.scrollHeight; }, [msgs.messages.length]);
  const scrollToEnd = () => { requestAnimationFrame(() => { if (msgs.scrollRef.current) msgs.scrollRef.current.scrollTop = msgs.scrollRef.current.scrollHeight; }); };

  const isAdmin = ["community_owner", "community_admin"].includes(myRole);
  const canModerate = ["community_owner", "community_admin", "moderator"].includes(myRole);
  const meMuted = useMemo(() => { if (!myMember?.muted) return false; if (!myMember.muted_until) return true; return new Date(myMember.muted_until).getTime() > Date.now(); }, [myMember]);
  const canPost = useMemo(() => {
    if (!room || !myRole) return false;
    if (meMuted) return false;
    if (room.is_archived) return false;
    if (room.is_locked && !isAdmin) return false;
    if (room.type === "readonly") return false;
    if (room.type === "admin") return isAdmin;
    return true;
  }, [room, myRole, isAdmin, meMuted]);

  const onlineMembers = useMemo(() => (members || []).filter((m) => { const p = presence.presenceByUser[m.user_id]; return p && presenceStatus(p) === "online"; }), [members, presence.presenceByUser]);
  const typingNames = useMemo(() => (members || []).filter((m) => { const p = presence.presenceByUser[m.user_id]; return p && p.user_id !== mistUser?.id && isTypingNow(p, `room:${room?.id}`); }).map((m) => m.user_name || "Someone"), [members, presence.presenceByUser, room?.id, mistUser?.id]);

  useEffect(() => { if (room?.id) { const last = msgs.messages[msgs.messages.length - 1]; markRead?.(room.id, last?.id); } /* eslint-disable-next-line */ }, [room?.id]);

  const scrollToMessage = (id) => {
    if (!id) return;
    setTab("chat");
    setTimeout(() => {
      if (!msgs.scrollRef.current) return;
      const node = msgs.scrollRef.current.querySelector(`[data-msg-id="${id}"]`);
      if (!node) return;
      node.scrollIntoView({ block: "center", behavior: "smooth" });
      setHighlightId(id);
      setTimeout(() => setHighlightId(null), 1800);
    }, 80);
  };
  const onScroll = (e) => {
    const el = e.currentTarget;
    const bottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    atBottomRef.current = bottom;
    msgs.setAtBottom(bottom);
    if (el.scrollTop < 80 && msgs.hasMore && !msgs.loadingMore) msgs.loadMore();
    if (bottom && room?.id) { const last = msgs.messages[msgs.messages.length - 1]; if (last && last.sender_id !== mistUser?.id) markRead?.(room.id, last.id); }
  };
  const handleSend = async (body) => {
    try { await msgs.send(body, { replyTo, roomName: room?.name }); setReplyTo(null); }
    catch (e) {
      const d = e?.response?.data || e?.data || {};
      toast({ title: d.muted ? "You are muted" : d.slow_mode ? "Slow mode active" : "Message not sent", description: d.error || e?.message, variant: d.muted || !d.slow_mode ? "destructive" : "default" });
    }
  };

  const repeaterLinked = !!(community?.primary_repeater || community?.frequency);

  return (
    <div className="flex flex-col h-full min-h-0 flex-1 bg-background">
      <CommunityHeader community={community} memberCount={(members || []).length} onlineCount={onlineMembers.length} repeaterLinked={repeaterLinked} onOpenInfo={onOpenInfo} onBack={onBack} />

      <div className="shrink-0 flex items-center gap-1 px-2 py-1.5 border-b border-border bg-background/60 overflow-x-auto scrollbar-hide">
        {TABS.map((t) => { const active = tab === t.id; return (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-1.5 px-3 h-8 rounded-lg text-[12px] font-semibold shrink-0 transition-colors ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/60"}`}>
            <t.Icon className="w-3.5 h-3.5" />{t.label}
          </button>
        ); })}
      </div>

      {tab === "chat" ? (
        <>
          <div ref={msgs.scrollRef} onScroll={onScroll} className="flex-1 min-h-0 overflow-y-auto py-3">
            {msgs.loadingMore && <div className="flex justify-center py-2"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}
            {msgs.loading ? (
              <div className="flex justify-center py-10"><div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
            ) : msgs.messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-6 text-muted-foreground">
                <MessageCircle className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm font-medium">No messages yet</p>
                <p className="text-xs">Be the first to start the conversation in {community?.name}.</p>
              </div>
            ) : msgs.messages.map((m, i) => {
              const prev = msgs.messages[i - 1];
              const showDay = !prev || !isSameDay(prev.created_date, m.created_date);
              const showAvatar = !prev || prev.sender_id !== m.sender_id || showDay;
              return (
                <div key={m.id || m.client_temp_id} className={highlightId === (m.id || m.client_temp_id) ? "msg-highlight rounded-lg" : ""}>
                  {showDay && <DaySep date={m.created_date} />}
                  <MessageBubbleV2
                    message={m} isMine={m.sender_id === mistUser?.id} myId={mistUser?.id} showAvatar={showAvatar}
                    onRetry={() => {}} onEdit={msgs.editMessage} onDelete={msgs.deleteMessage} onReact={msgs.react}
                    onReply={setReplyTo} onReplyJump={scrollToMessage} onPin={canModerate ? msgs.pin : undefined} pinned={m.pinned}
                    canModerate={canModerate && m.sender_id !== mistUser?.id}
                    senderBadge={<SenderBadges member={memberByUser[m.sender_id]} />}
                  />
                </div>
              );
            })}
          </div>
          {canPost ? (
            <>
              {typingNames.length > 0 && <div className="px-4 pb-1 text-[11px] text-muted-foreground italic">{typingNames.join(", ")} typing…</div>}
              <MessageComposerV2 onSend={handleSend} placeholder={`Message ${community?.name || "community"}…`} replyTo={replyTo} onCancelReply={() => setReplyTo(null)} onTyping={(v) => presence.setTyping(`room:${room.id}`, v)} onFocus={scrollToEnd} />
            </>
          ) : (
            <div className="border-t border-border bg-background/60 px-4 py-3 text-center text-sm text-muted-foreground flex items-center justify-center gap-2 mist-safe-bottom">
              {meMuted && <VolumeX className="w-4 h-4" />}
              {meMuted ? "You are muted — read-only until the mute is lifted." : room?.type === "readonly" ? "This conversation is read-only." : "You cannot post here."}
            </div>
          )}
        </>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto">
          {tab === "media" && <MediaView community={community} room={room} />}
          {tab === "members" && <MembersView members={members} presenceByUser={presence.presenceByUser} />}
          {tab === "events" && <EventsView community={community} />}
          {tab === "pinned" && <PinnedView community={community} room={room} onJump={scrollToMessage} />}
          {tab === "files" && <FilesView community={community} room={room} />}
        </div>
      )}
    </div>
  );
}

function DaySep({ date }) {
  return <div className="flex justify-center my-3"><span className="text-[11px] font-medium text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full">{formatDayLabel(date)}</span></div>;
}