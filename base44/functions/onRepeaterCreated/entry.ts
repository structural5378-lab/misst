import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { dispatchNotifications } from "../../shared/notifications.ts";

// Entity automation: fires when a Repeater is created.
// Fans out a repeater_added notification to all active members of the repeater's
// community ("A new repeater has been added near you."). Tap opens the repeater
// details page. The service honors User.notif_settings (repeaters defaults off).
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const body = await req.json().catch(() => ({}));
  const r = body.data || body;
  if (!r || !r.id) return Response.json({ ok: true, skipped: true });
  if (!r.community_id) return Response.json({ ok: true, skipped: "no-community" });
  try {
    const desc = `${r.callsign || "Repeater"}${r.frequency ? ` · ${r.frequency} MHz` : ""}`;
    const result = await dispatchNotifications(base44, {
      type: "repeater_added",
      title: "A new repeater has been added near you.",
      message: desc,
      community_id: String(r.community_id),
      related_object_id: String(r.id),
      related_object_type: "repeater",
      image: r.image_url || "",
    });
    return Response.json({ ok: true, result });
  } catch (e) {
    return Response.json({ ok: false, error: e?.message || String(e) });
  }
});