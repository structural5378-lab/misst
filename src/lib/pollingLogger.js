// pollingLogger — dev/debug tool that logs every polling fetch so unnecessary
// background traffic can be identified and eliminated.
//
// Gated behind localStorage flag `mist_debug_polling` so it produces zero
// overhead in production. Enable in the browser console:
//   localStorage.setItem('mist_debug_polling', '1')
// then reload. A rolling count per query key is kept and printed.
//
// Call startPollingLogger(queryClient) once at app startup.
export function startPollingLogger(queryClient) {
  if (typeof window === "undefined") return () => {};
  if (!localStorage.getItem("mist_debug_polling")) return () => {};

  const cache = queryClient.getQueryCache();
  const counts = new Map();
  const lastSeen = new Map();

  const unsub = cache.subscribe((event) => {
    if (event?.type !== "updated") return;
    const q = event.query;
    if (!q) return;
    // Only log queries that have a refetchInterval (i.e. pollers).
    const isPolling = (q.observers || []).some((o) => o.options?.refetchInterval);
    if (!isPolling) return;
    const key = JSON.stringify(q.queryKey);
    const now = Date.now();
    const last = lastSeen.get(key) || 0;
    const n = (counts.get(key) || 0) + 1;
    counts.set(key, n);
    lastSeen.set(key, now);
    console.debug(
      `[poll] ${key} · #${n} · gap ${last ? now - last + "ms" : "first"} · ${q.state.status}`
    );
  });

  // Print a summary every 30s while enabled.
  const summary = setInterval(() => {
    if (!counts.size) return;
    console.groupCollapsed?.(`[poll] 30s summary — ${counts.size} polling keys`);
    for (const [k, n] of counts) console.debug(`  ${n}× ${k}`);
    console.groupEnd?.();
    counts.clear();
  }, 30000);

  return () => { unsub(); clearInterval(summary); };
}