import React from 'react';

export default function SegmentedControl({ options, value, onChange }) {
  return (
    <div className="flex gap-1 p-1 rounded-xl bg-secondary border border-border">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
            value === opt.value
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}