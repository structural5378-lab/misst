import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2, MessageSquare } from "lucide-react";
import { useMistMessaging } from "@/hooks/useMistMessaging";
import MistConversationList from "@/components/messages/MistConversationList";
import MistChatView from "@/components/messages/MistChatView";
import MistConversationInfo from "@/components/messages/MistConversationInfo";
import MistNewChatModal from "@/components/messages/MistNewChatModal";

const HEADER_HEIGHT = 37;
const NAV_HEIGHT = 64;

export default function Messages() {
  const messaging = useMistMessaging();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showNewChat, setShowNewChat] = useState(false);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [bottomOffset, setBottomOffset] = useState(
    `calc(${NAV_HEIGHT}px + env(safe-area-inset-bottom))`
  );

  // Handle "new_dm" query param (from MistStartDMButton integration)
  useEffect(() => {
    const newDmUserId = searchParams.get("new_dm");
    if (newDmUserId && messaging.user) {
      const name = searchParams.get("name") || "";
      const avatar = searchParams.get("avatar") || "";
      const callsign = searchParams.get("callsign") || "";
      messaging.createDirectConversation(newDmUserId, name, avatar, callsign).then((convId) => {
        if (convId) {
          messaging.selectConversation(convId);
          setSearchParams({});
        }
      });
    }
  }, [searchParams, messaging.user]);

  // Keyboard handling: keep composer visible above keyboard on mobile
  useEffect(() => {
    const onResize = () => {
      if (window.visualViewport) {
        const keyboardHeight = window.innerHeight - window.visualViewport.height;
        if (keyboardHeight > 50) {
          // Keyboard open — nav is hidden, place bottom at top of keyboard
          setBottomOffset(`${keyboardHeight}px`);
        } else {
          // Keyboard closed — place bottom above nav + safe area
          setBottomOffset(`calc(${NAV_HEIGHT}px + env(safe-area-inset-bottom))`);
        }
      }
    };
    window.visualViewport?.addEventListener('resize', onResize);
    window.visualViewport?.addEventListener('scroll', onResize);
    return () => {
      window.visualViewport?.removeEventListener('resize', onResize);
      window.visualViewport?.removeEventListener('scroll', onResize);
    };
  }, []);

  // Not authenticated via Base44
  if (!messaging.user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
          <MessageSquare className="w-7 h-7 text-muted-foreground" />
        </div>
        <h2 className="text-base font-bold text-foreground">Messages Unavailable</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs">
          MIST Direct Messaging requires a native MIST account. Please log out and sign in with your email to access messages.
        </p>
      </div>
    );
  }

  // Loading state
  if (messaging.loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const hasActive = !!messaging.activeConversationId;

  return (
    <div
      className="fixed left-0 right-0 z-30 flex justify-center overflow-hidden bg-background"
      style={{ top: `${HEADER_HEIGHT}px`, bottom: bottomOffset }}
    >
      <div className="flex w-full h-full max-w-6xl mx-auto overflow-hidden">
        {/* Left: Conversation List */}
        <div className={`${hasActive ? "hidden lg:flex" : "flex"} w-full lg:w-80 lg:border-r border-border flex-col`}>
          <MistConversationList
            conversations={messaging.conversations}
            activeConversationId={messaging.activeConversationId}
            unreadTotal={messaging.unreadTotal}
            onlineUserIds={messaging.onlineUserIds}
            searchQuery={messaging.searchQuery}
            setSearchQuery={messaging.setSearchQuery}
            showArchived={messaging.showArchived}
            setShowArchived={messaging.setShowArchived}
            onSelect={messaging.selectConversation}
            onCompose={() => setShowNewChat(true)}
          />
        </div>

        {/* Center: Chat View */}
        <div className={`${hasActive ? "flex" : "hidden lg:flex"} flex-1 flex-col min-w-0`}>
          <MistChatView
            conversation={messaging.activeConversation}
            messages={messaging.messages}
            messagesLoading={messaging.messagesLoading}
            onlineUserIds={messaging.onlineUserIds}
            typingUsers={messaging.typingUsers}
            currentUserId={messaging.user.id}
            onSend={messaging.sendMessage}
            onTyping={messaging.setTyping}
            onReply={() => {}}
            onEdit={messaging.editMessage}
            onDelete={messaging.deleteMessage}
            onBack={() => messaging.selectConversation(null)}
            onToggleInfo={() => setShowInfoPanel(!showInfoPanel)}
            messageSearchQuery={messaging.messageSearchQuery}
            setMessageSearchQuery={messaging.setMessageSearchQuery}
          />
        </div>

        {/* Right: Info Panel (desktop) */}
        {showInfoPanel && messaging.activeConversation && (
          <div className="hidden lg:flex w-80 border-l border-border">
            <MistConversationInfo
              conversation={messaging.activeConversation}
              onlineUserIds={messaging.onlineUserIds}
              onTogglePin={messaging.togglePin}
              onToggleArchive={messaging.toggleArchive}
              onToggleMute={messaging.toggleMute}
              onBlock={messaging.blockUser}
              onLeave={messaging.leaveConversation}
              isUserBlocked={messaging.isUserBlocked}
            />
          </div>
        )}

        {/* Info Panel (mobile slide-in) */}
        {showInfoPanel && messaging.activeConversation && (
          <div className="lg:hidden fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm" onClick={() => setShowInfoPanel(false)}>
            <div className="absolute right-0 top-0 bottom-0 w-80 max-w-[85%] bg-card" onClick={(e) => e.stopPropagation()}>
              <MistConversationInfo
                conversation={messaging.activeConversation}
                onlineUserIds={messaging.onlineUserIds}
                onTogglePin={messaging.togglePin}
                onToggleArchive={messaging.toggleArchive}
                onToggleMute={messaging.toggleMute}
                onBlock={messaging.blockUser}
                onLeave={messaging.leaveConversation}
                isUserBlocked={messaging.isUserBlocked}
                onBack={() => setShowInfoPanel(false)}
              />
            </div>
          </div>
        )}

        {/* New Chat Modal */}
        {showNewChat && (
          <MistNewChatModal
            onClose={() => setShowNewChat(false)}
            onConversationCreated={messaging.createDirectConversation}
            onGroupCreated={messaging.createGroupConversation}
          />
        )}
      </div>
    </div>
  );
}