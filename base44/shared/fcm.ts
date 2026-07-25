// FCM HTTP v1 helpers — shared by the notification engine and configuration testing.
// The service account is stored as FCM_SERVICE_ACCOUNT_JSON (full JSON, server-side only).
// These helpers run server-side and never expose the private key to the client.

const FCM_ICON = "https://insomniacsgmrs.com/uploads/mist-icon.png";

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

// Mints an OAuth2 access token for the firebase.messaging scope (RS256 JWT bearer grant).
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

// Standard notification/data/android/apns/webpush block used by all MIST pushes.
export function buildFcmPayload({ title, body, link = "/notifications", type = "system", communityId = "" }) {
  return {
    notification: { title: title || "MIST", body: body || "" },
    data: {
      link: String(link),
      type: String(type),
      community_id: String(communityId),
    },
    android: { notification: { icon: FCM_ICON, sound: "default" } },
    apns: { payload: { aps: { sound: "default" } } },
    webpush: { notification: { icon: FCM_ICON } },
  };
}

// Send to a single FCM registration token.
export async function sendFcmMessage(token, messagePayload) {
  const auth = await getFcmAccessToken();
  if (!auth.ok) return { ok: false, error: auth.error };
  try {
    const res = await fetch(`https://fcm.googleapis.com/v1/projects/${auth.projectId}/messages:send`, {
      method: "POST",
      headers: { Authorization: `Bearer ${auth.token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ message: { ...messagePayload, token } }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      return { ok: false, error: d.error?.message || `HTTP ${res.status}`, status: res.status };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// Send the same payload to many tokens. Mints one OAuth token, then sends with
// bounded concurrency. Returns { sent, failed, errors }.
export async function sendFcmMulticast(tokens, messagePayload) {
  if (!tokens || tokens.length === 0) return { sent: 0, failed: 0, errors: [] };
  const auth = await getFcmAccessToken();
  if (!auth.ok) return { sent: 0, failed: tokens.length, errors: [auth.error] };
  const url = `https://fcm.googleapis.com/v1/projects/${auth.projectId}/messages:send`;
  const CONC = 10;
  let sent = 0;
  let failed = 0;
  const errors = [];
  for (let i = 0; i < tokens.length; i += CONC) {
    const chunk = tokens.slice(i, i + CONC);
    const results = await Promise.all(
      chunk.map(async (tk) => {
        try {
          const res = await fetch(url, {
            method: "POST",
            headers: { Authorization: `Bearer ${auth.token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ message: { ...messagePayload, token: tk } }),
          });
          if (!res.ok) {
            const d = await res.json().catch(() => ({}));
            return { ok: false, error: d.error?.message || `HTTP ${res.status}`, status: res.status };
          }
          return { ok: true };
        } catch (e) {
          return { ok: false, error: e.message };
        }
      })
    );
    for (const r of results) {
      if (r.ok) sent++;
      else {
        failed++;
        if (errors.length < 10) errors.push(r.error);
      }
    }
  }
  return { sent, failed, errors };
}