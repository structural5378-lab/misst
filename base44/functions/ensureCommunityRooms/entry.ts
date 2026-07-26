import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { DEFAULT_ROOMS } from "../../shared/communityRooms.ts";

// ensureCommunityRooms — idempotent. Returns the community's rooms, seeding the
// 7 default rooms the first time the community is opened. Uses the service role
// (bypasses ChatV2Room create RLS) since default rooms are non-sensitive public
// community infrastructure.
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const body = await req.json().catch(() => ({}));
  const communityId = body.community_id;
  if (!communityId) return Response.json({ ok: false, error: "community_id required" });

  try {
    let rooms = await base44.asServiceRole.entities.ChatV2Room
      .filter({ community_id: communityId }, "order", 200)
      .catch(() => []);
    if (!Array.isArray(rooms)) rooms = [];

    if (rooms.length === 0) {
      const community = await base44.asServiceRole.entities.Community.get(communityId).catch(() => null);
      const created = await base44.asServiceRole.entities.ChatV2Room.bulkCreate(
        DEFAULT_ROOMS.map((r) => ({
          name: r.name,
          description: r.description,
          icon: r.icon,
          type: r.type,
          order: r.order,
          community_id: communityId,
          community_name: community?.name || "",
          community_slug: community?.slug || "",
          created_by: body.user_id || "",
          created_by_name: body.user_name || "",
          member_count: 0,
        }))
      );
      rooms = Array.isArray(created) ? created : [];
    }

    return Response.json({ ok: true, rooms });
  } catch (e) {
    return Response.json({ ok: false, error: e?.message || String(e) });
  }
});