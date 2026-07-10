import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Globe, Radio, Cpu, Users, Gamepad2, GraduationCap, Dumbbell, Music, Briefcase, Palette, MoreHorizontal } from 'lucide-react';

export const CATEGORIES = [
  { value: 'radio', label: 'Radio', icon: Radio },
  { value: 'technology', label: 'Technology', icon: Cpu },
  { value: 'social', label: 'Social', icon: Users },
  { value: 'gaming', label: 'Gaming', icon: Gamepad2 },
  { value: 'education', label: 'Education', icon: GraduationCap },
  { value: 'sports', label: 'Sports', icon: Dumbbell },
  { value: 'music', label: 'Music', icon: Music },
  { value: 'professional', label: 'Professional', icon: Briefcase },
  { value: 'hobby', label: 'Hobby', icon: Palette },
  { value: 'other', label: 'Other', icon: MoreHorizontal }
];

export default function StepBasics({ data, update, errors }) {
  const slugify = (val) =>
    val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40);

  const handleNameChange = (e) => {
    const name = e.target.value;
    update({ name });
    // Auto-generate slug only if user hasn't manually edited it
    if (!data._slugManuallyEdited) {
      update({ slug: slugify(name) });
    }
  };

  const handleSlugChange = (e) => {
    update({ slug: slugify(e.target.value), _slugManuallyEdited: true });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="name">Community Name *</Label>
        <Input
          id="name"
          value={data.name}
          onChange={handleNameChange}
          placeholder="e.g. MIST Insomniacs, Code Collective, Bay Area Hikers"
          maxLength={80}
        />
        {errors.name && <p className="text-destructive text-xs mt-1">{errors.name}</p>}
      </div>

      <div>
        <Label htmlFor="slug">Community URL *</Label>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm whitespace-nowrap">/c/</span>
          <Input
            id="slug"
            value={data.slug}
            onChange={handleSlugChange}
            placeholder="my-community"
            className="flex-1 font-mono"
          />
        </div>
        <p className="text-muted-foreground text-xs mt-1">
          Lowercase letters, numbers, and hyphens. 2–40 characters.
        </p>
        {errors.slug && <p className="text-destructive text-xs mt-1">{errors.slug}</p>}
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={data.description}
          onChange={(e) => update({ description: e.target.value })}
          placeholder="What is this community about? Who is it for?"
          rows={3}
          maxLength={500}
        />
        <p className="text-muted-foreground text-xs mt-1 text-right">
          {data.description?.length || 0}/500
        </p>
      </div>

      <div>
        <Label>Category *</Label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const selected = data.category === cat.value;
            return (
              <button
                key={cat.value}
                type="button"
                onClick={() => update({ category: cat.value })}
                className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-colors ${
                  selected
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border bg-card text-muted-foreground hover:border-primary/50'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{cat.label}</span>
              </button>
            );
          })}
        </div>
        {errors.category && <p className="text-destructive text-xs mt-1">{errors.category}</p>}
      </div>

      <div>
        <Label htmlFor="location">Location (optional)</Label>
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
          <Input
            id="location"
            value={data.location}
            onChange={(e) => update({ location: e.target.value })}
            placeholder="City, State or Online"
          />
        </div>
        <p className="text-muted-foreground text-xs mt-1">
          Used for default weather and map center. Leave empty for online-only communities.
        </p>
      </div>
    </div>
  );
}