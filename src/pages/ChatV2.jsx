import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Plus, MessageSquare } from "lucide-react";
import { useMistUser } from "@/hooks/useMistUser";
import { useChatV2Presence } from "@/hooks/useChatV2Presence";
import { useConversationsV2 } from "@/hooks/useConversationsV2";
import ConversationListV2 from "@/components/chatV2/ConversationListV2";
import ChatWindowV2 from "@/components/chatV2/ChatWindowV2";
import ChatV2EmptyState from "@/components/chatV2/ChatV2EmptyState";
import StartConversationDialog from "@/components/chatV2/StartConversationDialog";
import ConnectionBannerV2 from "@/components/chatV2/ConnectionBannerV2";

// ChatV2 — the new real-time messaging surface. Coexists with the legacy
// Messages page (/messages); reachable at /chat-v2 for independent testing.
//
// Layout: two-pane on desktop, single-pane (list <-> window) on mobile.
export default function ChatV2() {
  const { mistUser } = useMistUser();
  const { conversationId: urlId } = useParams();
  const navigate = useNavigate();

  const [activeId, setActiveId] = useState(urlId || null);
  const [showStart, setShowStart] = useState(false);

  // Keep local activeId in sync with the URL.
  useEffect(() => { setActiveId(urlId || null); }, [urlId]);

  const presence = useChatV2Presence(mistUser);
  const { conversations, loading } = useConversationsV2(mistUser?.id);

  const activeConversation = conversations.find((c) => c.conversation.id === activeId)?.conversation || null;

  const select = (conv) => {
    setActiveId(conv.id);
    navigate(`/chat-v2/${conv.id}`, { replace: true });
  };

  const onStarted = (id) => {
    navigate(`/chat-v2/${id}`, { replace: true });
  };

  const showWindow = !!activeId;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top bar */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-background/80 backdrop-blur sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-semibold leading-tight">Messages</h1>
            <p className="text-[11px] text-muted-foreground leading-tight">Chat V2 · real-time</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <ConnectionBannerV2 online={presence.online} reconnecting={presence.reconnecting} />
          <button
            onClick={() => setShowStart(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> New chat
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Conversation list — hidden on mobile when a window is open */}
        <aside className={`${showWindow ? "hidden md:flex" : "flex"} flex-col w-full md:w-80 md:border-r border-border bg-card/30 min-h-0`}>
          {loading ? (
            <div className="flex-1 flex items-center justify-center"><div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
          ) : (
            <ConversationListV2
              conversations={conversations}
              activeId={activeId}
              onSelect={select}
              presenceByUser={presence.presenceByUser}
              myId={mistUser?.id}
            />
          )}
        </aside>

        {/* Chat window */}
        <main className={`${showWindow ? "flex" : "hidden md:flex"} flex-1 min-w-0 flex-col min-h-0`}>
          {showWindow && activeConversation ? (
            <ChatWindowV2
              conversationId={activeId}
              conversation={activeConversation}
              user={mistUser}
              presenceByUser={presence.presenceByUser}
              setTyping={presence.setTyping}
              setActiveConversation={presence.setActiveConversation}
              online={presence.online}
              reconnecting={presence.reconnecting}
              onBack={() => { setActiveId(null); navigate("/chat-v2", { replace: true }); }}
            />
          ) : (
            <ChatV2EmptyState onNewChat={() => setShowStart(true)} />
          )}
        </main>
      </div>

      <StartConversationDialog
        open={showStart}
        onClose={() => setShowStart(false)}
        onStarted={onStarted}
        me={mistUser}
      />
    </div>
  );
}