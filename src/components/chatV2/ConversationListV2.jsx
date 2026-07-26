import { useMemo, useState } from "react";
import { Search, BellOff } from "lucide-react";
import { otherParticipant } from "@/lib/chatV2/chatV2Api";
import { isTypingNow, timeAgo } from "@/lib/chatV2/chatV2Utils";
import PresenceDotV2 from "./PresenceDotV2";
import TypingIndicatorV2 from "./TypingIndicatorV2";
import ConversationListSkeletonV2 from "./ConversationListSkeletonV2";

// ConversationListV2 — premium left rail: instant search, skeleton loaders,
// two-line previews, relative timestamps (now / 5m / 1h / Yesterday / Monday),
// animated unread badges, presence-on-avatar, and muted indicators.
function Avatar({ name, avatar, isGroup }) {
  if (avatar) return <img src={avatar} alt={name} className="w-[52px] h-[52px] rounded-full object-cover" />;
  if (isGroup) return <div className="w-[52px] h-[52px] rounded-full bg-primary/15 text-primary flex items-center justify-center font-semibold text-lg">{(name || "?").slice(0, 1).toUpperCase()}</div>;
  const initials = (name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return <div className="w-[52px] h-[52px] rounded-full bg-secondary flex items-center justify-center text-sm font-semibold text-secondary-foreground">{initials}</div>;
}

export default function ConversationListV2({ conversations, activeId, onSelect, presenceByUser, myId, loading }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const query = q.toLowerCase().trim();
    if (!query) return conversations;
    return conversations.filter(({ participant, conversation }) => {
      const other = otherParticipant(conversation, myId);
      const name = conversation.is_group ? (conversation.name || "Group") : (other.name || "");
      return (name + " " + (conversation.last_message_preview || "")).toLowerCase().includes(query);
    });
  }, [conversations, q, myId]);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="p-3 pb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search conversations"
            aria-label="Search conversations"
            className="w-full rounded-xl bg-secondary/50 border border-border pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      {loading ? (
        <ConversationListSkeletonV2 />
      ) : filtered.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
          {q ? <p className="text-sm">No conversations match “{q}”.</p> : <p className="text-sm">No conversations yet.</p>}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {filtered.map(({ participant, conversation }) => {
            const isActive = conversation.id === activeId;
            const other = otherParticipant(conversation, myId);
            const name = conversation.is_group ? (conversation.name || "Group") : other.name || "Unknown";
            const avatar = conversation.is_group ? conversation.avatar_url : other.avatar;
            const presence = presenceByUser[other.id];
            const unread = participant.unread_count || 0;
            const typing = !conversation.is_group && isTypingNow(presenceByUser[other.id], conversation.id);
            const lastPreview = conversation.last_message_preview
              ? (conversation.last_sender_id === myId
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
                    <span className="absolute -bottom-0.5 -right-0.5"><PresenceDotV2 presence={presence} /></span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-sm text-foreground truncate flex items-center gap-1.5">
                      {name}
                      {participant.muted && <BellOff className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                    </span>
                    <span className="text-[11px] text-muted-foreground shrink-0">{timeAgo(conversation.last_message_at || participant.joined_at)}</span>
                  </div>
                  {typing ? (
                    <div className="mt-0.5"><TypingIndicatorV2 names={[name]} inline /></div>
                  ) : (
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground line-clamp-2 leading-tight">{lastPreview}</span>
                      {unread > 0 && (
                        <span className="shrink-0 ml-2 min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold flex items-center justify-center badge-pulse">{unread > 99 ? "99+" : unread}</span>
                      )}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}