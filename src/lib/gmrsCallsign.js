/**
 * GMRS Callsign utilities
 * ------------------------
 * Shared normalization, validation, and license-status derivation for the
 * FCC GMRS call sign feature. Used by registration, profile editing, the
 * reusable LicenseBadge component, and search.
 *
 * FCC GMRS call signs are assigned by the Commission and typically follow a
 * pattern of a leading letter (W or K), followed by 2-6 additional
 * alphanumeric characters including at least one digit (e.g. WSEU790,
 * WXXX123, KAF5678). This validator is intentionally permissive about the
 * exact segment breakdown so it accepts the full range of real GMRS call
 * signs while rejecting garbage — and stays forward-compatible for future
 * automatic FCC verification.
 */

/**
 * Normalize raw input into a clean callsign string:
 *   - uppercase
 *   - trim leading/trailing whitespace
 *   - strip all internal spaces
 *   - remove any character that is not a letter or digit
 * Returns "" for null/undefined/blank input.
 */
export function normalizeCallsign(value) {
  if (!value) return "";
  return String(value)
    .toUpperCase()
    .trim()
    .replace(/\s+/g, "")
    .replace(/[^A-Z0-9]/g, "");
}

/**
 * Validate a (already-normalized) value against the FCC GMRS call sign format.
 * Rules:
 *   - Alphanumeric only
 *   - Must start with a letter
 *   - Must contain at least one digit
 *   - Total length 4-8 characters
 */
export function isValidGmrsCallsign(value) {
  if (!value) return false;
  const v = normalizeCallsign(value);
  if (!v) return false;
  if (!/^[A-Z0-9]+$/.test(v)) return false;
  if (!/^[A-Z]/.test(v)) return false;
  if (!/\d/.test(v)) return false;
  return v.length >= 4 && v.length <= 8;
}

/**
 * Derive the license status from a callsign value.
 *   - valid callsign  -> "LICENSED"
 *   - empty/invalid   -> "UNLICENSED"
 * Never returns PENDING_VERIFICATION (reserved for future automatic FCC
 * verification flow).
 */
export function computeLicenseStatus(callsign) {
  return isValidGmrsCallsign(callsign) ? "LICENSED" : "UNLICENSED";
}

/**
 * Resolve the effective license status, preferring an explicitly-stored value
 * and falling back to derivation from the callsign. Used by display
 * components so they render correctly even when a record only carries a
 * callsign and no explicit status.
 */
export function resolveLicenseStatus({ licenseStatus, callsign } = {}) {
  if (licenseStatus === "PENDING_VERIFICATION") return "PENDING_VERIFICATION";
  if (licenseStatus === "LICENSED" || licenseStatus === "UNLICENSED") return licenseStatus;
  return computeLicenseStatus(callsign);
}