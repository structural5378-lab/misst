/**
 * MISST Core — API client configuration.
 *
 * The migration off Base44 is gated by a single env flag:
 *   VITE_MIST_CORE_API_URL  — base URL of the MISST Core REST API
 *                             (e.g. https://api.mist.insomniacsgmrs.com)
 *
 * When unset, the abstraction layer delegates every call to the legacy
 * Base44 client so existing behavior is preserved exactly. When set, the
 * migrated services (auth / users / communities / membership) route to
 * MISST Core and the remaining services keep using Base44 until they are
 * migrated in later steps.
 */

const CORE_API_URL =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_MIST_CORE_API_URL) ||
  "";

const STORAGE_KEYS = {
  accessToken: "mist_core_access_token",
  refreshToken: "mist_core_refresh_token",
};

const safeStorage = () => {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

export const isCoreEnabled = () => Boolean(CORE_API_URL);

export const getCoreBaseUrl = () => CORE_API_URL.replace(/\/$/, "");

export const getCoreToken = () => safeStorage()?.getItem(STORAGE_KEYS.accessToken) || null;
export const setCoreToken = (token) => {
  const s = safeStorage();
  if (!s) return;
  if (token) s.setItem(STORAGE_KEYS.accessToken, token);
  else s.removeItem(STORAGE_KEYS.accessToken);
};
export const getCoreRefreshToken = () => safeStorage()?.getItem(STORAGE_KEYS.refreshToken) || null;
export const setCoreRefreshToken = (token) => {
  const s = safeStorage();
  if (!s) return;
  if (token) s.setItem(STORAGE_KEYS.refreshToken, token);
  else s.removeItem(STORAGE_KEYS.refreshToken);
};
export const clearCoreTokens = () => {
  setCoreToken(null);
  setCoreRefreshToken(null);
};

export default {
  isCoreEnabled,
  getCoreBaseUrl,
  getCoreToken,
  setCoreToken,
  getCoreRefreshToken,
  setCoreRefreshToken,
  clearCoreTokens,
};