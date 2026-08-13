// scrollToBottom — pins the chat view to the newest message. Sets scrollTop
// (always instant regardless of CSS scroll-behavior) and scrolls a bottom
// sentinel into view as a secondary nudge. The caller handles retries (rAF +
// staggered timeouts) to catch async content layout (images, markdown).
export function scrollToBottom(container, sentinel) {
  if (container) container.scrollTop = container.scrollHeight;
  if (sentinel) sentinel.scrollIntoView({ block: "end", behavior: "instant" });
}