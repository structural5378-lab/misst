import React from 'react';
import { Check } from 'lucide-react';

export default function ThemePreviewCard({ theme, isSelected, onSelect }) {
  const { bg, card, primary, accent, fg } = theme.preview;
  return (
    <button
      onClick={() => onSelect(theme.id)}
      className={`relative p-2.5 rounded-xl border-2 transition-all overflow-hidden ${
        isSelected ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:border-primary/50'
      }`}
      style={{ background: bg }}
    >
      {isSelected && (
        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center z-10">
          <Check className="w-3 h-3 text-primary-foreground" />
        </div>
      )}
      <div className="rounded-lg p-2.5 mb-2" style={{ background: card }}>
        <div className="h-2 w-10 rounded-full mb-1.5" style={{ background: primary }} />
        <div className="h-1.5 w-16 rounded-full mb-1" style={{ background: accent, opacity: 0.6 }} />
        <div className="flex gap-1 mt-1.5">
          <div className="h-4 w-8 rounded-md" style={{ background: primary }} />
          <div className="h-4 w-5 rounded-md border" style={{ background: 'transparent', borderColor: accent }} />
        </div>
      </div>
      <p className="text-xs font-bold truncate" style={{ color: fg }}>{theme.name}</p>
      <p className="text-[9px] truncate" style={{ color: fg, opacity: 0.5 }}>{theme.description}</p>
    </button>
  );
}