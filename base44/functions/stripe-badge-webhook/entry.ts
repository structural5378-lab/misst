import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import Stripe from 'npm:stripe@17.7.0';
import { secrets } from 'base44:runtime';

// stripe-badge-webhook — Stripe webhook handler. On checkout.session.completed
// it grants the purchaser (or the gift recipient) a PremiumBadgeOwnership record
// and increments the badge's purchases_count. Idempotent: duplicate sessions for
// the same user+badge are ignored.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const stripe = new Stripe(secrets.get('STRIPE_SECRET_KEY'));
    const signature = req.headers.get('stripe-signature');
    const rawBody = await req.text();
    const webhookSecret = secrets.get('STRIPE_WEBHOOK_SECRET');

    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
    } catch (err) {
      console.error('stripe signature invalid', err.message);
      return Response.json({ error: 'Invalid signature' }, { status: 400 });
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const meta = session.metadata || {};
      const { badge_id, user_id, user_name, gift_to } = meta;
      const ownerId = gift_to || user_id;
      if (badge_id && ownerId) {
        const existing = await base44.asServiceRole.entities.PremiumBadgeOwnership
          .filter({ user_id: ownerId, badge_id, status: 'active' });
        if (!existing.length) {
          const badge = await base44.asServiceRole.entities.PremiumBadge.get(badge_id);
          await base44.asServiceRole.entities.PremiumBadgeOwnership.create({
            user_id: ownerId,
            user_name: user_name || '',
            badge_id,
            badge_name: badge?.name,
            badge_icon: badge?.icon,
            badge_artwork_url: badge?.artwork_url,
            badge_effect: badge?.effect,
            badge_accent_color: badge?.accent_color,
            badge_rarity: badge?.rarity,
            is_active: false,
            is_gift: !!gift_to,
            gifted_by: gift_to ? user_id : '',
            is_earned: false,
            purchased_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'active',
            stripe_checkout_id: session.id,
          });
          await base44.asServiceRole.entities.PremiumBadge.update(badge_id, {
            purchases_count: (badge?.purchases_count || 0) + 1,
          });
        }
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('stripe-badge-webhook error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}