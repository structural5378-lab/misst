import React from 'react';
import { Globe, Lock, Mail, Check } from 'lucide-react';
import { CATEGORIES } from './StepBasics';

const VISIBILITY_LABELS = {
  public: { label: 'Public', icon: Globe, desc: 'Anyone can join' },
  private: { label: 'Private', icon: Lock, desc: 'Request to join' },
  invite: { label: 'Invite Only', icon: Mail, desc: 'Admin invite only' }
};

const GENERATED_SECTIONS = [
  'Home', 'Chat', 'Forum', 'Members', 'Events',
  'Repeaters', 'Gallery', 'Files', 'Admin'
];

export default function StepReview({ data }) {
  const cat = CATEGORIES.find((c) => c.value === data.category);
  const vis = VISIBILITY_LABELS[data.visibility_mode] || VISIBILITY_LABELS.private;
  const VisIcon = vis.icon;

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Review your community configuration. You can change everything later in Admin Settings.
      </p>

      {/* Banner + Logo Preview */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div
          className="h-24 bg-cover bg-center flex items-center justify-center"
          style={{
            backgroundColor: data.primary_color,
            backgroundImage: data.banner_url ? `url(${data.banner_url})` : undefined
          }}
        >
          {!data.banner_url && (
            <span className="text-white/70 text-xs font-medium">No banner uploaded</span>
          )}
        </div>
        <div className="p-4">
          <div className="flex items-center gap-3">
            {data.logo_url ? (
              <img src={data.logo_url} alt="Logo" className="w-12 h-12 rounded-xl object-cover" />
            ) : (
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold"
                style={{ backgroundColor: data.primary_color }}
              >
                {(data.name || '?').charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-foreground truncate">
                {data.name || 'Community Name'}
              </h3>
              <p className="text-xs text-muted-foreground font-mono">/c/{data.slug}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Details grid */}
      <div className="rounded-xl border border-border divide-y divide-border">
        <ReviewRow label="Name" value={data.name} />
        <ReviewRow label="URL" value={`/c/${data.slug}`} mono />
        <ReviewRow label="Category" value={cat?.label || data.category} />
        <ReviewRow label="Location" value={data.location || 'Online'} />
        <ReviewRow label="Description" value={data.description || 'No description'} />
        <div className="p-3 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Visibility</span>
          <div className="flex items-center gap-1.5">
            <VisIcon className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">{vis.label}</span>
            <span className="text-xs text-muted-foreground">· {vis.desc}</span>
          </div>
        </div>
        <ReviewRow label="Primary Color" value={data.primary_color} colorSwatch={data.primary_color} />
      </div>

      {/* Generated sections */}
      <div>
        <h4 className="text-sm font-bold text-foreground mb-2">Default Sections</h4>
        <p className="text-xs text-muted-foreground mb-3">
          These sections will be created and enabled for your community:
        </p>
        <div className="grid grid-cols-3 gap-2">
          {GENERATED_SECTIONS.map((section) => (
            <div
              key={section}
              className="flex items-center gap-1.5 p-2 rounded-lg bg-card border border-border text-xs"
            >
              <Check className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="text-foreground font-medium">{section}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Role info */}
      <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
        <p className="text-xs text-foreground">
          <span className="font-bold">You will be the Community Owner</span> with full admin
          access to manage members, settings, and all sections.
        </p>
      </div>
    </div>
  );
}

function ReviewRow({ label, value, mono, colorSwatch }) {
  return (
    <div className="p-3 flex items-center justify-between gap-3">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className={`text-sm text-foreground text-right truncate ${mono ? 'font-mono' : ''}`}>
        {colorSwatch && (
          <span
            className="inline-block w-3 h-3 rounded-full mr-1.5 align-middle"
            style={{ backgroundColor: colorSwatch }}
          />
        )}
        {value}
      </span>
    </div>
  );
}