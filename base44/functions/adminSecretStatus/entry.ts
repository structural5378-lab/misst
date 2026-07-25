import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { getServiceAccount, getFcmAccessToken } from "../../shared/fcm.ts";

// Known platform secrets. Status returns configured/valid flags WITHOUT
// exposing values; test performs a live, non-destructive check of each
// integration. Admin-only (auth.me + role admin), 403 otherwise.
const SECRETS = [
  { key: "PUSHALERT_API_KEY", label: "PushAlert (Web Push)", group: "push", docs: "https://pushalert.co/" },
  { key: "WEATHER_API_KEY", label: "Weather API (OpenWeather)", group: "weather", docs: "https://openweathermap.org/api" },
  { key: "MYBB_BOT_PASSWORD", label: "MyBB Bridge Bot Password", group: "forum", docs: "" },
  { key: "MIST_BRIDGE_SECRET", label: "MIST Bridge Shared Secret", group: "forum", docs: "" },
  {
    key: "FCM_SERVICE_ACCOUNT_JSON",
    label: "Firebase Service Account (FCM)",
    group: "firebase",
    docs: "https://firebase.google.com/docs/cloud-messaging/send-message#authorize-send-requests",
  },
];

const BRIDGE_URL = "https://insomniacsgmrs.com/mist-api.php";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });

    let body = {};
    try {
      body = await req.json();
    } catch {
      /* no body is fine */
    }
    const action = body.action || "status";

    if (action === "status") {
      const items = SECRETS.map((s) => {
        const raw = Deno.env.get(s.key);
        const configured = !!raw && raw.trim().length > 0;
        let valid = configured;
        if (s.key === "FCM_SERVICE_ACCOUNT_JSON") valid = getServiceAccount() != null;
        return { key: s.key, label: s.label, group: s.group, docs: s.docs, configured, valid };
      });
      return Response.json({ items });
    }

    if (action === "test") {
      const results = await Promise.allSettled([
        testPushAlert(),
        testWeather(),
        testForum(),
        testFirebase(),
      ]);
      const unwrap = (r, name) =>
        r.status === "fulfilled"
          ? r.value
          : { ok: false, message: (r.reason && r.reason.message) || `${name} test failed` };
      return Response.json({
        services: {
          push: unwrap(results[0], "PushAlert"),
          weather: unwrap(results[1], "Weather"),
          forum: unwrap(results[2], "Bridge"),
          firebase: unwrap(results[3], "FCM"),
        },
      });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function testPushAlert() {
  const apiKey = Deno.env.get("PUSHALERT_API_KEY");
  if (!apiKey) return { ok: false, message: "Not configured" };
  const t0 = Date.now();
  try {
    // Read-only segments list (REST API v2). Auth via api_key header, same as send.
    const res = await fetch("https://api.pushalert.co/rest/v2/web-push/segments", {
      headers: { Authorization: `api_key=${apiKey}` },
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401 || res.status === 403) {
      return { ok: false, message: "Invalid API key", latencyMs: Date.now() - t0 };
    }
    const ok = res.ok;
    const segCount = Array.isArray(data.segments) ? data.segments.length : null;
    return {
      ok,
      message: ok
        ? `Reachable — ${segCount != null ? segCount + " segments" : "ok"}`
        : data.error || `HTTP ${res.status}`,
      latencyMs: Date.now() - t0,
    };
  } catch (e) {
    return { ok: false, message: e.message || "Unreachable", latencyMs: Date.now() - t0 };
  }
}

async function testWeather() {
  const apiKey = Deno.env.get("WEATHER_API_KEY");
  if (!apiKey) return { ok: false, message: "Not configured" };
  const t0 = Date.now();
  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=28.5&lon=-81.4&appid=${apiKey}&units=imperial`
    );
    const data = await res.json().catch(() => ({}));
    const ok = res.ok;
    return {
      ok,
      message: ok
        ? `Reachable — ${data.name || "weather"} ${Math.round(data.main?.temp ?? 0)}°F`
        : data.message || `HTTP ${res.status}`,
      latencyMs: Date.now() - t0,
    };
  } catch (e) {
    return { ok: false, message: e.message || "Unreachable", latencyMs: Date.now() - t0 };
  }
}

async function testForum() {
  const secret = Deno.env.get("MIST_BRIDGE_SECRET");
  if (!secret) return { ok: false, message: "Not configured" };
  const t0 = Date.now();
  try {
    const res = await fetch(BRIDGE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Mist-Secret": secret },
      body: JSON.stringify({ action: "health" }),
    });
    const text = await res.text();
    let parseable = false;
    try {
      JSON.parse(text);
      parseable = true;
    } catch {
      /* non-JSON */
    }
    const ok = res.status > 0 && res.status < 500 && (parseable || res.ok);
    return {
      ok,
      message: ok
        ? `Reachable (HTTP ${res.status})`
        : `HTTP ${res.status}${parseable ? "" : " — non-JSON"}`,
      latencyMs: Date.now() - t0,
    };
  } catch (e) {
    return { ok: false, message: e.message || "Unreachable", latencyMs: Date.now() - t0 };
  }
}

async function testFirebase() {
  const t0 = Date.now();
  const sa = getServiceAccount();
  if (!sa) return { ok: false, message: "Service account missing or invalid", latencyMs: Date.now() - t0 };
  const r = await getFcmAccessToken();
  if (!r.ok) return { ok: false, message: r.error, latencyMs: Date.now() - t0 };
  return { ok: true, message: `Token minted — project ${r.projectId}`, latencyMs: Date.now() - t0 };
}