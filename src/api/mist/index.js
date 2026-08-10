/**
 * MISST — Unified API facade (migration abstraction layer).
 *
 * This is the single dependency the frontend should import going forward.
 * It exposes the full surface the app currently consumes from Base44
 * (entities, functions, integrations, users, analytics) AND a `core`
 * namespace with the MISST Core API modules (auth, users, communities,
 * membership).
 *
 * Migration rule:
 *   - Services whose Core implementation is ready (auth) route to MISST
 *     Core when VITE_MIST_CORE_API_URL is set, and fall back to Base44
 *     otherwise — so behavior is preserved in environments where Core is
 *     not yet deployed.
 *   - Services not yet migrated (entities, functions, integrations, users
 *     invite, analytics, OAuth provider login) delegate to Base44
 *     unchanged until their Core implementation lands in a later step.
 *
 * Importing:
 *   import { mist } from "@/api/mist";
 *   mist.auth.me();            // Core-when-configured, else Base44
 *   mist.core.communities.list();
 *   mist.entities.Community.list();   // still Base44 (not migrated yet)
 */
import { base44 } from "@/api/base44Client";
import { isCoreEnabled } from "./core/config";
import coreAuth from "./core/auth";
import coreUsers from "./core/users";
import coreCommunities from "./core/communities";
import coreMembership from "./core/membership";
import coreConfig from "./core/config";
import { http, CoreApiError } from "./core/http";
import { entitiesFacade } from "./entities";

// --- Auth facade: Core-when-enabled, Base44 fallback -------------------------
const authFacade = {
  async me() {
    return isCoreEnabled() ? coreAuth.me() : base44.auth.me();
  },

  async loginViaEmailPassword(email, password) {
    if (isCoreEnabled()) {
      const result = await coreAuth.loginViaEmailPassword(email, password);
      coreAuth.setToken(result.access_token, result.refresh_token);
      return result;
    }
    return base44.auth.loginViaEmailPassword(email, password);
  },

  async register(data) {
    return isCoreEnabled() ? coreAuth.register(data) : base44.auth.register(data);
  },

  async verifyOtp(data) {
    if (isCoreEnabled()) {
      const result = await coreAuth.verifyOtp(data);
      coreAuth.setToken(result.access_token, result.refresh_token);
      return result;
    }
    return base44.auth.verifyOtp(data);
  },

  async resendOtp(email) {
    return isCoreEnabled() ? coreAuth.resendOtp(email) : base44.auth.resendOtp(email);
  },

  async updateMe(data) {
    return isCoreEnabled() ? coreUsers.updateMe(data) : base44.auth.updateMe(data);
  },

  async resetPasswordRequest(email) {
    return isCoreEnabled()
      ? coreAuth.resetPasswordRequest(email)
      : base44.auth.resetPasswordRequest(email);
  },

  async resetPassword(data) {
    return isCoreEnabled() ? coreAuth.resetPassword(data) : base44.auth.resetPassword(data);
  },

  async isAuthenticated() {
    return isCoreEnabled() ? coreAuth.isAuthenticated() : base44.auth.isAuthenticated();
  },

  setToken(token, refreshToken) {
    if (isCoreEnabled()) coreAuth.setToken(token, refreshToken);
    else base44.auth.setToken(token);
  },

  async logout(redirectUrl) {
    if (isCoreEnabled()) {
      await coreAuth.logout();
      if (redirectUrl) window.location.href = redirectUrl;
      return;
    }
    base44.auth.logout(redirectUrl);
  },

  // OAuth provider login is not yet implemented in Core — always Base44.
  loginWithProvider(provider, fromUrl) {
    return base44.auth.loginWithProvider(provider, fromUrl);
  },

  redirectToLogin(nextUrl) {
    return base44.auth.redirectToLogin(nextUrl);
  },
};

// --- Unified mist facade ----------------------------------------------------
export const mist = {
  // Migrated (Core-when-enabled)
  auth: authFacade,

  // Entities — Core-when-enabled (generic entity API), Base44 fallback otherwise
  entities: entitiesFacade,
  functions: base44.functions,
  integrations: base44.integrations,
  users: base44.users,
  analytics: base44.analytics,

  // MISST Core API modules (ready for incremental wiring)
  core: {
    config: coreConfig,
    http,
    auth: coreAuth,
    users: coreUsers,
    communities: coreCommunities,
    membership: coreMembership,
  },
};

export { base44, isCoreEnabled, CoreApiError };
export default mist;