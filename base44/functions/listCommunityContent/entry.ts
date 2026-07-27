import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { resolveCommunityAccess } from '../../shared/communityAccess.ts';

// listCommunityContent — the single membership-validated read path for all
// community-scoped content entities. Every community-facing list query
// (events, repeaters, gallery, forum threads, chat messages, chat rooms,
// alerts, marketplace, nets) MUST go through here instead of reading the
// entity directly with a client-side community_id filter.
//
// Security:
//   1. Requires community_id (400 otherwise).
//   2. Verifies the caller is an ACTIVE member of that community, OR a
//      platform admin. Returns 403 otherwise — no content leaves the boundary.
//   3. The query is built server-side with community_id FORCED last, so a
//      caller-supplied `extra` filter can never override the community scope.
//   4. Entity name is whitelisted; arbitrary entity access is rejected.
//
// Payload: { community_id, entity, sort?, limit?, extra? }
// Returns:  { items: [...] }

const ENTITY_WHITELIST = {
  Event: 'Event',
  Repeater: 'Repeater',
  GatheringPhoto: 'GatheringPhoto',
  ForumThread: 'ForumThread',
  ChatMessage: 'ChatMessage',
  ChatV2Room: 'ChatV2Room',
  ChatV2RoomMessage: 'ChatV2RoomMessage',
  Alert: 'Alert',
  MarketplaceItem: 'MarketplaceItem',
  Net: 'Net',
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const community_id = String(body.community_id || '').trim();
    const entity = String(body.entity || '').trim();
    const sort = body.sort || '-created_date';
    const limit = Math.min(200, Math.max(1, parseInt(body.limit, 10) || 50));

    if (!community_id) {
      return Response.json({ error: 'community_id is required' }, { status: 400 });
    }
    if (!ENTITY_WHITELIST[entity]) {
      return Response.json({ error: 'Unsupported entity' }, { status: 400 });
    }

    const access = await resolveCommunityAccess(base44, user, community_id);
    if (!access.isMember && !access.isPlatformAdmin) {
      return Response.json(
        { error: 'Access Denied: you are not a member of this community' },
        { status: 403 }
      );
    }

    // Caller-supplied extra filter merged FIRST, community_id FORCED last so it
    // can never be overridden.
    const extra = body.extra && typeof body.extra === 'object' ? body.extra : {};
    const query = { ...extra, community_id };

    const items = await base44.asServiceRole.entities[ENTITY_WHITELIST[entity]]
      .filter(query, sort, limit)
      .catch(() => []);

    return Response.json({ items: items || [] });
  } catch (e) {
    return Response.json({ error: e?.message || String(e) }, { status: 500 });
  }
});