/**
 * MISST Core — Communities API.
 *
 * Targets the MISST Core backend's community endpoints. The Express app
 * currently mounts community-adjacent routes under /api/groups; this
 * module is written against the canonical /api/communities surface the
 * migration will expose. It is ready to be wired into the community hooks
 * (useUserCommunities, useCommunity, CommunityLayout) once the Core
 * backend community routes are deployed; until then the abstraction layer
 * keeps using Base44 entities so nothing breaks.
 */
import http from "./http";

const mapCommunity = (c) =>
  c && typeof c === "object"
    ? {
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description || "",
        owner_id: c.owner_id,
        owner_name: c.owner_name || "",
        visibility: c.visibility || "private",
        status: c.status || "active",
        member_count: c.member_count ?? 0,
        ...c,
      }
    : c;

export const coreCommunities = {
  async list(params = {}) {
    const qs = new URLSearchParams(params).toString();
    const path = qs ? `/api/communities?${qs}` : "/api/communities";
    const list = await http.get(path);
    return Array.isArray(list) ? list.map(mapCommunity) : list;
  },

  async get(idOrSlug) {
    const community = await http.get(`/api/communities/${idOrSlug}`);
    return mapCommunity(community);
  },

  async create(data) {
    const community = await http.post("/api/communities", data);
    return mapCommunity(community);
  },

  async update(id, data) {
    const community = await http.patch(`/api/communities/${id}`, data);
    return mapCommunity(community);
  },

  async remove(id) {
    return http.delete(`/api/communities/${id}`);
  },
};

export default coreCommunities;