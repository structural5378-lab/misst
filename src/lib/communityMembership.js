/**
 * Shared helpers for the community join/request flow.
 *
 * Never surface raw Axios/server strings to end users — map known backend
 * `code` values and HTTP statuses to friendly messages. Full diagnostics are
 * logged to the console for developers instead.
 */

const DEFAULT = "Unable to join this community. Please try again.";

/**
 * Map a manageCommunityMembership error (thrown Axios error OR a plain
 * response-data object) to a user-friendly message.
 */
export function friendlyMembershipError(err, fallback = DEFAULT) {
  const data = err?.response?.data || err?.data || err;
  const code = data?.code;
  const status = err?.response?.status || err?.status;

  if (code === "closed") return "This community is closed to new members at this time.";
  if (code === "banned") return "You are banned from this community.";
  if (code === "approval_required") return "This community requires an invitation or admin approval to join.";
  if (code === "not_found" || status === 404) return "This community could not be found. Please refresh and try again.";

  if (status === 401) return "Your session has expired. Please sign in again and try again.";
  if (status === 403) return "Unable to join this community at this time.";
  if (status === 409) return "You already have a membership with this community.";

  // No response → network error (offline / CORS / DNS).
  if (!status && (err?.name === "AxiosError" || err?.message?.includes("Network") || err?.message?.includes("timeout"))) {
    return "We couldn't reach the server. Check your connection and try again.";
  }
  if (status >= 500) return "Something went wrong on our end. Please try again in a moment.";

  return fallback;
}

/**
 * True if the error looks transient (session not provisioned yet, network
 * blip, server hiccup) and a single retry is worth attempting.
 */
export function isRetryableMembershipError(err) {
  const status = err?.response?.status || err?.status;
  if (status === 401) return true; // session may have refreshed
  if (status >= 500) return true;
  if (!status && (err?.name === "AxiosError" || err?.message?.includes("Network") || err?.message?.includes("timeout"))) {
    return true;
  }
  return false;
}