import React from "react";
import { RefreshCw, Loader2 } from "lucide-react";
import { useHeroArtwork } from "@/hooks/useHeroArtwork";

/**
 * AI-generated cinematic hero background for profile banners.
 * Unique per user/role/level/season, cached, with an animated nebula
 * fallback. Generation is opt-in (Regenerate button) so no integration
 * credits are spent on page load. Blurred + gradient overlay for legibility.
 */
export default function HeroArtwork({ seed, prompt }) {
  const { url, loading, regenerate } = useHeroArtwork(seed, prompt);

  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
      {/* Animated nebula fallback (also shows behind while generating) */}
      <div className="absolute inset-0 hero-nebula" />

      {/* Generated artwork */}
      {url && (
        <img
          src={url}
          alt=""
          className="absolute inset-0 w-full h-full object-cover scale-105 transition-opacity duration-700"
          style={{ opacity: loading ? 0 : 1, filter: "blur(4px) brightness(0.82)" }}
        />
      )}

      {/* Legibility gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-card via-card/25 to-black/40" />
      <div className="absolute inset-0 bg-gradient-to-br from-violet-950/20 via-transparent to-fuchsia-950/10" />

      {/* Floating particles */}
      <div className="banner-cat-particles absolute inset-0 pointer-events-none">
        {Array.from({ length: 12 }).map((_, i) => (
          <span key={i} className="banner-cat-particle" style={{ left: `${(i * 8 + 4) % 96}%`, animationDelay: `${i * 0.55}s` }} />
        ))}
      </div>

      {/* Opt-in AI generation — no credits spent until pressed */}
      <button
        onClick={regenerate}
        disabled={loading}
        title={loading ? "Generating banner…" : "Generate a new banner"}
        className="absolute bottom-2 right-2 z-10 flex items-center gap-1 px-2 py-1 rounded-lg bg-black/40 backdrop-blur-md border border-white/10 text-[10px] font-medium text-white/80 hover:bg-black/60 hover:text-white disabled:opacity-50 transition-colors"
      >
        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
        {loading ? "Generating" : "Regenerate"}
      </button>
    </div>
  );
}