// scrollToBottom — robust chat scroll-to-bottom.
//
// Prefers scrolling a bottom sentinel element into view (most reliable across
// browsers and flex-layout timing); falls back to setting scrollTop on the
// scroll container. Scrolls now, on the next animation frame, and after a
// short timeout so async content (images, markdown, complex bubbles) that
// shifts layout after paint never leaves the view stuck above the newest
// message. Safe to call with null elements.
export function scrollToBottom(container, sentinel) {
  const run = () => {
    if (sentinel) sentinel.scrollIntoView({ block: "end", behavior: "instant" });
    else if (container) container.scrollTop = container.scrollHeight;
  };
  run();
  requestAnimationFrame(run);
  setTimeout(run, 120);
}