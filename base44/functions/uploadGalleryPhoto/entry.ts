import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const BRIDGE_URL = "https://insomniacsgmrs.com/mist-api.php";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const secret = Deno.env.get("MIST_BRIDGE_SECRET") || "";
    const body = await req.json();
    const { fileBase64, fileName, mimeType, caption, gathering_label, uploader_name } = body;

    if (!fileBase64 || !fileName) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    // Decode base64 to binary and build a Blob for FormData
    const binaryStr = atob(fileBase64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: mimeType || "image/jpeg" });

    // Forward the file to the PHP bridge
    const outForm = new FormData();
    outForm.append("action", "upload_photo");
    outForm.append("file", blob, fileName);

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
      return Response.json({ error: "Bridge returned invalid response: " + text }, { status: 502 });
    }

    if (!data.success) {
      return Response.json({ error: data.error || "Upload failed" }, { status: 500 });
    }

    // Save record to GatheringPhoto entity
    const photo = await base44.asServiceRole.entities.GatheringPhoto.create({
      photo_url: data.url,
      caption: caption || "",
      gathering_label: gathering_label || "",
      uploader_name: uploader_name || "",
    });

    return Response.json({ success: true, photo });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});