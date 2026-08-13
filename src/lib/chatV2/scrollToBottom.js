// scrollToBottom — robust chat scroll-to-bottom.
//
// Chat message bubbles often finish laying out AFTER the initial scroll fires
// (images decode, markdown renders, complex bubble components mount), which
// grows scrollHeight and leaves the view stuck above the newest message.
//
// This scrolls immediately, again on the next animation frame, and once more
// after a short timeout so the latest message is always in view on open and
// on new messages. Safe to call on a null element.
export function scrollToBottom(el) {
  if (!el) return;
  el.scrollTop = el.scrollHeight;
  requestAnimationFrame(() => { el.scrollTop = el.scrollHeight; });
  setTimeout(() => { el.scrollTop = el.scrollHeight; }, 120);
}