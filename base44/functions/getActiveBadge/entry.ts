import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// getActiveBadge — returns the active premium badge DISPLAY data for one or many
// users. Public (no auth required): only denormalized display fields are exposed
// (name, icon, effect, accent, artwork, rarity, edition number). This powers the
// app-wide ActiveBadge component (chat, member lists, leaderboards, etc.).
//
// Payload: { user_id } → { badge } | { user_ids: [...] } → { badges: { id: badge } }
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { user_id, user_ids } = body;
    const ids = Array.isArray(user_ids) && user_ids.length ? user_ids : (user_id ? [user_id] : []);
    if (!ids.length) return Response.json({ badges: {} });

    const rows = await base44.asServiceRole.entities.PremiumBadgeOwnership
      .filter({ status: 'active', is_active: true, user_id: { $in: ids } });

    const badges = {};
    for (const o of rows) {
      if (badges[o.user_id]) continue; // first active wins
      badges[o.user_id] = {
        badge_id: o.badge_id,
        name: o.badge_name,
        icon: o.badge_icon,
        artwork_url: o.badge_artwork_url,
        effect: o.badge_effect,
        accent_color: o.badge_accent_color,
        rarity: o.badge_rarity,
        edition_number: o.edition_number || 0,
        is_gift: !!o.is_gift,
      };
    }

    if (user_id && !Array.isArray(user_ids)) {
      return Response.json({ badge: badges[user_id] || null });
    }
    return Response.json({ badges });
  } catch (error) {
    console.error('getActiveBadge error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}