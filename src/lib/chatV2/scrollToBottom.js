// scrollToBottom — pins the chat view to the newest message by setting
// scrollTop = scrollHeight (always instant, unaffected by CSS scroll-behavior).
// The caller drives retries via a requestAnimationFrame loop to catch async
// content layout (images, markdown, flex height settling).
export function scrollToBottom(container) {
  if (!container) return;
  container.scrollTop = container.scrollHeight;
}