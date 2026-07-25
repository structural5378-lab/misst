// FCM HTTP v1 helpers — shared by push delivery and configuration testing.
// The service account is stored as the FCM_SERVICE_ACCOUNT_JSON secret (full JSON).
// These helpers run server-side only and never expose the private key to the client.

export function getServiceAccount() {
  const raw = Deno.env.get("FCM_SERVICE_ACCOUNT_JSON");
  if (!raw) return null;
  try {
    const sa = JSON.parse(raw);
    if (!sa.project_id || !sa.private_key || !sa.client_email) return null;
    return sa;
  } catch {
    return null;
  }
}

function b64url(input) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function importPrivateKey(pem) {
  const pemBody = pem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s+/g, "");
  const der = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey(
    "pkcs8",
    der,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

// Mints an OAuth2 access token for the firebase.messaging scope using the
// service account private key (RS256 JWT bearer grant). Non-destructive.
export async function getFcmAccessToken() {
  const sa = getServiceAccount();
  if (!sa) return { ok: false, error: "FCM_SERVICE_ACCOUNT_JSON missing or invalid" };
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };
  const enc = new TextEncoder();
  const unsigned = `${b64url(enc.encode(JSON.stringify(header)))}.${b64url(enc.encode(JSON.stringify(payload)))}`;
  try {
    const key = await importPrivateKey(sa.private_key);
    const sigBuf = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, enc.encode(unsigned));
    const jwt = `${unsigned}.${b64url(new Uint8Array(sigBuf))}`;
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }).toString(),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: data.error_description || data.error || `token endpoint HTTP ${res.status}` };
    }
    return { ok: true, token: data.access_token, projectId: sa.project_id };
  } catch (e) {
    return { ok: false, error: e.message || "Failed to sign FCM JWT" };
  }
}