import React from 'react';

export default function ProfileBanner({ banner }) {
  if (!banner) return <div className="absolute inset-0 bg-gradient-to-br from-violet-900/40 to-background" />;
  return <div className={`absolute inset-0 ${banner.class}`} />;
}