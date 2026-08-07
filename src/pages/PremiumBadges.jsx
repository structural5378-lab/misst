import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useMistUser } from '@/hooks/useMistUser';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Zap, Star, Gem, ShieldCheck, Crown, Lock, Bolt, RotateCcw, Sparkles } from 'lucide-react';
import PremiumBadgeCard from '@/components/premium/PremiumBadgeCard';

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

export default function PremiumBadges() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { mistUser } = useMistUser();
  const [checkingOut, setCheckingOut] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === '1') toast({ title: 'Purchase complete!', description: 'Your premium badge is now active.' });
    if (params.get('canceled') === '1') toast({ title: 'Checkout canceled' });
    if (params.get('success') || params.get('canceled')) window.history.replaceState({}, '', '/premium-badges');
  }, []);

  const { data: badges = [], isLoading } = useQuery({
    queryKey: ['premium-badges'],
    queryFn: () => base44.entities.PremiumBadge.filter({ is_enabled: true }, '-display_priority', 100),
  });
  const { data: ownership = [] } = useQuery({
    queryKey: ['premium-badge-ownership'],
    queryFn: () => base44.entities.PremiumBadgeOwnership.filter({ user_id: mistUser?.id, status: 'active' }),
    enabled: !!mistUser?.id,
  });

  const ownedMap = new Map(ownership.map((o) => [o.badge_id, o]));
  const activeId = ownership.find((o) => o.is_active)?.badge_id;

  const handlePurchase = async (badge) => {
    if (window.self !== window.top) { toast({ title: 'Checkout unavailable', description: 'Premium checkout works only from the published app.', variant: 'destructive' }); return; }
    if (!mistUser?.id) { toast({ title: 'Sign in required', variant: 'destructive' }); return; }
    if (ownedMap.has(badge.id)) { toast({ title: 'You already own this badge' }); return; }
    setCheckingOut(badge.id);
    try {
      const res = await base44.functions.invoke('createBadgeCheckout', { badge_id: badge.id, user_id: mistUser.id, user_name: mistUser.displayName || '' });
      if (res?.data?.url) window.location.href = res.data.url;
      else throw new Error('No checkout URL returned');
    } catch (e) {
      toast({ title: 'Checkout failed', description: e.message, variant: 'destructive' });
    } finally {
      setCheckingOut(null);
    }
  };

  const handleSetActive = async (ownershipId) => {
    try {
      for (const o of ownership) if (o.is_active) await base44.entities.PremiumBadgeOwnership.update(o.id, { is_active: false });
      await base44.entities.PremiumBadgeOwnership.update(ownershipId, { is_active: true });
      qc.invalidateQueries({ queryKey: ['premium-badge-ownership'] });
      toast({ title: 'Active badge updated' });
    } catch (e) {
      toast({ title: 'Failed to update active badge', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Atmospheric purple lighting */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-0 left-1/4 w-[32rem] h-80 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute top-40 right-1/4 w-[28rem] h-72 bg-fuchsia-600/10 rounded-full blur-3xl" />
      </div>

      <div className="px-4 pt-4 pb-10 max-w-6xl mx-auto">
        {/* Back link */}
        <Link to="/profile" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Profile
        </Link>

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5 mb-8">
          <div>
            <div className="flex items-center gap-2 text-white/80 text-sm font-semibold tracking-[0.3em] mb-2">
              <Sparkles className="w-4 h-4 text-primary" /> MISST
            </div>
            <h1
              className="text-4xl sm:text-5xl font-black uppercase tracking-tight leading-none"
              style={{
                background: 'linear-gradient(135deg, #c084fc, #a855f7, #7c3aed)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 18px rgba(168,85,247,0.55))',
              }}
            >
              Premium Badges
            </h1>
            <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Zap className="w-4 h-4 text-primary" /> Stand out. Show your status. Support the community.
            </p>
          </div>

          {/* Info panel */}
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

        {/* Collection */}
        <div className="rounded-2xl bg-card/50 border border-white/[0.06] backdrop-blur-md overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] bg-gradient-to-r from-amber-500/10 to-transparent">
            <Crown className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold uppercase tracking-wide text-foreground">Premium Badges Collection</h2>
          </div>
          <div className="p-4">
            {isLoading ? (
              <div className="flex justify-center py-16">
                <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : badges.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-16">No premium badges available yet. Check back soon.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                {badges.map((b) => (
                  <PremiumBadgeCard
                    key={b.id}
                    badge={b}
                    owned={ownedMap.has(b.id)}
                    active={activeId === b.id}
                    ownershipId={ownedMap.get(b.id)?.id}
                    onPurchase={handlePurchase}
                    onSetActive={handleSetActive}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer bar */}
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
          <Lock className="w-3 h-3" /> Payments secured by Stripe. Badges renew annually.
        </p>
      </div>
    </div>
  );
}