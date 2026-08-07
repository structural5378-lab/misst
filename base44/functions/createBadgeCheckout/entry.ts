import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import Stripe from 'npm:stripe@17.7.0';
import { secrets } from 'base44:runtime';

// createBadgeCheckout — creates a Stripe Checkout session for purchasing (or
// gifting) a premium badge as an annual subscription. Returns the hosted
// checkout URL. The frontend redirects the user there.
//
// Payload: { badge_id, user_id, user_name, gift_to? }
// The authenticated user's id is passed from the client (the app is the source
// of truth for the current user). metadata carries everything the webhook
// needs to grant ownership after payment.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { badge_id, user_id, user_name, gift_to } = body;
    if (!badge_id || !user_id) {
      return Response.json({ error: 'badge_id and user_id are required' }, { status: 400 });
    }

    const badge = await base44.asServiceRole.entities.PremiumBadge.get(badge_id);
    if (!badge || !badge.is_enabled) {
      return Response.json({ error: 'Badge unavailable' }, { status: 404 });
    }

    const stripe = new Stripe(secrets.get('STRIPE_SECRET_KEY'));
    const origin = req.headers.get('origin') || 'https://app.base44.com';

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `MISST Premium Badge: ${badge.name}`,
            description: badge.description || undefined,
          },
          unit_amount: Math.round(Number(badge.price || 0) * 100),
          recurring: { interval: 'year' },
        },
        quantity: 1,
      }],
      success_url: `${origin}/premium-badges?success=1`,
      cancel_url: `${origin}/premium-badges?canceled=1`,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID') || '',
        badge_id,
        user_id,
        user_name: user_name || '',
        gift_to: gift_to || '',
      },
    });

    return Response.json({ url: session.url });
  } catch (error) {
    console.error('createBadgeCheckout error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}