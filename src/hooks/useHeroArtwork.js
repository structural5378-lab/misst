import { useEffect, useState, useCallback } from "react";
import { mist } from '@/api/mist';
const TTL = 45 * 24 * 3600 * 1000; // 45-day cache per artwork seed

/** Deterministic, slowly-changing seed so each user gets a unique-but-stable artwork. */
export function heroSeed({ uid, role, level, community }) {
  const levelBucket = (level || 0) >= 30 ? "l3" : (level || 0) >= 15 ? "l2" : "l1";
  const month = new Date().getMonth(); // seasonal variation
  const roleKey = role === "admin" ? "admin" : role === "moderator" ? "mod" : "member";
  return `${uid || "anon"}-${roleKey}-${levelBucket}-${month}`;
}

/** Pick a cinematic scene based on profile attributes. */
export function heroTheme({ role, level, community }) {
  if (role === "admin") return "futuristic command center with holographic tactical displays, deep violet ambiance, glowing control panels and data streams";
  if (role === "moderator") return "tactical radio operations room, dark neon consoles, atmospheric command deck under dim lighting";
  if ((level || 0) >= 30) return "dramatic cosmic nebula, vibrant magenta and electric violet clouds, cinematic deep space vista";
  if ((level || 0) >= 15) return "aurora sky over dark digital terrain, glowing green-violet ribbons of light above a horizon";
  return "purple cosmic landscape, two glowing planets on a horizon line, starry nebula sky";
}

export function heroPrompt(theme, community) {
  return `${theme}.${community ? ` Subtle ${community} motif.` : ""} Cinematic sci-fi environment, deep blacks, electric violet and magenta accents, subtle elegant composition, soft focus with slight blur, premium digital art, atmospheric moody lighting, no text, no people, no logos, no waveforms, no screenshots, 16:9 widescreen, high quality.`;
}

/**
 * Returns a cached hero background URL for the given seed. Does NOT
 * auto-generate on mount — generation is a paid integration call and must be
 * explicitly requested via the returned `regenerate` callback (e.g. a button
 * press). When no cached artwork exists, `url` is null and the caller should
 * render the animated nebula fallback.
 */
export function useHeroArtwork(seed, prompt) {
  const [url, setUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  const readCache = useCallback((s) => {
    try {
      const raw = localStorage.getItem(`mist-hero-${s}`);
      if (raw) {
        const j = JSON.parse(raw);
        if (j.url && Date.now() - j.ts < TTL) return j.url;
      }
    } catch {}
    return null;
  }, []);

  // Cache-only on mount — never trigger GenerateImage on page load.
  useEffect(() => {
    setUrl(readCache(seed));
  }, [seed, readCache]);

  const regenerate = useCallback(async () => {
    setLoading(true);
    try {
      const res = await mist.integrations.Core.GenerateImage({ prompt });
      if (res?.url) {
        setUrl(res.url);
        try { localStorage.setItem(`mist-hero-${seed}`, JSON.stringify({ url: res.url, ts: Date.now() })); } catch {}
      }
    } catch {
      /* leave fallback nebula */
    } finally {
      setLoading(false);
    }
  }, [prompt, seed]);

  return { url, loading, regenerate };
}