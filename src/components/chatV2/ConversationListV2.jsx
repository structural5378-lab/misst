import { otherParticipant } from "@/lib/chatV2/chatV2Api";
import { isTypingNow, presenceStatus, timeAgo } from "@/lib/chatV2/chatV2Utils";
import PresenceDotV2 from "./PresenceDotV2";
import TypingIndicatorV2 from "./TypingIndicatorV2";

// ConversationListV2 — the left rail. Each row shows the other participant
// (DM) or group name, last message preview, timestamp, unread badge, live
// presence, and an inline typing indicator when that peer is typing here.
function Avatar({ name, avatar, isGroup }) {
  if (avatar) return <img src={avatar} alt={name} className="w-12 h-12 rounded-full object-cover" />;
  if (isGroup) {
    return <div className="w-12 h-12 rounded-full bg-primary/15 text-primary flex items-center justify-center font-semibold">{(name || "?").slice(0, 1).toUpperCase()}</div>;
  }
  const initials = (name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-sm font-semibold text-secondary-foreground">{initials}</div>;
}

export default function ConversationListV2({ conversations, activeId, onSelect, presenceByUser, myId }) {
  if (!conversations.length) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
        <p className="text-sm">No conversations yet.</p>
        <p className="text-xs mt-1">Start a new chat to begin messaging.</p>
      </div>
    );
  }
  return (
    <div className="flex-1 overflow-y-auto">
      {conversations.map(({ participant, conversation }) => {
        const isActive = conversation.id === activeId;
        const other = otherParticipant(conversation, myId);
        const name = conversation.is_group ? (conversation.name || "Group") : other.name || "Unknown";
        const avatar = conversation.is_group ? conversation.avatar_url : other.avatar;
        const presence = presenceByUser[other.id];
        const unread = participant.unread_count || 0;
        const typing = conversation.is_group ? false : isTypingNow(presenceByUser[other.id], conversation.id);
        const lastPreview = conversation.last_message_preview
          ? (conversation.last_sender_name && !conversation.is_group && conversation.last_sender_id === myId
              ? `You: ${conversation.last_message_preview}`
              : conversation.is_group
                ? `${conversation.last_sender_name || ""}: ${conversation.last_message_preview}`
                : conversation.last_message_preview)
          : "Say hello 👋";
        return (
          <button
            key={conversation.id}
            onClick={() => onSelect(conversation)}
            className={`w-full flex items-center gap-3 px-3 py-3 text-left transition-colors border-b border-border/40 ${isActive ? "bg-primary/10" : "hover:bg-muted/30"}`}
          >
            <div className="relative shrink-0">
              <Avatar name={name} avatar={avatar} isGroup={conversation.is_group} />
              {!conversation.is_group && (
                <span className="absolute -bottom-0.5 -right-0.5">
                  <PresenceDotV2 presence={presence} />
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-sm text-foreground truncate">{name}</span>
                <span className="text-[11px] text-muted-foreground shrink-0">{timeAgo(conversation.last_message_at || participant.joined_at)}</span>
              </div>
              {typing ? (
                <div className="mt-0.5"><TypingIndicatorV2 names={[name]} inline /></div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground truncate">{lastPreview}</span>
                  {unread > 0 && (
                    <span className="shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold flex items-center justify-center">{unread > 99 ? "99+" : unread}</span>
                  )}
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}