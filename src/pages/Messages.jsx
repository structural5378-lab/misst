import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { useMistUser } from "@/hooks/useMistUser";
import { useChatV2Presence } from "@/hooks/useChatV2Presence";
import { useConversationsV2 } from "@/hooks/useConversationsV2";
import { useActiveCommunity } from "@/hooks/useActiveCommunity";
import { useCommunityRooms } from "@/hooks/useCommunityRooms";
import { base44 } from "@/api/base44Client";
import CommunityList from "@/components/messages/v3/CommunityList";
import CommunityConversation from "@/components/messages/v3/CommunityConversation";
import CommunitySections from "@/components/messages/v3/CommunitySections";
import ChatWindowV2 from "@/components/chatV2/ChatWindowV2";
import StartConversationDialog from "@/components/chatV2/StartConversationDialog";
import { startDirectConversation } from "@/lib/chatV2/chatV2Api";

// Messages — the community-first messaging experience. Every community is
// ONE living chat (its primary room) with optional views (Media, Members,
// Events, Pinned, Files) as tabs — not separate channels. Mobile is a
// full-height 100dvh shell where only the message list scrolls; desktop is a
// premium three-column layout (community list · conversation · info panel).
// DMs remain accessible from the left rail.
export default function Messages() {
  const navigate = useNavigate();
  const { mistUser } = useMistUser();
  const presence = useChatV2Presence(mistUser);
  const { conversations, loading: dmLoading, upsertConversation } = useConversationsV2(mistUser?.id);
  const { community, communities, isLoading: commLoading } = useActiveCommunity();
  const { rooms, loading: roomsLoading, markRead } = useCommunityRooms(community?.id, mistUser);

  const [sel, setSel] = useState({ type: "community" });
  const [mobileList, setMobileList] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showStart, setShowStart] = useState(false);

  const [members, setMembers] = useState([]);
  const [myMember, setMyMember] = useState(null);

  useEffect(() => {
    if (!community?.id || !mistUser?.id) { setMembers([]); setMyMember(null); return; }
    let active = true;
    (async () => {
      const m = await base44.entities.CommunityMember.filter({ community_id: community.id, status: "active" }, "-joined_date", 500).catch(() => []);
      if (!active) return;
      setMembers(m || []);
      setMyMember((m || []).find((x) => x.user_id === mistUser.id) || null);
    })();
    return () => { active = false; };
  }, [community?.id, mistUser?.id]);

  const mainRoom = rooms.find((r) => r.type === "text" && !r.is_hidden && !r.is_archived) || rooms[0] || null;
  const myRole = myMember?.role || null;

  // Deep links:
  //   ?c=<communityId>  — select a community chat (from a community_chat
  //                      notification tap).
  //   ?dm=<convId>      — open a specific DM (from a direct_message tap).
  //   ?new_dm=<userId>  — auto-start a DM (from a profile "Message" button).
  useEffect(() => {
    if (!mistUser?.id) return;
    const params = new URLSearchParams(window.location.search);
    const cId = params.get("c");
    const dmId = params.get("dm");
    const newDm = params.get("new_dm");
    if (cId) {
      localStorage.setItem("selected_community_id", cId);
      window.dispatchEvent(new Event("storage"));
      window.history.replaceState({}, "", "/messages");
    } else if (dmId) {
      setSel({ type: "dm", id: dmId });
      window.history.replaceState({}, "", "/messages");
    } else if (newDm) {
      (async () => {
        try { const { conversation, participant } = await startDirectConversation(newDm); upsertConversation(conversation, participant); setSel({ type: "dm", id: conversation.id }); }
        catch { /* silent */ }
      })();
      window.history.replaceState({}, "", "/messages");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mistUser?.id]);

  const selectCommunity = (id) => {
    if (id && id !== community?.id) { localStorage.setItem("selected_community_id", id); window.dispatchEvent(new Event("storage")); }
    setSel({ type: "community" });
    setMobileList(false);
  };
  const selectDM = (conv) => { setSel({ type: "dm", id: conv.id }); setMobileList(false); };
  const onStarted = (conversation, participant) => { setShowStart(false); upsertConversation(conversation, participant); setSel({ type: "dm", id: conversation.id }); };

  const totalDMUnread = conversations.reduce((n, c) => n + (c.participant?.unread_count || 0), 0);
  const dmEntry = sel.type === "dm" ? conversations.find((c) => c.conversation.id === sel.id) : null;

  return (
    <div className="mist-hub h-[100dvh] w-full flex bg-background text-foreground overflow-hidden">
      {/* LEFT — community list (mobile: full screen when mobileList; desktop: always) */}
      <aside className={`${mobileList ? "flex" : "hidden"} xl:flex flex-col w-full xl:w-72 shrink-0 border-r border-border min-h-0`}>
        <CommunityList
          mistUser={mistUser} communities={communities} community={community}
          onSelectCommunity={selectCommunity}
          conversations={conversations} dmLoading={dmLoading} presenceByUser={presence.presenceByUser}
          sel={sel} onSelectDM={selectDM} onNewMessage={() => setShowStart(true)}
          totalDMUnread={totalDMUnread} onBack={() => setMobileList(false)} showBack
        />
      </aside>

      {/* CENTER — conversation or DM */}
      <main className={`${mobileList ? "hidden" : "flex"} xl:flex flex-1 min-w-0 min-h-0 flex-col`}>
        {sel.type === "community" && community ? (
          roomsLoading ? (
            <div className="flex-1 flex items-center justify-center"><div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
          ) : mainRoom ? (
            <CommunityConversation
              community={community} room={mainRoom} mistUser={mistUser} members={members}
              myMember={myMember} myRole={myRole} presence={presence} markRead={markRead}
              onOpenInfo={() => setShowInfo(true)} onBack={() => setMobileList(true)}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground text-center px-6">
              <MessageCircle className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">No conversation available in this community yet.</p>
            </div>
          )
        ) : sel.type === "dm" && dmEntry ? (
          <ChatWindowV2
            conversationId={sel.id} conversation={dmEntry.conversation} participant={dmEntry.participant}
            user={mistUser} presenceByUser={presence.presenceByUser} setTyping={presence.setTyping}
            setActiveConversation={presence.setActiveConversation} online={presence.online} reconnecting={presence.reconnecting}
            onBack={() => setMobileList(true)}
            onToggleMute={async () => { try { await base44.entities.ChatV2Participant.update(dmEntry.participant.id, { muted: !dmEntry.participant.muted }); } catch {} }}
            forceBack
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <MessageCircle className="w-10 h-10 mb-2 opacity-30" />
            <p className="text-sm">Select a community to start chatting.</p>
          </div>
        )}
      </main>

      {/* RIGHT — community info (desktop only) */}
      <aside className="hidden xl:flex flex-col w-80 shrink-0 border-l border-border min-h-0">
        {sel.type === "community" && community ? (
          <CommunitySections community={community} members={members} myRole={myRole} room={mainRoom} presenceByUser={presence.presenceByUser} onOpenSettings={() => navigate(`/c/${community.slug}/admin`)} />
        ) : null}
      </aside>

      {/* Mobile info slide-out */}
      {showInfo && sel.type === "community" && community && (
        <div className="xl:hidden fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm fade-in" onClick={() => setShowInfo(false)}>
          <div className="absolute right-0 top-0 bottom-0 w-80 max-w-[85%] sheet-up flex flex-col" onClick={(e) => e.stopPropagation()}>
            <CommunitySections community={community} members={members} myRole={myRole} room={mainRoom} presenceByUser={presence.presenceByUser} onClose={() => setShowInfo(false)} onOpenSettings={() => navigate(`/c/${community.slug}/admin`)} />
          </div>
        </div>
      )}

      <StartConversationDialog open={showStart} onClose={() => setShowStart(false)} onStarted={onStarted} me={mistUser} />
    </div>
  );
}