// activeChatView — module-level tracker for the conversation/community the user
// is currently viewing in the messaging hub. Used by ChatNotificationListener
// to suppress in-app banners for messages the user is already reading live,
// and to auto-mark those notifications as read (so the global badge doesn't
// accumulate while the user is actively in the chat).
//
// Shape: { type: "community" | "dm", communityId?, conversationId?, roomId? }
let activeView = null;

export function setActiveChatView(view) { activeView = view; }
export function getActiveChatView() { return activeView; }
export function clearActiveChatView() { activeView = null; }

export function isViewingCommunity(communityId) {
  return !!activeView && activeView.type === "community" && !!communityId && activeView.communityId === communityId;
}

export function isViewingConversation(conversationId) {
  return !!activeView && activeView.type === "dm" && !!conversationId && activeView.conversationId === conversationId;
}