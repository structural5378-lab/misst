import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const BRIDGE_URL = "https://insomniacsgmrs.com/mist-api.php";

async function bridgeCall(action, params, secret) {
  const res = await fetch(BRIDGE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Mist-Secret": secret,
    },
    body: JSON.stringify({ action, ...params }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Bridge error: ${res.status} — ${text}`);
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Bridge returned non-JSON: ${text}`);
  }
}

Deno.serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    const { action, username, password } = body;
    const secret = Deno.env.get("MIST_BRIDGE_SECRET") || "MIST_BRIDGE_SECRET_KEY_CHANGE_ME";

    if (!username || !password) {
      return Response.json({ error: "Missing credentials" }, { status: 400 });
    }

    if (action === "get_pms") {
      const data = await bridgeCall("get_pms", { username, password }, secret);
      return Response.json(data);
    }

    if (action === "get_pm_thread") {
      const { pmid } = body;
      const data = await bridgeCall("get_pm_thread", { username, password, pmid }, secret);
      return Response.json(data);
    }

    if (action === "send_pm") {
      const { to_username, subject, message } = body;
      if (!to_username || !message) {
        return Response.json({ error: "Missing to_username or message" }, { status: 400 });
      }
      const data = await bridgeCall("send_pm", {
        username,
        password,
        to_username,
        subject: subject || `Message from ${username}`,
        message,
      }, secret);
      return Response.json(data);
    }

    if (action === "mark_pm_read") {
      const { pmid } = body;
      const data = await bridgeCall("mark_pm_read", { username, password, pmid }, secret);
      return Response.json(data);
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});