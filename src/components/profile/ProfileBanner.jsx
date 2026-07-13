import React from 'react';

export default function ProfileBanner({ banner }) {
  if (!banner) return <div className="absolute inset-0 bg-gradient-to-br from-violet-900/40 to-background" />;

  if (banner.image) {
    return (
      <div className="absolute inset-0 overflow-hidden bg-black">
        <div
          className="absolute inset-0 bg-cover bg-center banner-cat-glow"
          style={{ backgroundImage: `url(${banner.image})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
        <div className="banner-cat-particles absolute inset-0 pointer-events-none">
          {Array.from({ length: 10 }).map((_, i) => (
            <span key={i} className="banner-cat-particle" style={{ left: `${8 + i * 9.5}%`, animationDelay: `${i * 0.6}s` }} />
          ))}
        </div>
        <div className="banner-cat-shimmer absolute inset-0 pointer-events-none" />
      </div>
    );
  }

  return <div className={`absolute inset-0 ${banner.class}`} />;
}