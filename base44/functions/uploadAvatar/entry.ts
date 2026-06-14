import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const BRIDGE_URL = "https://insomniacsgmrs.com/mist-api.php";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const secret = Deno.env.get("MIST_BRIDGE_SECRET") || "";
    const body = await req.json();
    const { fileBase64, fileName, mimeType, username } = body;

    if (!fileBase64 || !username) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Decode base64 to binary blob
    const binaryStr = atob(fileBase64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: mimeType || "image/jpeg" });

    // Send to PHP bridge as a multipart upload
    const outForm = new FormData();
    const botPassword = Deno.env.get("MYBB_BOT_PASSWORD") || "";
    outForm.append("action", "upload_avatar");
    outForm.append("username", username);
    outForm.append("bot_password", botPassword);
    outForm.append("file", blob, fileName || "avatar.jpg");

    const res = await fetch(BRIDGE_URL, {
      method: "POST",
      headers: { "X-Mist-Secret": secret },
      body: outForm,
    });

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return Response.json({ error: "Bridge returned invalid response: " + text.slice(0, 200) }, { status: 502 });
    }

    if (!data.success) {
      return Response.json({ error: data.error || "Upload failed" }, { status: 500 });
    }

    return Response.json({ success: true, avatar_url: data.avatar_url });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});