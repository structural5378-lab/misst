import React, { useState } from 'react';
import { useCommunity } from '@/contexts/CommunityContext';
import { mist } from '@/api/mist';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { Save, Loader2 } from 'lucide-react';

function parseList(v) {
  if (!v) return '';
  try {
    const a = JSON.parse(v);
    return Array.isArray(a) ? a.join(', ') : '';
  } catch {
    return '';
  }
}
function parseLines(v) {
  if (!v) return '';
  try {
    const a = JSON.parse(v);
    return Array.isArray(a) ? a.join('\n') : '';
  } catch {
    return '';
  }
}
function parseNet(v) {
  if (!v) return {};
  try {
    return JSON.parse(v);
  } catch {
    return {};
  }
}

const CATEGORIES = ['radio', 'technology', 'social', 'gaming', 'education', 'sports', 'music', 'professional', 'hobby', 'other'];
const JOIN_MODES = [
  { value: 'open', label: 'Open — anyone can join' },
  { value: 'request', label: 'Request — requires approval' },
  { value: 'invite', label: 'Invite Only — invite code required' },
  { value: 'closed', label: 'Closed — no new members' },
];
const DEFAULT_ROLES = [
  { value: 'member', label: 'Member' },
  { value: 'trusted_member', label: 'Trusted Member' },
  { value: 'net_control', label: 'Net Control' },
  { value: 'moderator', label: 'Moderator' },
];

export default function CommunitySettingsEditor() {
  const { community, settings } = useCommunity();
  const qc = useQueryClient();
  const { toast } = useToast();

  const netDef = parseNet(settings?.net_schedule_defaults);
  const [form, setForm] = useState({
    name: community.name || '',
    description: community.description || '',
    logo_url: community.logo_url || '',
    banner_url: community.banner_url || '',
    category: community.category || '',
    accent_color: community.accent_color || '#06B6D4',
    primary_color: community.primary_color || '#8B5CF6',
    visibility: community.visibility || 'private',
    join_mode: settings?.join_mode || 'invite',
    auto_approve: !!settings?.auto_approve,
    default_member_role: settings?.default_member_role || 'member',
    welcome_message: settings?.welcome_message || '',
    community_rules: settings?.community_rules || '',
    tags: parseList(settings?.tags),
    website: settings?.website || '',
    social_links: parseLines(settings?.social_links),
    contact_info: settings?.contact_info || '',
    default_rooms: parseList(settings?.default_rooms),
    net_default_frequency: netDef.frequency != null ? String(netDef.frequency) : '',
    net_default_time: netDef.time || '',
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const buildUpdates = () => {
    const tags = form.tags.split(',').map((s) => s.trim()).filter(Boolean);
    const rooms = form.default_rooms.split(',').map((s) => s.trim()).filter(Boolean);
    const social = form.social_links.split('\n').map((s) => s.trim()).filter(Boolean);
    const netDefaults = {};
    if (form.net_default_frequency) netDefaults.frequency = Number(form.net_default_frequency);
    if (form.net_default_time) netDefaults.time = form.net_default_time;
    return {
      name: form.name,
      description: form.description,
      logo_url: form.logo_url,
      banner_url: form.banner_url,
      category: form.category,
      accent_color: form.accent_color,
      primary_color: form.primary_color,
      visibility: form.visibility,
      join_mode: form.join_mode,
      auto_approve: form.auto_approve,
      default_member_role: form.default_member_role,
      welcome_message: form.welcome_message,
      community_rules: form.community_rules,
      tags: JSON.stringify(tags),
      website: form.website,
      social_links: JSON.stringify(social),
      contact_info: form.contact_info,
      default_rooms: JSON.stringify(rooms),
      net_schedule_defaults: JSON.stringify(netDefaults),
    };
  };

  const save = async () => {
    setSaving(true);
    try {
      await mist.functions.invoke('updateCommunitySettings', {
        community_id: community.id,
        updates: buildUpdates(),
      });
      qc.invalidateQueries({ queryKey: ['community-by-slug', community.slug] });
      qc.invalidateQueries({ queryKey: ['community-permissions', community.slug] });
      qc.invalidateQueries({ queryKey: ['community-admin-stats', community.id] });
      toast({ title: 'Settings saved', description: 'Community settings updated successfully.' });
    } catch (e) {
      toast({
        title: 'Save failed',
        description: e?.response?.data?.error || e.message || 'Could not save settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full px-3 py-2 rounded-lg bg-card border border-border text-sm text-foreground focus:border-primary outline-none';

  return (
    <div className="space-y-4">
      <Section title="Profile">
        <Field label="Community Name"><input className={inputCls} value={form.name} onChange={(e) => set('name', e.target.value)} /></Field>
        <Field label="Description"><textarea className={inputCls} rows={2} value={form.description} onChange={(e) => set('description', e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Avatar URL"><input className={inputCls} value={form.logo_url} onChange={(e) => set('logo_url', e.target.value)} /></Field>
          <Field label="Banner URL"><input className={inputCls} value={form.banner_url} onChange={(e) => set('banner_url', e.target.value)} /></Field>
        </div>
        <Field label="Category">
          <select className={inputCls} value={form.category} onChange={(e) => set('category', e.target.value)}>
            <option value="">— Select —</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Tags (comma-separated)"><input className={inputCls} value={form.tags} onChange={(e) => set('tags', e.target.value)} placeholder="gmrs, radio, florida" /></Field>
      </Section>

      <Section title="Appearance">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Primary Color"><input type="color" className="w-full h-10 rounded-lg bg-card border border-border cursor-pointer" value={form.primary_color} onChange={(e) => set('primary_color', e.target.value)} /></Field>
          <Field label="Accent Color"><input type="color" className="w-full h-10 rounded-lg bg-card border border-border cursor-pointer" value={form.accent_color} onChange={(e) => set('accent_color', e.target.value)} /></Field>
        </div>
      </Section>

      <Section title="Access & Join">
        <Field label="Visibility">
          <select className={inputCls} value={form.visibility} onChange={(e) => set('visibility', e.target.value)}>
            <option value="public">Public — discoverable in directory</option>
            <option value="private">Private — hidden from directory</option>
          </select>
        </Field>
        <Field label="Join Mode">
          <select className={inputCls} value={form.join_mode} onChange={(e) => set('join_mode', e.target.value)}>
            {JOIN_MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </Field>
        <Toggle label="Require approval to join" checked={!form.auto_approve} onChange={(v) => set('auto_approve', !v)} />
      </Section>

      <Section title="Membership">
        <Field label="Default Member Role">
          <select className={inputCls} value={form.default_member_role} onChange={(e) => set('default_member_role', e.target.value)}>
            {DEFAULT_ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </Field>
        <Field label="Welcome Message"><textarea className={inputCls} rows={2} value={form.welcome_message} onChange={(e) => set('welcome_message', e.target.value)} placeholder="Shown to new members on join" /></Field>
        <Field label="Community Rules"><textarea className={inputCls} rows={3} value={form.community_rules} onChange={(e) => set('community_rules', e.target.value)} /></Field>
        <Field label="Default Chat Rooms (comma-separated)"><input className={inputCls} value={form.default_rooms} onChange={(e) => set('default_rooms', e.target.value)} placeholder="general, announcements" /></Field>
      </Section>

      <Section title="Links & Contact">
        <Field label="Community Website"><input className={inputCls} value={form.website} onChange={(e) => set('website', e.target.value)} placeholder="https://" /></Field>
        <Field label="Social Links (one URL per line)"><textarea className={inputCls} rows={2} value={form.social_links} onChange={(e) => set('social_links', e.target.value)} placeholder="https://facebook.com/..." /></Field>
        <Field label="Contact Information"><textarea className={inputCls} rows={2} value={form.contact_info} onChange={(e) => set('contact_info', e.target.value)} /></Field>
      </Section>

      <Section title="Net Schedule Defaults">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Default Frequency (MHz)"><input type="number" step="0.001" className={inputCls} value={form.net_default_frequency} onChange={(e) => set('net_default_frequency', e.target.value)} /></Field>
          <Field label="Default Start Time"><input className={inputCls} value={form.net_default_time} onChange={(e) => set('net_default_time', e.target.value)} placeholder="8:00 PM EST" /></Field>
        </div>
      </Section>

      <button
        onClick={save}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Settings
      </button>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="p-4 rounded-xl bg-card border border-border space-y-3">
      <h3 className="text-sm font-bold text-foreground">{title}</h3>
      {children}
    </div>
  );
}
function Field({ label, children }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
      {children}
    </div>
  );
}
function Toggle({ label, checked, onChange }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex items-center justify-between w-full py-1">
      <span className="text-sm text-foreground">{label}</span>
      <span className={`w-10 h-6 rounded-full relative transition-colors ${checked ? 'bg-primary' : 'bg-secondary'}`}>
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </span>
    </button>
  );
}