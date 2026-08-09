/**
 * MISST Core — Users API.
 *
 * Covers the user-facing read/write operations the frontend currently goes
 * through Base44 for (auth.me / auth.updateMe / entities.User). Targets the
 * existing MISST Core Express backend (src/backend/api/routes/user.routes.ts).
 *
 * Ready to be wired into useMistUser / AccountCenter once the Core backend
 * user routes are deployed; until then the abstraction layer falls back to
 * Base44 for these calls.
 */
import http from "./http";

const mapUser = (u) =>
  u && typeof u === "object"
    ? {
        id: u.id,
        email: u.email,
        full_name: u.full_name || u.name || "",
        callsign: u.callsign || "",
        role: u.role || "member",
        avatar_url: u.avatar_url || u.avatar || null,
        ...u,
      }
    : u;

export const coreUsers = {
  async me() {
    const user = await http.get("/api/auth/me");
    return mapUser(user);
  },

  async updateMe(data) {
    const user = await http.patch("/api/users/me", data);
    return mapUser(user);
  },

  async getUser(id) {
    const user = await http.get(`/api/users/${id}`);
    return mapUser(user);
  },

  async listUsers(params = {}) {
    const qs = new URLSearchParams(params).toString();
    const path = qs ? `/api/users?${qs}` : "/api/users";
    const users = await http.get(path);
    return Array.isArray(users) ? users.map(mapUser) : users;
  },
};

export default coreUsers;