/**
 * MISST Core — HTTP transport.
 *
 * Thin fetch wrapper used by every Core API module. Injects the bearer
 * token, parses JSON, and normalizes errors into a Base44-compatible shape
 * ({ status, message, data }) so existing frontend error handling keeps
 * working during the migration.
 */
import {
  getCoreBaseUrl,
  getCoreToken,
  getCoreRefreshToken,
  setCoreToken,
  setCoreRefreshToken,
  clearCoreTokens,
} from "./config";

export class CoreApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = "CoreApiError";
    this.status = status;
    this.data = data;
  }
}

const request = async (path, options = {}) => {
  const url = `${getCoreBaseUrl()}${path}`;
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(options.headers || {}),
  };

  const token = getCoreToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch (networkError) {
    throw new CoreApiError(networkError.message || "Network error", 0, null);
  }

  // Attempt to refresh once on 401 if we have a refresh token.
  if (response.status === 401 && getCoreRefreshToken() && !options._retried) {
    const refreshed = await tryRefresh();
    if (refreshed) return request(path, { ...options, _retried: true });
  }

  let payload = null;
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    // Core error envelope is { success, error: { code, message } }; extract the
    // readable message. Fall back through legacy shapes (message/detail/string
    // error) so non-Core-style error bodies still surface a usable string.
    const errObj = payload && payload.error;
    const message =
      (payload && (payload.message || payload.detail)) ||
      (errObj && typeof errObj === "object" ? errObj.message : errObj) ||
      response.statusText ||
      "Request failed";
    throw new CoreApiError(message, response.status, payload);
  }

  // Core responses are wrapped as { success, data } — unwrap to match the
  // shape the frontend expects from Base44 calls.
  if (payload && typeof payload === "object" && "data" in payload && "success" in payload) {
    return payload.data;
  }
  return payload;
};

const tryRefresh = async () => {
  const refreshToken = getCoreRefreshToken();
  if (!refreshToken) return false;
  try {
    const url = `${getCoreBaseUrl()}/api/auth/refresh`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!response.ok) throw new Error("refresh failed");
    const payload = await response.json();
    const data = payload?.data || payload;
    if (data?.access_token) {
      setCoreToken(data.access_token);
      if (data.refresh_token) setCoreRefreshToken(data.refresh_token);
      return true;
    }
    return false;
  } catch {
    clearCoreTokens();
    return false;
  }
};

export const http = {
  get: (path, options) => request(path, { ...options, method: "GET" }),
  post: (path, body, options) => request(path, { ...options, method: "POST", body }),
  put: (path, body, options) => request(path, { ...options, method: "PUT", body }),
  patch: (path, body, options) => request(path, { ...options, method: "PATCH", body }),
  delete: (path, options) => request(path, { ...options, method: "DELETE" }),
};

export default http;