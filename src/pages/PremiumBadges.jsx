import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useMistUser } from '@/hooks/useMistUser';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Zap, Star, Gem, ShieldCheck, Crown, Lock, Bolt, RotateCcw, Sparkles, Search, Heart, Gift } from 'lucide-react';
import PremiumBadgeCard from '@/components/premium/PremiumBadgeCard';
import GiftBadgeDialog from '@/components/premium/GiftBadgeDialog';
import BadgePreview from '@/components/premium/BadgePreview';

const INFO_PANEL = [
  { icon: Star, title: 'Show Your Status', desc: 'Premium badges appear next to your name everywhere on MISST.', color: '#a855f7' },
  { icon: Gem, title: 'Support The Network', desc: 'Your purchase helps keep repeaters and nets online.', color: '#22c55e' },
  { icon: ShieldCheck, title: 'Trusted & Verified', desc: 'Secure checkout. Instant activation. Cancel anytime.', color: '#fbbf24' },
];

const FOOTER = [
  { icon: Crown, title: 'Displayed Across MISST', desc: 'Badges show next to your name in chat, nets, and leaderboards.' },
  { icon: ShieldCheck, title: 'Secure Payments', desc: 'All transactions are encrypted and processed by Stripe.' },
  { icon: Bolt, title: 'Instant Activation', desc: 'Your badge is activated the moment your payment clears.' },
  { icon: RotateCcw, title: 'Cancel Anytime', desc: 'Cancel or upgrade your badge subscription at any time.' },
];

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'featured', label: 'Featured' },
  { id: 'best', label: 'Best Sellers' },
  { id: 'new', label: 'New Releases' },
  { id: 'limited', label: 'Limited Editions' },
  { id: 'seasonal', label: 'Seasonal' },
  { id: 'wishlist', label: 'Wishlist' },
];

const RARITIES = ['all', 'member', 'supporter', 'community', 'rare', 'epic', 'elite', 'mythic', 'legendary'];
const SORTS = [
  { id: 'priority', label: 'Featured' },
  { id: 'price_asc', label: 'Price: Low → High' },
  { id: 'price_desc', label: 'Price: High → Low' },
  { id: 'popular', label: 'Most Popular' },
  { id: 'newest', label: 'Newest' },
];

const WISHLIST_KEY = 'premium-wishlist';

export default function PremiumBadges() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { mistUser } = useMistUser();
  const [checkingOut, setCheckingOut] = useState(null);
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [rarity, setRarity] = useState('all');
  const [sort, setSort] = useState('priority');
  const [giftBadge, setGiftBadge] = useState(null);
  const [previewBadge, setPreviewBadge] = useState(null);
  const [wishlist, setWishlist] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]')); } catch { return new Set(); }
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === '1') toast({ title: 'Purchase complete!', description: 'Your premium badge is now active.' });
    if (params.get('canceled') === '1') toast({ title: 'Checkout canceled' });
    if (params.get('success') || params.get('canceled')) window.history.replaceState({}, '', '/premium-badges');
  }, []);

  const { data: badges = [], isLoading } = useQuery({
    queryKey: ['premium-badges'],
    queryFn: () => base44.entities.PremiumBadge.filter({ is_enabled: true, is_hidden: false }, '-display_priority', 200),
  });
  const { data: ownership = [] } = useQuery({
    queryKey: ['premium-badge-ownership'],
    queryFn: () => base44.entities.PremiumBadgeOwnership.filter({ user_id: mistUser?.id, status: 'active' }),
    enabled: !!mistUser?.id,
  });

  const ownedMap = new Map(ownership.map((o) => [o.badge_id, o]));
  const activeId = ownership.find((o) => o.is_active)?.badge_id;

  const toggleWishlist = (id) => {
    setWishlist((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      localStorage.setItem(WISHLIST_KEY, JSON.stringify([...next]));
      return next;
    });
  };

  const filtered = useMemo(() => {
    let list = [...badges];
    // Tab filter
    if (tab === 'featured') list = list.filter((b) => b.is_featured);
    else if (tab === 'best') list = [...list].sort((a, b) => (b.purchases_count || 0) - (a.purchases_count || 0));
    else if (tab === 'new') list = [...list].sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0));
    else if (tab === 'limited') list = list.filter((b) => b.edition_size > 0);
    else if (tab === 'seasonal') list = list.filter((b) => b.is_seasonal);
    else if (tab === 'wishlist') list = list.filter((b) => wishlist.has(b.id));
    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((b) => b.name?.toLowerCase().includes(q) || b.description?.toLowerCase().includes(q));
    }
    // Rarity
    if (rarity !== 'all') list = list.filter((b) => b.rarity === rarity);
    // Sort (skip for tabs that already sort)
    if (sort === 'priority' && tab !== 'best' && tab !== 'new') list.sort((a, b) => (b.display_priority || 0) - (a.display_priority || 0));
    else if (sort === 'price_asc') list.sort((a, b) => (a.price || 0) - (b.price || 0));
    else if (sort === 'price_desc') list.sort((a, b) => (b.price || 0) - (a.price || 0));
    else if (sort === 'popular') list.sort((a, b) => (b.purchases_count || 0) - (a.purchases_count || 0));
    else if (sort === 'newest') list.sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0));
    return list;
  }, [badges, tab, search, rarity, sort, wishlist]);

  const startCheckout = async (payload) => {
    if (window.self !== window.top) { toast({ title: 'Checkout unavailable', description: 'Premium checkout works only from the published app.', variant: 'destructive' }); return null; }
    if (!mistUser?.id) { toast({ title: 'Sign in required', variant: 'destructive' }); return null; }
    setCheckingOut(payload.badge_id);
    try {
      const res = await base44.functions.invoke('createBadgeCheckout', { user_id: mistUser.id, user_name: mistUser.displayName || '', ...payload });
      if (res?.data?.url) { window.location.href = res.data.url; return true; }
      throw new Error(res?.data?.error || 'No checkout URL returned');
    } catch (e) {
      toast({ title: 'Checkout failed', description: e.message, variant: 'destructive' });
      return null;
    } finally {
      setCheckingOut(null);
    }
  };

  const handlePurchase = (badge) => {
    if (ownedMap.has(badge.id)) { toast({ title: 'You already own this badge' }); return; }
    startCheckout({ badge_id: badge.id });
  };

  const handleGift = (badge, gift) => {
    setGiftBadge(null);
    startCheckout({ badge_id: badge.id, ...gift });
  };

  const handleSetActive = async (ownershipId) => {
    try {
      for (const o of ownership) if (o.is_active) await base44.entities.PremiumBadgeOwnership.update(o.id, { is_active: false });
      await base44.entities.PremiumBadgeOwnership.update(ownershipId, { is_active: true });
      qc.invalidateQueries({ queryKey: ['premium-badge-ownership'] });
      qc.invalidateQueries({ queryKey: ['active-badge'] });
      toast({ title: 'Active badge updated' });
    } catch (e) {
      toast({ title: 'Failed to update active badge', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-0 left-1/4 w-[32rem] h-80 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute top-40 right-1/4 w-[28rem] h-72 bg-fuchsia-600/10 rounded-full blur-3xl" />
      </div>

      <div className="px-4 pt-4 pb-10 max-w-6xl mx-auto">
        <Link to="/profile" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Profile
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5 mb-6">
          <div>
            <div className="flex items-center gap-2 text-white/80 text-sm font-semibold tracking-[0.3em] mb-2">
              <Sparkles className="w-4 h-4 text-primary" /> MISST
            </div>
            <h1
              className="text-4xl sm:text-5xl font-black uppercase tracking-tight leading-none"
              style={{ background: 'linear-gradient(135deg, #c084fc, #a855f7, #7c3aed)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(0 0 18px rgba(168,85,247,0.55))' }}
            >
              Premium Badges
            </h1>
            <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Zap className="w-4 h-4 text-primary" /> Stand out. Show your status. Support the community.
            </p>
          </div>
          <div className="rounded-2xl bg-card/50 border border-white/[0.08] backdrop-blur-md p-4 w-full lg:w-80 space-y-3">
            {INFO_PANEL.map((it) => (
              <div key={it.title} className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${it.color}1a` }}>
                  <it.icon className="w-4 h-4" style={{ color: it.color }} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-foreground uppercase tracking-wide">{it.title}</p>
                  <p className="text-[11px] text-muted-foreground leading-snug">{it.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Controls: tabs + search + filters */}
        <div className="rounded-2xl bg-card/50 border border-white/[0.06] backdrop-blur-md overflow-hidden">
          <div className="flex items-center gap-1 px-3 pt-3 overflow-x-auto scrollbar-hide border-b border-white/[0.06]">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`shrink-0 px-3 py-2 rounded-t-lg text-xs font-semibold transition-colors flex items-center gap-1 ${tab === t.id ? 'text-foreground bg-white/[0.06]' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {t.id === 'wishlist' && <Heart className="w-3 h-3" />}
                {t.id === 'featured' && <Sparkles className="w-3 h-3" />}
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2 p-3">
            <div className="relative flex-1 min-w-[140px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search badges…" className="w-full h-9 rounded-lg bg-background border border-input pl-8 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
            <select value={rarity} onChange={(e) => setRarity(e.target.value)} className="h-9 rounded-lg bg-background border border-input px-2 text-sm capitalize">
              {RARITIES.map((r) => <option key={r} value={r}>{r === 'all' ? 'All Rarities' : r}</option>)}
            </select>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="h-9 rounded-lg bg-background border border-input px-2 text-sm">
              {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
        </div>

        {/* Collection */}
        <div className="mt-4 rounded-2xl bg-card/50 border border-white/[0.06] backdrop-blur-md overflow-hidden">
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-white/[0.06] bg-gradient-to-r from-amber-500/10 to-transparent">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold uppercase tracking-wide text-foreground">{TABS.find((t) => t.id === tab)?.label}</h2>
            </div>
            <span className="text-[11px] text-muted-foreground">{filtered.length} badges</span>
          </div>
          <div className="p-4">
            {isLoading ? (
              <div className="flex justify-center py-16"><div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16">
                {tab === 'wishlist' ? <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5"><Heart className="w-4 h-4" /> Your wishlist is empty.</p> : <p className="text-sm text-muted-foreground">No badges match your filters.</p>}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                {filtered.map((b) => {
                  const own = ownedMap.get(b.id);
                  const soldOut = (b.edition_size > 0 || b.purchase_limit > 0) && (b.purchases_count || 0) >= Math.max(b.edition_size || 0, b.purchase_limit || 0);
                  return (
                    <PremiumBadgeCard
                      key={b.id}
                      badge={b}
                      owned={!!own}
                      active={activeId === b.id}
                      ownershipId={own?.id}
                      ownedEdition={own?.edition_number}
                      soldOut={soldOut}
                      isWishlisted={wishlist.has(b.id)}
                      onPurchase={handlePurchase}
                      onSetActive={handleSetActive}
                      onGift={(badge) => setGiftBadge(badge)}
                      onPreview={(badge) => setPreviewBadge(badge)}
                      onWishlist={toggleWishlist}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
          {FOOTER.map((it) => (
            <div key={it.title} className="rounded-2xl bg-card/50 border border-white/[0.06] backdrop-blur-md p-4">
              <it.icon className="w-5 h-5 text-white mb-2" />
              <p className="text-xs font-bold text-foreground uppercase tracking-wide">{it.title}</p>
              <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{it.desc}</p>
            </div>
          ))}
        </div>

        <p className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
          <Lock className="w-3 h-3" /> Payments secured by Stripe. Badges renew annually. Upgrades charge only the price difference.
        </p>
      </div>

      {giftBadge && (
        <GiftBadgeDialog badge={giftBadge} onClose={() => setGiftBadge(null)} onConfirm={(gift) => handleGift(giftBadge, gift)} />
      )}
      {previewBadge && (
        <BadgePreview
          badge={previewBadge}
          owned={ownedMap.has(previewBadge.id)}
          active={activeId === previewBadge.id}
          onClose={() => setPreviewBadge(null)}
          onPurchase={(b) => { setPreviewBadge(null); handlePurchase(b); }}
          onGift={(b) => { setPreviewBadge(null); setGiftBadge(b); }}
          onSetActive={() => { const o = ownedMap.get(previewBadge.id); if (o) handleSetActive(o.id); setPreviewBadge(null); }}
        />
      )}
    </div>
  );
}