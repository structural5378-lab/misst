import { useEffect, useState } from "react";
import { useMistUser } from "@/hooks/useMistUser";
import { useChatV2Presence } from "@/hooks/useChatV2Presence";
import { useConversationsV2 } from "@/hooks/useConversationsV2";
import { useActiveCommunity } from "@/hooks/useActiveCommunity";
import { useCommunityRooms } from "@/hooks/useCommunityRooms";
import { base44 } from "@/api/base44Client";
import HubNav from "@/components/messages/HubNav";
import HubConversation from "@/components/messages/HubConversation";
import HubContext from "@/components/messages/HubContext";
import HubEmpty from "@/components/messages/HubEmpty";
import MissionControlDock from "@/components/messages/MissionControlDock";
import StartConversationDialog from "@/components/chatV2/StartConversationDialog";

// Messages — the unified MISST messaging hub.
//
// One 3-pane shell (left nav · conversation · context) that merges direct
// messages (ChatV2Conversation) and community channels (ChatV2Room) under a
// single surface, reusing the existing realtime hooks + backend. On wide
// desktop it renders full-bleed (AppLayout drops the app chrome for /messages);
// on mobile it collapses to a single pane inside the normal app shell.
export default function Messages() {
  const { mistUser } = useMistUser();
  const presence = useChatV2Presence(mistUser);
  const { conversations, loading: dmLoading } = useConversationsV2(mistUser?.id);
  const { community, communities, isLoading: commLoading } = useActiveCommunity();

  // sel = { type: 'dm' | 'channel', id, communityId }
  const [sel, setSel] = useState(null);
  const [showStart, setShowStart] = useState(false);
  const [showContext, setShowContext] = useState(false);
  const [navTab, setNavTab] = useState("channels"); // channels | dm | starred

  const [members, setMembers] = useState([]);
  const [myMember, setMyMember] = useState(null);

  const { rooms, memberships, loading: roomsLoading, reload, markRead, updateMembership } =
    useCommunityRooms(community?.id, mistUser);

  // Load active community members + my membership (drives role, mute, canPost).
  useEffect(() => {
    if (!community?.id || !mistUser?.id) { setMembers([]); setMyMember(null); return; }
    let active = true;
    (async () => {
      const m = await base44.entities.CommunityMember
        .filter({ community_id: community.id, status: "active" }, "-joined_date", 500)
        .catch(() => []);
      if (!active) return;
      setMembers(m || []);
      setMyMember((m || []).find((x) => x.user_id === mistUser.id) || null);
    })();
    return () => { active = false; };
  }, [community?.id, mistUser?.id]);

  const myRole = myMember?.role || null;

  // Invalidate a channel selection if its room disappears (community switch).
  useEffect(() => {
    if (sel?.type === "channel" && community && !rooms.find((r) => r.id === sel.id)) setSel(null);
  }, [rooms, community, sel]);

  const selectDM = (conv) => setSel({ type: "dm", id: conv.id, communityId: null });
  const selectChannel = (roomId) => setSel({ type: "channel", id: roomId, communityId: community?.id });
  const onStarted = (id) => { setShowStart(false); setSel({ type: "dm", id, communityId: null }); setNavTab("dm"); };
  const onBack = () => { setSel(null); setShowContext(false); };

  const totalDMUnread = conversations.reduce((n, c) => n + (c.participant?.unread_count || 0), 0);
  const totalChannelUnread = rooms.reduce((n, r) => n + (memberships[r.id]?.unread_count || 0), 0);
  const starredRooms = rooms.filter((r) => memberships[r.id]?.favorite || memberships[r.id]?.pinned);

  const ctxProps = {
    sel, mistUser, community, members, myRole,
    presenceByUser: presence.presenceByUser, conversations, rooms,
  };

  return (
    <div className="h-full xl:h-[100dvh] w-full flex flex-col bg-background text-foreground overflow-hidden">
      <div className="flex-1 min-h-0 flex w-full">
      {/* Left nav */}
      <aside className={`${sel ? "hidden" : "flex"} xl:flex flex-col w-full xl:w-72 shrink-0 border-r border-border bg-card/40 backdrop-blur-xl min-h-0`}>
        <HubNav
          mistUser={mistUser}
          community={community}
          communities={communities}
          commLoading={commLoading}
          rooms={rooms}
          memberships={memberships}
          roomsLoading={roomsLoading}
          reloadRooms={reload}
          conversations={conversations}
          dmLoading={dmLoading}
          presenceByUser={presence.presenceByUser}
          sel={sel}
          navTab={navTab}
          setNavTab={setNavTab}
          onSelectChannel={selectChannel}
          onSelectDM={selectDM}
          onNewMessage={() => setShowStart(true)}
          totalDMUnread={totalDMUnread}
          totalChannelUnread={totalChannelUnread}
          starredRooms={starredRooms}
          myRole={myRole}
          updateMembership={updateMembership}
        />
      </aside>

      {/* Center conversation */}
      <main className={`${sel ? "flex" : "hidden"} xl:flex flex-1 min-w-0 min-h-0 flex-col`}>
        {sel ? (
          <HubConversation
            sel={sel}
            mistUser={mistUser}
            presence={presence}
            conversations={conversations}
            community={community}
            rooms={rooms}
            memberships={memberships}
            members={members}
            myRole={myRole}
            myMember={myMember}
            markRead={markRead}
            updateMembership={updateMembership}
            onBack={onBack}
            onOpenContext={() => setShowContext(true)}
          />
        ) : (
          <HubEmpty onNewMessage={() => setShowStart(true)} />
        )}
      </main>

      {/* Right context (desktop) */}
      <aside className="hidden xl:flex w-80 shrink-0 border-l border-border bg-card/40 backdrop-blur-xl min-h-0">
        {sel && <HubContext {...ctxProps} />}
      </aside>

      {/* Right context (mobile slide-over) */}
      {showContext && sel && (
        <div className="xl:hidden fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm fade-in" onClick={() => setShowContext(false)}>
          <div className="absolute right-0 top-0 bottom-0 w-80 max-w-[85%] bg-card sheet-up" onClick={(e) => e.stopPropagation()}>
            <HubContext {...ctxProps} onClose={() => setShowContext(false)} />
          </div>
        </div>
      )}
      </div>

      <MissionControlDock community={community} />

      <StartConversationDialog open={showStart} onClose={() => setShowStart(false)} onStarted={onStarted} me={mistUser} />
    </div>
  );
}