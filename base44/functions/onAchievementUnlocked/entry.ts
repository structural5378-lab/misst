import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { dispatchNotifications } from "../../shared/notifications.ts";

// Entity automation: fires when a UserAchievement is created.
// Emits an achievement_unlocked or badge_earned notification to the user depending
// on whether the achievement id/collection looks like a badge. Tap opens the
// Achievements page. The service honors User.notif_settings (achievements / badges).
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const body = await req.json().catch(() => ({}));
  const ua = body.data || body;
  if (!ua || !ua.user_id) return Response.json({ ok: true, skipped: true });
  try {
    const name = ua.achievement_name || "a new achievement";
    const isBadge = /badge/i.test(ua.achievement_id || "") || /badge/i.test(ua.collection || "");
    const type = isBadge ? "badge_earned" : "achievement_unlocked";
    const result = await dispatchNotifications(base44, {
      type,
      title: isBadge ? `You earned the ${name} badge!` : `You unlocked the ${name} achievement!`,
      message: "",
      recipient_ids: [String(ua.user_id)],
      related_object_id: String(ua.achievement_id || ""),
      related_object_type: isBadge ? "badge" : "achievement",
      sender_id: "",
      sender_name: "MIST",
    });
    return Response.json({ ok: true, result });
  } catch (e) {
    return Response.json({ ok: false, error: e?.message || String(e) });
  }
});