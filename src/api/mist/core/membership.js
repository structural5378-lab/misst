/**
 * MISST Core — Community Membership API.
 *
 * Targets the MISST Core backend's community membership endpoints. Ready
 * to be wired into the membership hooks / CommunityAdmin once the Core
 * backend membership routes are deployed; until then the abstraction
 * layer keeps using Base44 entities (CommunityMember) so nothing breaks.
 */
import http from "./http";

const mapMember = (m) =>
  m && typeof m === "object"
    ? {
        id: m.id,
        user_id: m.user_id,
        user_email: m.user_email || m.email || "",
        user_name: m.user_name || m.full_name || "",
        user_avatar: m.user_avatar || m.avatar_url || null,
        user_callsign: m.user_callsign || m.callsign || "",
        community_id: m.community_id,
        role: m.role || "member",
        status: m.status || "active",
        joined_date: m.joined_date || null,
        ...m,
      }
    : m;

export const coreMembership = {
  async listMembers(communityId, params = {}) {
    const qs = new URLSearchParams(params).toString();
    const path = qs
      ? `/api/communities/${communityId}/members?${qs}`
      : `/api/communities/${communityId}/members`;
    const list = await http.get(path);
    return Array.isArray(list) ? list.map(mapMember) : list;
  },

  async getMembership(communityId) {
    const membership = await http.get(`/api/communities/${communityId}/membership`);
    return mapMember(membership);
  },

  async join(communityId, data = {}) {
    const membership = await http.post(`/api/communities/${communityId}/members`, data);
    return mapMember(membership);
  },

  async leave(communityId) {
    return http.delete(`/api/communities/${communityId}/membership`);
  },

  async updateRole(communityId, userId, role) {
    const membership = await http.patch(
      `/api/communities/${communityId}/members/${userId}`,
      { role }
    );
    return mapMember(membership);
  },

  async requestJoin(communityId, data = {}) {
    const request = await http.post(`/api/communities/${communityId}/join-requests`, data);
    return request;
  },
};

export default coreMembership;