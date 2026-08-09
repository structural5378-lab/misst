/**
 * MISST Core — Authentication API.
 *
 * Mirrors the surface the frontend currently consumes from the Base44 SDK
 * (loginViaEmailPassword, register, verifyOtp, resendOtp, me, logout,
 * resetPasswordRequest, resetPassword, setToken, isAuthenticated) so the
 * auth pages can switch to the abstraction layer without behavior change.
 *
 * Endpoints target the existing MISST Core Express backend
 * (src/backend/api/routes/auth.routes.ts).
 */
import http, { CoreApiError } from "./http";
import {
  getCoreToken,
  setCoreToken,
  setCoreRefreshToken,
  clearCoreTokens,
  getCoreRefreshToken,
} from "./config";

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

export const coreAuth = {
  async login({ email, password }) {
    const data = await http.post("/api/auth/login", { email, password });
    if (data?.access_token) setCoreToken(data.access_token);
    if (data?.refresh_token) setCoreRefreshToken(data.refresh_token);
    return { ...data, user: mapUser(data?.user) };
  },

  // Base44-compatible positional signature: loginViaEmailPassword(email, password)
  async loginViaEmailPassword(email, password) {
    return this.login({ email, password });
  },

  async register(data) {
    return http.post("/api/auth/register", data);
  },

  async verifyOtp({ email, otpCode, otp_code }) {
    const data = await http.post("/api/auth/verify-otp", {
      email,
      otp_code: otp_code || otpCode,
    });
    if (data?.access_token) setCoreToken(data.access_token);
    if (data?.refresh_token) setCoreRefreshToken(data.refresh_token);
    return { ...data, user: mapUser(data?.user) };
  },

  async resendOtp(email) {
    return http.post("/api/auth/resend-otp", { email });
  },

  async me() {
    const user = await http.get("/api/auth/me");
    return mapUser(user);
  },

  async logout() {
    const refreshToken = getCoreRefreshToken();
    try {
      await http.post("/api/auth/logout", { refresh_token: refreshToken });
    } catch {
      // best-effort — clear locally regardless
    } finally {
      clearCoreTokens();
    }
  },

  async resetPasswordRequest(email) {
    return http.post("/api/auth/password/reset-request", { email });
  },

  async resetPassword({ resetToken, newPassword, reset_token, new_password }) {
    return http.post("/api/auth/password/reset", {
      reset_token: reset_token || resetToken,
      new_password: new_password || newPassword,
    });
  },

  setToken(token, refreshToken) {
    setCoreToken(token);
    if (refreshToken) setCoreRefreshToken(refreshToken);
  },

  getToken() {
    return getCoreToken();
  },

  isAuthenticated() {
    return Promise.resolve(Boolean(getCoreToken()));
  },
};

export { CoreApiError };
export default coreAuth;