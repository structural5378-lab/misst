import React from "react";
import { useHeroArtwork } from "@/hooks/useHeroArtwork";

/**
 * AI-generated cinematic hero background for profile banners.
 * Unique per user/role/level/season, cached, with an animated nebula
 * fallback while generating. Blurred + gradient overlay for legibility.
 */
export default function HeroArtwork({ seed, prompt }) {
  const { url, loading } = useHeroArtwork(seed, prompt);

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
          style={{ opacity: loading ? 0 : 1, filter: "blur(2px)" }}
        />
      )}

      {/* Legibility gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-card via-card/15 to-black/25" />
      <div className="absolute inset-0 bg-gradient-to-br from-violet-950/20 via-transparent to-fuchsia-950/10" />

      {/* Floating particles */}
      <div className="banner-cat-particles absolute inset-0 pointer-events-none">
        {Array.from({ length: 12 }).map((_, i) => (
          <span key={i} className="banner-cat-particle" style={{ left: `${(i * 8 + 4) % 96}%`, animationDelay: `${i * 0.55}s` }} />
        ))}
      </div>
    </div>
  );
}