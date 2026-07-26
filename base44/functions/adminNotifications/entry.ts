import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { dispatchNotifications } from "../../shared/notifications.ts";
import { getCategoryMeta } from "../../shared/notificationTypes.ts";
import { sendFcmMulticast } from "../../shared/fcm.ts";

// Notification Admin Console — admin-only endpoint for the Test Console and
// Delivery Logs. All actions are audit-logged to PlatformAuditLog.
//   action: "send"  → test/broadcast via the centralized Notification Service
//   action: "retry" → re-attempt a single failed NotificationDelivery

const ICON = "https://insomniacsgmrs.com/uploads/mist-icon.png";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const action = body.action || "send";

    const audit = (act, target, notes, result = "") =>
      base44.asServiceRole.entities.PlatformAuditLog.create({
        admin_id: user.id,
        admin_email: user.email || "",
        action: act,
        target_type: "notification",
        target_id: target || "",
        notes: JSON.stringify(notes || {}),
        new_value: result,
      }).catch(() => null);

    if (action === "send") {
      const { target, target_user_id, target_community_id, type, title, message, link, priority, sound, icon } = body;
      if (!title || !type) return Response.json({ error: "title and type required" }, { status: 400 });
      if (!["self", "user", "community", "all"].includes(target)) return Response.json({ error: "invalid target" }, { status: 400 });

      let recipient_ids = [];
      let communityId = "";
      if (target === "self") recipient_ids = [user.id];
      else if (target === "user") {
        if (!target_user_id) return Response.json({ error: "target_user_id required" }, { status: 400 });
        recipient_ids = [String(target_user_id)];
      } else if (target === "community") {
        if (!target_community_id) return Response.json({ error: "target_community_id required" }, { status: 400 });
        communityId = String(target_community_id);
      } else if (target === "all") {
        const users = await base44.asServiceRole.entities.User.list("-created_date", 2000).catch(() => []);
        recipient_ids = (users || []).map((u) => u.id).filter(Boolean);
      }

      const meta = {};
      if (priority) meta.priority = String(priority);
      if (sound !== undefined) meta.sound = !!sound;
      if (icon) meta.icon = String(icon);

      const result = await dispatchNotifications(base44, {
        type,
        title,
        message: message || "",
        link: link || "",
        recipient_ids,
        community_id: communityId,
        sender_id: user.id,
        sender_name: user.full_name || user.email || "Admin",
        metadata: JSON.stringify(meta),
      });

      const actName = target === "all" || target === "community" ? "notification_broadcast" : "notification_test";
      await audit(actName, target_community_id || user.id, { target, type, title, recipients: result.recipients?.length || 0 }, `created:${result.created || 0}`);

      // For self-target, return the most recent delivery for rich feedback.
      let delivery = null;
      if (target === "self") {
        const d = await base44.asServiceRole.entities.NotificationDelivery.filter({ recipient_id: user.id }, "-created_date", 1).catch(() => []);
        delivery = (d && d[0]) || null;
      }
      return Response.json({ ok: true, created: result.created || 0, recipients: result.recipients?.length || 0, delivery });
    }

    if (action === "retry") {
      const { delivery_id } = body;
      if (!delivery_id) return Response.json({ error: "delivery_id required" }, { status: 400 });
      const d = await base44.asServiceRole.entities.NotificationDelivery.get(delivery_id).catch(() => null);
      if (!d) return Response.json({ error: "delivery not found" }, { status: 404 });

      let notif = null;
      if (d.notification_id) notif = await base44.asServiceRole.entities.Notification.get(d.notification_id).catch(() => null);
      const tokens = await base44.asServiceRole.entities.DeviceToken.filter({ user_id: d.recipient_id, is_active: true }, "-created_date", 10).catch(() => []);
      const tokenList = (tokens || []).map((t) => t.token).filter(Boolean);

      const meta = getCategoryMeta(notif?.type || d.type || "system");
      const payload: any = {
        notification: { title: notif?.title || d.title || "MIST", body: notif?.message || "" },
        data: { link: String(notif?.link || "/notifications"), type: String(notif?.type || d.type || "system"), community_id: String(notif?.community_id || ""), tag: meta.tag, color: meta.color },
        android: { notification: { icon: ICON, sound: meta.sound ? "default" : undefined, tag: meta.tag, color: meta.color } },
        apns: { payload: { aps: { sound: meta.sound ? "default" : undefined } } },
        webpush: { notification: { icon: ICON, badge: ICON, tag: meta.tag, requireInteraction: !!meta.requireInteraction } },
      };

      const res = await sendFcmMulticast(tokenList, payload);
      const nowIso = new Date().toISOString();
      const nextAttempt = (d.attempts || 0) + 1;
      const firstOk = (res.results || []).find((r) => r.ok);
      let status = "failed";
      if (res.sent > 0) status = "sent";
      await base44.asServiceRole.entities.NotificationDelivery.update(d.id, {
        status,
        attempts: nextAttempt,
        sent_at: status === "sent" ? nowIso : "",
        last_error: status === "failed" ? (res.errors[0] || "retry failed").slice(0, 240) : "",
        next_retry_at: status === "failed" ? new Date(Date.now() + Math.min(60000 * Math.pow(2, nextAttempt - 1), 16 * 60000)).toISOString() : "",
        fcm_message_id: firstOk?.messageId || "",
      }).catch(() => {});
      if ((res.invalidTokens || []).length) {
        await base44.asServiceRole.entities.DeviceToken.updateMany({ token: { $in: res.invalidTokens } }, { $set: { is_active: false } }).catch(() => {});
      }
      await audit("notification_retry", d.id, { recipient: d.recipient_id, type: d.type }, status);
      return Response.json({ ok: status !== "failed", status, fcmMessageId: firstOk?.messageId || "", sent: res.sent, failed: res.failed, errors: res.errors, invalidTokens: (res.invalidTokens || []).length });
    }

    return Response.json({ error: "unknown action" }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});