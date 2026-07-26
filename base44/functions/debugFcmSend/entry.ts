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

    // Optional body { purge: true } — deletes ALL of the caller's device tokens
    // (used to clear stale endpoint-style tokens before re-enrolling with the SDK).
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

    const tokens = await base44.asServiceRole.entities.DeviceToken
      .filter({ user_id: user.id, is_active: true }, "-created_date", 5)
      .catch(() => []);
    const token = (tokens || [])[0]?.token;
    if (!token) return Response.json({ error: "No active device token found" });

    const auth = await getFcmAccessToken();
    if (!auth.ok) return Response.json({ error: "Auth failed: " + auth.error });

    const sa = getServiceAccount();
    const projectId = sa?.project_id || auth.projectId;
    const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;
    const message = {
      message: {
        token,
        notification: { title: "🔔 Test", body: "FCM diagnostic" },
        data: { link: "/", type: "system" },
      },
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${auth.token}`, "Content-Type": "application/json" },
      body: JSON.stringify(message),
    });
    const raw = await res.text();

    return Response.json({
      ok: res.ok,
      httpStatus: res.status,
      projectId,
      tokenPreview: token.slice(0, 24) + "…" + token.slice(-12),
      tokenLength: token.length,
      responseBody: (() => { try { return JSON.parse(raw); } catch { return raw; } })(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});