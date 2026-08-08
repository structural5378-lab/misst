import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Gift, Users, Sparkles, X } from 'lucide-react';
import PremiumBadge, { PREMIUM_ICON_MAP } from '@/components/premium/PremiumBadge';
import PremiumBadgeAnalytics from '@/components/premium/PremiumBadgeAnalytics';
import UserSearchPicker from '@/components/platform/badges/UserSearchPicker';
import AdminSection from '@/components/platform/AdminSection';

const RARITIES = ['member', 'supporter', 'community', 'rare', 'epic', 'elite', 'mythic', 'legendary', 'administration'];
const EFFECTS = ['static_glow', 'electric_aura', 'purple_lightning', 'blue_plasma', 'gold_energy_pulse', 'green_radar_sweep', 'fire_ember', 'ice_frost', 'rainbow_prism', 'thunder_storm', 'neon_pulse', 'electric_sparks', 'fire_aura', 'ice_crystal', 'shadow_mist', 'galaxy_swirl', 'cosmic_dust', 'orbit_rings', 'meteor_trail'];

const DEFAULT_BADGES = [
  { name: 'MISST ELITE', description: 'The ultimate MISST status badge with thunderstorm effects.', price: 99.99, icon: 'Crown', rarity: 'legendary', effect: 'thunder_storm', accent_color: '#fbbf24', display_priority: 100, is_best_value: true },
  { name: 'PLATINUM', description: 'Platinum-tier badge with blue plasma energy.', price: 59.99, icon: 'Diamond', rarity: 'mythic', effect: 'blue_plasma', accent_color: '#94a3b8', display_priority: 90 },
  { name: 'GOLD LEGEND', description: 'Gold energy pulse for legendary operators.', price: 39.99, icon: 'Shield', rarity: 'elite', effect: 'gold_energy_pulse', accent_color: '#fbbf24', display_priority: 80 },
  { name: 'PURPLE LEGEND', description: 'Purple lightning aura for distinguished members.', price: 29.99, icon: 'Sparkles', rarity: 'epic', effect: 'purple_lightning', accent_color: '#a855f7', display_priority: 70 },
  { name: 'NET COMMANDER', description: 'Electric aura for net control operators.', price: 24.99, icon: 'Radio', rarity: 'rare', effect: 'electric_aura', accent_color: '#3b82f6', display_priority: 60 },
  { name: 'REPEATER OWNER', description: 'Green radar sweep for repeater operators.', price: 19.99, icon: 'Wifi', rarity: 'community', effect: 'green_radar_sweep', accent_color: '#22c55e', display_priority: 50 },
  { name: 'EMERGENCY OPS', description: 'Fire ember effect for emergency responders.', price: 24.99, icon: 'Siren', rarity: 'rare', effect: 'fire_ember', accent_color: '#ef4444', display_priority: 55 },
  { name: 'TRAVELER', description: 'Gold energy pulse for the roaming operator.', price: 39.99, icon: 'Mountain', rarity: 'elite', effect: 'gold_energy_pulse', accent_color: '#f59e0b', display_priority: 75 },
  { name: 'DX HUNTER', description: 'Blue plasma for long-distance signal hunters.', price: 29.99, icon: 'Radar', rarity: 'epic', effect: 'blue_plasma', accent_color: '#06b6d4', display_priority: 65 },
  { name: 'BUILDER', description: 'Gold energy pulse for community builders.', price: 19.99, icon: 'Wrench', rarity: 'community', effect: 'gold_energy_pulse', accent_color: '#f97316', display_priority: 45 },
  { name: 'CHAT PRO', description: 'Blue plasma for the conversation champion.', price: 24.99, icon: 'MessageSquare', rarity: 'rare', effect: 'blue_plasma', accent_color: '#3b82f6', display_priority: 58 },
  { name: 'RISING STAR', description: 'Soft glow for up-and-coming members.', price: 9.99, icon: 'Star', rarity: 'supporter', effect: 'static_glow', accent_color: '#60a5fa', display_priority: 40 },
];

const EMPTY = { name: '', description: '', price: 0, icon: 'Award', rarity: 'member', effect: 'static_glow', accent_color: '#a855f7', display_priority: 0, is_enabled: true, is_featured: false, is_best_value: false, is_seasonal: false, season_start: '', season_end: '', is_founder: false, is_event: false, is_hidden: false, release_date: '', expiration_date: '', edition_size: 0, purchase_limit: 0 };

export default function PlatformAdminPremiumBadges() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null); // badge or EMPTY for new
  const [grant, setGrant] = useState(null); // badge to grant
  const [ownersBadge, setOwnersBadge] = useState(null);
  const [grantUser, setGrantUser] = useState(null);

  const { data: badges = [], isLoading } = useQuery({
    queryKey: ['admin-premium-badges'],
    queryFn: () => base44.entities.PremiumBadge.list('-display_priority', 100),
  });

  const { data: owners = [] } = useQuery({
    queryKey: ['premium-badge-owners', ownersBadge?.id],
    queryFn: () => base44.entities.PremiumBadgeOwnership.filter({ badge_id: ownersBadge.id }, '-purchased_at', 50),
    enabled: !!ownersBadge,
  });

  const save = async () => {
    try {
      if (editing.id) {
        await base44.entities.PremiumBadge.update(editing.id, editing);
        toast({ title: 'Badge updated' });
      } else {
        await base44.entities.PremiumBadge.create(editing);
        toast({ title: 'Badge created' });
      }
      setEditing(null);
      qc.invalidateQueries({ queryKey: ['admin-premium-badges'] });
      qc.invalidateQueries({ queryKey: ['premium-badges'] });
    } catch (e) { toast({ title: 'Save failed', description: e.message, variant: 'destructive' }); }
  };

  const remove = async (b) => {
    if (!confirm(`Delete "${b.name}"? This cannot be undone.`)) return;
    try { await base44.entities.PremiumBadge.delete(b.id); qc.invalidateQueries({ queryKey: ['admin-premium-badges'] }); qc.invalidateQueries({ queryKey: ['premium-badges'] }); toast({ title: 'Badge deleted' }); }
    catch (e) { toast({ title: 'Delete failed', description: e.message, variant: 'destructive' }); }
  };

  const toggle = async (b) => {
    try { await base44.entities.PremiumBadge.update(b.id, { is_enabled: !b.is_enabled }); qc.invalidateQueries({ queryKey: ['admin-premium-badges'] }); qc.invalidateQueries({ queryKey: ['premium-badges'] }); }
    catch (e) { toast({ title: 'Toggle failed', description: e.message, variant: 'destructive' }); }
  };

  const seedDefaults = async () => {
    try {
      const existing = new Set(badges.map((b) => b.name));
      const toCreate = DEFAULT_BADGES.filter((b) => !existing.has(b.name));
      if (!toCreate.length) { toast({ title: 'All default badges already exist' }); return; }
      await base44.entities.PremiumBadge.bulkCreate(toCreate);
      qc.invalidateQueries({ queryKey: ['admin-premium-badges'] });
      qc.invalidateQueries({ queryKey: ['premium-badges'] });
      toast({ title: `Seeded ${toCreate.length} default badges` });
    } catch (e) { toast({ title: 'Seed failed', description: e.message, variant: 'destructive' }); }
  };

  const doGrant = async () => {
    try {
      const b = grant;
      // Clear any currently-active badge for this recipient so the granted one
      // becomes their active (displayed) badge immediately.
      const prior = await base44.entities.PremiumBadgeOwnership.filter({ user_id: grantUser.id, is_active: true });
      if (prior?.length) {
        await base44.entities.PremiumBadgeOwnership.bulkUpdate(prior.map((o) => ({ id: o.id, is_active: false })));
      }
      await base44.entities.PremiumBadgeOwnership.create({
        user_id: grantUser.id, user_name: grantUser.full_name || grantUser.mybb_username || '',
        badge_id: b.id, badge_name: b.name, badge_icon: b.icon, badge_artwork_url: b.artwork_url,
        badge_effect: b.effect, badge_accent_color: b.accent_color, badge_rarity: b.rarity,
        is_active: true, is_gift: true, gifted_by: '', is_earned: true,
        purchased_at: new Date().toISOString(), status: 'active',
      });
      qc.invalidateQueries({ queryKey: ['active-badge'] });
      qc.invalidateQueries({ queryKey: ['active-badges'] });
      qc.invalidateQueries({ queryKey: ['premium-badge-ownership'] });
      qc.invalidateQueries({ queryKey: ['premium-badge-owners'] });
      toast({ title: 'Badge granted', description: `${grantUser.full_name || grantUser.email} now displays ${b.name}.` });
      setGrant(null); setGrantUser(null);
    } catch (e) { toast({ title: 'Grant failed', description: e.message, variant: 'destructive' }); }
  };

  const set = (k, v) => setEditing((f) => ({ ...f, [k]: v }));

  return (
    <AdminSection title="Premium Badges" description="Create, edit, price, and grant premium badges.">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-muted-foreground">{badges.length} badges · {badges.filter(b => b.is_enabled).length} live</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={seedDefaults} className="text-xs"><Sparkles className="w-3.5 h-3.5 mr-1" /> Seed Defaults</Button>
          <Button size="sm" onClick={() => setEditing({ ...EMPTY })} className="text-xs"><Plus className="w-3.5 h-3.5 mr-1" /> New Badge</Button>
        </div>
      </div>

      <PremiumBadgeAnalytics badges={badges} />

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {badges.map((b) => (
            <div key={b.id} className="rounded-xl bg-card border border-border p-3 flex items-center gap-3">
              <PremiumBadge badge={b} size="md" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{b.name}</p>
                <p className="text-[11px] text-muted-foreground capitalize">{b.rarity} · ${Number(b.price || 0).toFixed(2)}/yr · {b.purchases_count || 0} sold</p>
                <div className="flex gap-1.5 mt-1.5">
                  <button onClick={() => setEditing({ ...b })} className="p-1 rounded hover:bg-secondary text-muted-foreground" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => remove(b)} className="p-1 rounded hover:bg-secondary text-destructive" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setGrant(b)} className="p-1 rounded hover:bg-secondary text-emerald-400" title="Grant"><Gift className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setOwnersBadge(b)} className="p-1 rounded hover:bg-secondary text-sky-400" title="Owners"><Users className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <Switch checked={b.is_enabled} onCheckedChange={() => toggle(b)} />
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit dialog */}
      {editing && (
        <Dialog open onOpenChange={(o) => !o && setEditing(null)}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing.id ? 'Edit Badge' : 'New Badge'}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Name</Label><Input value={editing.name} onChange={(e) => set('name', e.target.value)} /></div>
              <div><Label>Description</Label><Input value={editing.description} onChange={(e) => set('description', e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Price (USD/yr)</Label><Input type="number" step="0.01" value={editing.price} onChange={(e) => set('price', Number(e.target.value))} /></div>
                <div><Label>Accent Color</Label><Input type="color" value={editing.accent_color} onChange={(e) => set('accent_color', e.target.value)} className="h-10" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Icon</Label>
                  <select value={editing.icon} onChange={(e) => set('icon', e.target.value)} className="w-full h-10 rounded-md bg-background border border-input px-2 text-sm">
                    {Object.keys(PREMIUM_ICON_MAP).map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div><Label>Rarity</Label>
                  <select value={editing.rarity} onChange={(e) => set('rarity', e.target.value)} className="w-full h-10 rounded-md bg-background border border-input px-2 text-sm capitalize">
                    {RARITIES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Effect</Label>
                  <select value={editing.effect} onChange={(e) => set('effect', e.target.value)} className="w-full h-10 rounded-md bg-background border border-input px-2 text-sm">
                    {EFFECTS.map((ef) => <option key={ef} value={ef}>{ef}</option>)}
                  </select>
                </div>
                <div><Label>Display Priority</Label><Input type="number" value={editing.display_priority} onChange={(e) => set('display_priority', Number(e.target.value))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Edition Size (0 = ∞)</Label><Input type="number" value={editing.edition_size} onChange={(e) => set('edition_size', Number(e.target.value))} /></div>
                <div><Label>Release Date</Label><Input type="date" value={editing.release_date || ''} onChange={(e) => set('release_date', e.target.value)} /></div>
              </div>
              <div><Label>Expiration Date (retires from sale)</Label><Input type="date" value={editing.expiration_date || ''} onChange={(e) => set('expiration_date', e.target.value)} /></div>
              <div className="flex flex-wrap gap-4 pb-2">
                <label className="flex items-center gap-2 text-sm"><Switch checked={!!editing.is_featured} onCheckedChange={(v) => set('is_featured', v)} /> Featured</label>
                <label className="flex items-center gap-2 text-sm"><Switch checked={!!editing.is_founder} onCheckedChange={(v) => set('is_founder', v)} /> Founder</label>
                <label className="flex items-center gap-2 text-sm"><Switch checked={!!editing.is_event} onCheckedChange={(v) => set('is_event', v)} /> Event</label>
                <label className="flex items-center gap-2 text-sm"><Switch checked={!!editing.is_hidden} onCheckedChange={(v) => set('is_hidden', v)} /> Hidden</label>
              </div>
              <div><Label>Artwork URL (optional — overrides icon)</Label><Input value={editing.artwork_url || ''} onChange={(e) => set('artwork_url', e.target.value)} placeholder="https://..." /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Purchase Limit (0 = ∞)</Label><Input type="number" value={editing.purchase_limit} onChange={(e) => set('purchase_limit', Number(e.target.value))} /></div>
                <div className="flex items-end gap-4 pb-2">
                  <label className="flex items-center gap-2 text-sm"><Switch checked={!!editing.is_best_value} onCheckedChange={(v) => set('is_best_value', v)} /> Best Value</label>
                  <label className="flex items-center gap-2 text-sm"><Switch checked={!!editing.is_seasonal} onCheckedChange={(v) => set('is_seasonal', v)} /> Seasonal</label>
                </div>
              </div>
              {editing.is_seasonal && (
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Season Start</Label><Input type="date" value={editing.season_start || ''} onChange={(e) => set('season_start', e.target.value)} /></div>
                  <div><Label>Season End</Label><Input type="date" value={editing.season_end || ''} onChange={(e) => set('season_end', e.target.value)} /></div>
                </div>
              )}
              <div className="flex justify-center pt-1"><PremiumBadge badge={editing} size="xl" /></div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
              <Button onClick={save} disabled={!editing.name}>{editing.id ? 'Save' : 'Create'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Grant dialog */}
      {grant && (
        <Dialog open onOpenChange={(o) => !o && setGrant(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Grant "{grant.name}"</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30">
                <PremiumBadge badge={grant} size="md" />
                <div>
                  <p className="text-sm font-semibold">{grant.name}</p>
                  <p className="text-[11px] text-muted-foreground capitalize">{grant.rarity} badge</p>
                </div>
              </div>
              <div><Label>Recipient</Label>
                <UserSearchPicker selected={grantUser} onSelect={(u) => setGrantUser(u)} />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
              <Button onClick={doGrant} disabled={!grantUser}>Grant</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Owners dialog */}
      {ownersBadge && (
        <Dialog open onOpenChange={(o) => !o && setOwnersBadge(null)}>
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Owners of "{ownersBadge.name}"</DialogTitle></DialogHeader>
            {owners.length === 0 ? <p className="text-sm text-muted-foreground py-4 text-center">No owners yet.</p> : (
              <div className="space-y-2">
                {owners.map((o) => (
                  <div key={o.id} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/40">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{o.user_name || o.user_id}</p>
                      <p className="text-[10px] text-muted-foreground">{o.status} · {o.is_gift ? 'gifted' : 'purchased'} {o.is_active && '· active'}</p>
                    </div>
                    {o.expires_at && <span className="text-[10px] text-muted-foreground">{new Date(o.expires_at).toLocaleDateString()}</span>}
                  </div>
                ))}
              </div>
            )}
            <DialogFooter><DialogClose asChild><Button variant="ghost">Close</Button></DialogClose></DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </AdminSection>
  );
}