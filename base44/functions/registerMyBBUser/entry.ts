import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const BRIDGE_URL = "https://insomniacsgmrs.com/mist-api.php";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { username, email, password, callsign } = body;

    if (!username || !email || !password) {
      return Response.json({ error: 'username, email and password are required' }, { status: 400 });
    }

    const secret = Deno.env.get("MIST_BRIDGE_SECRET") || "MIST_BRIDGE_SECRET_KEY_CHANGE_ME";

    const res = await fetch(BRIDGE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Mist-Secret": secret,
      },
      body: JSON.stringify({
        action: "register",
        username,
        email,
        password,
        callsign: callsign || "",
      }),
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      return Response.json({ error: data.error || "Registration failed" }, { status: 400 });
    }

    return Response.json({ success: true, message: data.message || "Account created successfully!" });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});