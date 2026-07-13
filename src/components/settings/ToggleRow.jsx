import React from 'react';

export default function ToggleRow({ icon: Icon, label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 border border-border">
      <div className="flex items-center gap-3 min-w-0">
        {Icon && <Icon className="w-5 h-5 text-primary shrink-0" />}
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{label}</p>
          {description && <p className="text-xs text-muted-foreground truncate">{description}</p>}
        </div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
          checked ? 'bg-primary' : 'bg-muted-foreground/30'
        }`}
      >
        <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`} />
      </button>
    </div>
  );
}