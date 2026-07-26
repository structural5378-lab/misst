import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { getFcmAccessToken, getServiceAccount } from "../../shared/fcm.ts";

// Diagnostic: sends a minimal FCM HTTP v1 message to the caller's first active
// device token and returns the RAW FCM HTTP response (status + body) plus the
// project id used. For debugging "invalid token" / project-mismatch issues only.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    // Body options:
    //   { purge: true }                  — delete ALL of the caller's device tokens.
    //   { token: "<exact getToken()>" }   — use the EXACT client-minted token: save/replace
    //                                      the DeviceToken record, then send the HTTP v1
    //                                      test to that exact value and log everything.
    //   (no body)                         — fall back to the caller's most recent active token.
    let body = {};
    try { body = await req.json(); } catch { /* empty body */ }
    if (body && body.purge) {
      const all = await base44.asServiceRole.entities.DeviceToken
        .filter({ user_id: user.id }, "-created_date", 100).catch(() => []);
      let purged = 0;
      for (const t of all || []) {
        await base44.asServiceRole.entities.DeviceToken.delete(t.id).catch(() => {});
        purged++;
      }
      return Response.json({ ok: true, purged });
    }

    let token = null;
    let saveResult = null;
    if (body && typeof body.token === "string" && body.token.length > 0) {
      // Use the EXACT token from the client (no trimming / normalization).
      token = body.token;
      // Replace the user's active DeviceToken record(s) with this exact value:
      // deactivate any existing active token that differs, then create a fresh one.
      const existing = await base44.asServiceRole.entities.DeviceToken
        .filter({ user_id: user.id, is_active: true }, "-created_date", 50)
        .catch(() => []);
      let deactivated = 0;
      for (const t of existing || []) {
        if (t.token !== token) {
          await base44.asServiceRole.entities.DeviceToken
            .update(t.id, { is_active: false }).catch(() => {});
          deactivated++;
        }
      }
      let created = null;
      const dup = (existing || []).find((t) => t.token === token);
      if (dup) {
        await base44.asServiceRole.entities.DeviceToken
          .update(dup.id, { is_active: true, last_seen: new Date().toISOString() }).catch(() => {});
        created = { id: dup.id, reused: true };
      } else {
        created = await base44.asServiceRole.entities.DeviceToken
          .create({
            user_id: user.id,
            token,
            platform: "web",
            user_agent: req.headers.get("user-agent") || "",
            is_active: true,
            last_seen: new Date().toISOString(),
          }).catch((e) => ({ error: e?.message || "create failed" }));
      }
      // Re-read the stored token to confirm byte-for-byte equality with what we sent.
      const stored = await base44.asServiceRole.entities.DeviceToken
        .filter({ user_id: user.id, is_active: true, token }, "-created_date", 5)
        .catch(() => []);
      const storedToken = (stored || [])[0]?.token || null;
      saveResult = {
        deactivatedOthers: deactivated,
        recordId: created?.id || null,
        reused: !!(created && created.reused),
        storedTokenLength: storedToken ? storedToken.length : null,
        byteForByteMatch: storedToken ? storedToken === token : false,
      };
    } else {
      const tokens = await base44.asServiceRole.entities.DeviceToken
        .filter({ user_id: user.id, is_active: true }, "-created_date", 5)
        .catch(() => []);
      token = (tokens || [])[0]?.token;
    }
    if (!token) return Response.json({ error: "No active device token found" });

    const auth = await getFcmAccessToken();
    if (!auth.ok) return Response.json({ error: "Auth failed: " + auth.error });

    const sa = getServiceAccount();
    const projectId = sa?.project_id || auth.projectId;
    const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;
    const message = {
      message: {
        token,
        notification: { title: "🔔 MIST FCM Test", body: "End-to-end diagnostic from debugFcmSend" },
        data: { link: "/notifications", type: "system", source: "debugFcmSend" },
        fcm_options: { analytics_label: "mist_diag" },
      },
    };
    const requestBody = JSON.stringify(message);

    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${auth.token}`, "Content-Type": "application/json" },
      body: requestBody,
    });
    const raw = await res.text();

    return Response.json({
      ok: res.ok,
      httpStatus: res.status,
      projectId,
      tokenPreview: token.slice(0, 24) + "…" + token.slice(-12),
      tokenLength: token.length,
      // The exact token value as stored/sent (for byte-for-byte client comparison).
      tokenSent: token,
      saveResult,
      request: {
        url,
        method: "POST",
        headers: { Authorization: "Bearer <redacted>", "Content-Type": "application/json" },
        body: message,
      },
      responseBody: (() => { try { return JSON.parse(raw); } catch { return raw; } })(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});