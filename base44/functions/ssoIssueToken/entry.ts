import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { resolveCallerPerms } from '../../shared/rbac.ts';

/**
 * ssoIssueToken — MIST is the Identity Provider (IdP).
 *
 * For an authenticated MIST user with a linked legacy MyBB account, this issues
 * a short-lived HMAC-SHA256-signed token (HS256 JWT) that the trusted PHP bridge
 * verifies with the shared MIST_BRIDGE_SECRET. The bridge then establishes a
 * MyBB session WITHOUT a password — MyBB never shows its own login. Tokens are
 * signed and short-lived (120s); no raw session/password is ever passed.
 */

const BRIDGE_URL = "https://insomniacsgmrs.com/mist-sso.php";
const SECRET = Deno.env.get("MIST_BRIDGE_SECRET") || "";

function b64url(input) {
  const s = typeof input === "string" ? input : btoa(String.fromCharCode(...new Uint8Array(input)));
  return s.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlJson(obj) {
  return b64url(btoa(JSON.stringify(obj)));
}

async function signHs256(signingInput, secret) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(signingInput));
  return b64url(sig);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const mybbUsername = user.mybb_username;
    if (!mybbUsername) {
      return Response.json({ error: "No legacy forum account linked to this MIST user" }, { status: 400 });
    }

    // MIST RBAC is the single source of truth — embed effective permissions + roles
    // so the PHP bridge syncs MyBB usergroups from MIST (no independent decisions).
    const { perms, slugs, legacy } = await resolveCallerPerms(base44, user);

    const now = Math.floor(Date.now() / 1000);
    const payload = {
      sub: user.id,
      mybb_username: mybbUsername,
      mybb_uid: user.mybb_uid || null,
      mist_email: user.email,
      roles: slugs,
      legacy_roles: legacy,
      permissions: perms,
      is_owner: slugs.includes('owner') || legacy.includes('platform_owner'),
      iat: now,
      exp: now + 120
    };

    const head = b64urlJson({ alg: "HS256", typ: "JWT" });
    const body = b64urlJson(payload);
    const sig = await signHs256(`${head}.${body}`, SECRET);
    const token = `${head}.${body}.${sig}`;

    return Response.json({
      success: true,
      token,
      bridge_url: BRIDGE_URL,
      expires_in: 120
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});