import { mist } from '@/api/mist';
// aiCache.js — reduces Base44 integration credit consumption.
// AI responses are cached (24h default) and rapid repeat requests are
// deduped (30s window) so the same question never triggers two integration
// calls. Cache is localStorage-backed and keyed by a caller-supplied string.
//
// Usage:
//   const answer = await withAiCache(`summary-${id}-${count}`, async () => {
//     const res = await mist.integrations.Core.InvokeLLM({ prompt });
//     return res.summary;
//   });

const DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours
const DEDUPE_WINDOW = 30 * 1000; // 30 seconds

// In-flight promises keyed by cache key — concurrent/repeat callers within
// the dedupe window share a single integration call.
const inflight = new Map();

export function aiCacheGet(key) {
  try {
    const raw = localStorage.getItem(`mist-ai-${key}`);
    if (!raw) return null;
    const j = JSON.parse(raw);
    if (j && j.v !== undefined && Date.now() - j.ts < (j.ttl || DEFAULT_TTL)) {
      return j.v;
    }
  } catch {}
  return null;
}

export function aiCacheSet(key, value, ttl = DEFAULT_TTL) {
  try {
    localStorage.setItem(`mist-ai-${key}`, JSON.stringify({ v: value, ts: Date.now(), ttl }));
  } catch {}
}

export function aiCacheClear(key) {
  try { localStorage.removeItem(`mist-ai-${key}`); } catch {}
}

/**
 * Returns the cached value for `key` if fresh, otherwise calls `fn`,
 * caches the result, and returns it. Repeat calls within DEDUPE_WINDOW
 * share the in-flight promise (no duplicate integration call).
 */
export async function withAiCache(key, fn, { ttl = DEFAULT_TTL, dedupe = DEDUPE_WINDOW } = {}) {
  const cached = aiCacheGet(key);
  if (cached !== null && cached !== undefined) return cached;

  const now = Date.now();
  const prev = inflight.get(key);
  if (prev && now - prev.ts < dedupe) return prev.promise;

  const promise = Promise.resolve()
    .then(() => fn())
    .then((v) => { aiCacheSet(key, v, ttl); inflight.delete(key); return v; })
    .catch((e) => { inflight.delete(key); throw e; });

  inflight.set(key, { ts: now, promise });
  return promise;
}