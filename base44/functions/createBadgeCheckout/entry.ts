import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import Stripe from 'npm:stripe@17.7.0';
import { secrets } from 'base44:runtime';

// createBadgeCheckout — creates a Stripe Checkout session for purchasing or
// gifting a premium badge. Supports:
//  • Regular purchase → annual subscription
//  • Gift purchase (gift_to + message + scheduled + anonymous)
//  • Upgrade-by-difference → one-time charge of (new price − max owned price)
//  • Sold-out enforcement (edition_size / purchase_limit)
//
// Payload: { badge_id, user_id, user_name, gift_to?, gift_to_name?,
//            gift_message?, scheduled_delivery_at?, is_anonymous_gift? }
// Returns: { url, is_upgrade, charge_amount }
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const {
      badge_id, user_id, user_name,
      gift_to, gift_to_name, gift_message, scheduled_delivery_at, is_anonymous_gift,
    } = body;
    if (!badge_id || !user_id) {
      return Response.json({ error: 'badge_id and user_id are required' }, { status: 400 });
    }

    const badge = await base44.asServiceRole.entities.PremiumBadge.get(badge_id);
    if (!badge || !badge.is_enabled) {
      return Response.json({ error: 'Badge unavailable' }, { status: 404 });
    }

    // Sold-out check (limited edition / purchase limit)
    const sold = badge.purchases_count || 0;
    const editionCap = badge.edition_size > 0 ? badge.edition_size : 0;
    const limitCap = badge.purchase_limit > 0 ? badge.purchase_limit : 0;
    const cap = Math.max(editionCap, limitCap);
    if (cap > 0 && sold >= cap) {
      return Response.json({ error: 'This badge is sold out' }, { status: 409 });
    }

    const recipientId = gift_to || user_id;

    // Upgrade-by-difference: if the recipient owns a cheaper active badge,
    // charge only the price difference as a one-time payment.
    const owned = await base44.asServiceRole.entities.PremiumBadgeOwnership
      .filter({ user_id: recipientId, status: 'active' });
    let maxOwnedPrice = 0;
    for (const o of owned) {
      try {
        const b = await base44.asServiceRole.entities.PremiumBadge.get(o.badge_id);
        if (b && Number(b.price) > maxOwnedPrice) maxOwnedPrice = Number(b.price);
      } catch {}
    }
    const price = Number(badge.price || 0);
    const isUpgrade = maxOwnedPrice > 0 && price > maxOwnedPrice;
    const chargeAmount = isUpgrade
      ? Math.max(0, Math.round((price - maxOwnedPrice) * 100))
      : Math.round(price * 100);

    const stripe = new Stripe(secrets.get('STRIPE_SECRET_KEY'));
    const origin = req.headers.get('origin') || 'https://app.base44.com';

    const productName = gift_to
      ? `MISST Premium Badge Gift: ${badge.name}`
      : isUpgrade
        ? `MISST Premium Badge Upgrade: ${badge.name}`
        : `MISST Premium Badge: ${badge.name}`;

    const lineItem = isUpgrade
      ? [{ price_data: { currency: 'usd', product_data: { name: productName, description: 'Upgrade difference from your current badge.' }, unit_amount: chargeAmount }, quantity: 1 }]
      : [{ price_data: { currency: 'usd', product_data: { name: productName, description: badge.description || undefined }, unit_amount: chargeAmount, recurring: { interval: 'year' } }, quantity: 1 }];

    const session = await stripe.checkout.sessions.create({
      mode: isUpgrade ? 'payment' : 'subscription',
      line_items: lineItem,
      success_url: `${origin}/premium-badges?success=1`,
      cancel_url: `${origin}/premium-badges?canceled=1`,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID') || '',
        badge_id,
        user_id,
        user_name: user_name || '',
        gift_to: gift_to || '',
        gift_to_name: gift_to_name || '',
        gift_message: gift_message || '',
        scheduled_delivery_at: scheduled_delivery_at || '',
        is_anonymous_gift: is_anonymous_gift ? '1' : '0',
        is_upgrade: isUpgrade ? '1' : '0',
      },
    });

    return Response.json({ url: session.url, is_upgrade: isUpgrade, charge_amount: chargeAmount });
  } catch (error) {
    console.error('createBadgeCheckout error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}