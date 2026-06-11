import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const BRIDGE_URL = "https://insomniacsgmrs.com/mist-api.php";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { username, password } = body;

    if (!username || !password) {
      return Response.json({ error: "Username and password required" }, { status: 400 });
    }

    const secret = Deno.env.get("MIST_BRIDGE_SECRET") || "";

    const res = await fetch(BRIDGE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Mist-Secret": secret,
      },
      body: JSON.stringify({ action: "login", username, password }),
    });

    const text = await res.text();
    console.log("Bridge HTTP status:", res.status);
    console.log("Bridge raw response:", text.slice(0, 500));
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return Response.json({ error: "Bridge returned invalid response", raw: text.slice(0, 300) }, { status: 502 });
    }

    if (!data.success) {
      return Response.json({ error: data.error || "Invalid username or password" }, { status: 401 });
    }

    // MyBB default usergroup IDs:
    // 4 = Administrator, 3 = Super Moderator, 6 = Moderator, 2 = Registered
    const adminGroups = [4, 3];
    const modGroups = [6];
    const usergroup = parseInt(data.usergroup || 2);
    const additionalGroups = (data.additionalgroups || "")
      .split(",")
      .map((g) => parseInt(g.trim()))
      .filter(Boolean);

    const allGroups = [usergroup, ...additionalGroups];
    const isAdmin = allGroups.some((g) => adminGroups.includes(g));
    const isMod = allGroups.some((g) => modGroups.includes(g));

    let role = "member";
    if (isAdmin) role = "admin";
    else if (isMod) role = "moderator";

    return Response.json({
      success: true,
      user: {
        uid: data.uid,
        username: data.username,
        password, // stored so posting/replying works without re-auth
        email: data.email,
        usergroup,
        role, // "admin" | "moderator" | "member"
        canEdit: isAdmin || isMod,
        avatar: data.avatar || null,
        postcount: parseInt(data.postcount || 0),
        reputation: parseInt(data.reputation || 0),
        threadcount: parseInt(data.threadcount || 0),
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});