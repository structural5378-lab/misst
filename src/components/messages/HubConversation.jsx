import { base44 } from "@/api/base44Client";
import ChatWindowV2 from "@/components/chatV2/ChatWindowV2";
import ChannelWindow from "@/components/messages/ChannelWindow";

// HubConversation — center pane dispatcher. Routes to the DM window
// (ChatWindowV2) for direct messages and the channel window (ChannelWindow)
// for community rooms, wiring the right realtime hooks + context for each.
export default function HubConversation({
  sel, mistUser, presence, conversations, community, rooms, memberships,
  members, myRole, myMember, markRead, updateMembership, onBack, onOpenContext,
}) {
  if (sel?.type === "dm") {
    const entry = conversations.find((c) => c.conversation.id === sel.id);
    if (!entry) {
      return <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">Conversation not found.</div>;
    }
    return (
      <ChatWindowV2
        conversationId={sel.id}
        conversation={entry.conversation}
        participant={entry.participant}
        user={mistUser}
        presenceByUser={presence.presenceByUser}
        setTyping={presence.setTyping}
        setActiveConversation={presence.setActiveConversation}
        online={presence.online}
        reconnecting={presence.reconnecting}
        onBack={onBack}
        onToggleMute={async () => {
          try {
            await base44.entities.ChatV2Participant.update(entry.participant.id, { muted: !entry.participant.muted });
          } catch {}
        }}
        onOpenInfo={onOpenContext}
        forceBack
      />
    );
  }

  if (sel?.type === "channel") {
    const room = rooms.find((r) => r.id === sel.id);
    if (!room) {
      return <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">Channel not found.</div>;
    }
    return (
      <ChannelWindow
        room={room}
        community={community}
        user={mistUser}
        members={members}
        myRole={myRole}
        myMember={myMember}
        presence={presence}
        membership={memberships[room.id]}
        markRead={markRead}
        updateMembership={updateMembership}
        onBack={onBack}
        onOpenInfo={onOpenContext}
      />
    );
  }
  return null;
}