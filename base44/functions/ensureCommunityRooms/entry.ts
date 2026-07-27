import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { DEFAULT_ROOMS } from "../../shared/communityRooms.ts";
import { resolveCommunityAccess } from "../../shared/communityAccess.ts";

// ensureCommunityRooms — idempotent. Returns the community's Chat V2 rooms,
// seeding the default rooms the first time the community is opened.
//
// Security: the caller MUST be an active member of the community (or a
// platform admin) before any rooms are returned or created. This prevents
// cross-community room access / seeding. 403 otherwise.

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const body = await req.json().catch(() => ({}));
  const communityId = body.community_id;
  if (!communityId) return Response.json({ ok: false, error: "community_id required" });

  try {
    const user = await base44.auth.me();
    if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const access = await resolveCommunityAccess(base44, user, communityId);
    if (!access.isMember && !access.isPlatformAdmin) {
      return Response.json(
        { ok: false, error: "Access Denied: you are not a member of this community" },
        { status: 403 }
      );
    }

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