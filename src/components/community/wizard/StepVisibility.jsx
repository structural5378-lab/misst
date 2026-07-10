import React from 'react';
import { Globe, Lock, Mail } from 'lucide-react';

const OPTIONS = [
  {
    value: 'public',
    icon: Globe,
    title: 'Public',
    description: 'Listed in the community directory. Anyone can find and join freely without approval.',
    badge: 'Open Join'
  },
  {
    value: 'private',
    icon: Lock,
    title: 'Private',
    description: 'Hidden from the public directory. Users can find it via direct link and must request to join. Admins approve requests.',
    badge: 'Request to Join'
  },
  {
    value: 'invite',
    icon: Mail,
    title: 'Invite Only',
    description: 'Completely hidden. New members can only join via an invitation link from an admin. Maximum privacy.',
    badge: 'Invite Required'
  }
];

export default function StepVisibility({ data, update }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground mb-4">
        Choose who can discover and join your community. You can change this later in Admin Settings.
      </p>

      {OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const selected = data.visibility_mode === opt.value;

        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => update({ visibility_mode: opt.value })}
            className={`w-full text-left p-4 rounded-xl border-2 transition-colors ${
              selected
                ? 'border-primary bg-primary/5'
                : 'border-border bg-card hover:border-primary/30'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-foreground">{opt.title}</span>
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground uppercase tracking-wide">
                    {opt.badge}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{opt.description}</p>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center ${
                  selected ? 'border-primary bg-primary' : 'border-border'
                }`}
              >
                {selected && <div className="w-2 h-2 rounded-full bg-primary-foreground" />}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}