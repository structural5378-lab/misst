import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { NotificationService } from "../../shared/notificationService.ts";
import { getCategoryMeta } from "../../shared/notificationTypes.ts";

// Retry automation: re-attempts NotificationDelivery records stuck in "failed"
// with exponential backoff (60s, 2m, 4m, 8m, 16m), up to max_attempts (default 5).
// After exhausting attempts, marks the delivery "expired". On each attempt it
// re-sends the FCM push to the recipient's currently-active device tokens and
// purges any tokens FCM rejects as UNREGISTERED / INVALID_ARGUMENT.
//
// Invoked on a schedule (every 5 minutes) via create_automation. Runs as the
// service role; no authenticated user context required.
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const now = new Date();
  const nowIso = now.toISOString();

  // Pull a batch of failed deliveries due for retry.
  let due = [];
  try {
    due = await base44.asServiceRole.entities.NotificationDelivery.filter(
      { status: "failed" },
      "-created_date",
      100
    );
  } catch (e) {
    return Response.json({ ok: false, error: "fetch failed: " + (e?.message || e) });
  }

  const retryable = (due || []).filter((d) => {
    if (!d || d.attempts >= (d.max_attempts || 5)) return false;
    if (!d.next_retry_at) return true;
    return new Date(d.next_retry_at).getTime() <= now.getTime();
  });

  let retried = 0;
  let succeeded = 0;
  let expired = 0;
  let purged = 0;

  for (const d of retryable) {
    // Load the source notification (for payload rebuild).
    let notif = null;
    try {
      notif = await base44.asServiceRole.entities.Notification.get(d.notification_id).catch(() => null);
    } catch {
      notif = null;
    }
    if (!notif) {
      // Source gone — expire the delivery.
      try {
        await base44.asServiceRole.entities.NotificationDelivery.update(d.id, {
          status: "expired", failed_at: nowIso,
        });
      } catch {}
      expired++;
      continue;
    }

    // Fetch the recipient's currently-active tokens.
    let tokens = [];
    try {
      tokens = await base44.asServiceRole.entities.DeviceToken.filter(
        { user_id: d.recipient_id, is_active: true },
        "-created_date",
        10
      );
    } catch {}
    const tokenList = (tokens || []).map((t) => t.token).filter(Boolean);

    const meta = getCategoryMeta(notif.type || "system");
    const payload: any = {
      notification: { title: notif.title || "MIST", body: notif.message || "" },
      data: {
        link: String(notif.link || "/notifications"),
        type: String(notif.type || "system"),
        community_id: String(notif.community_id || ""),
        tag: meta.tag,
        color: meta.color,
        requireInteraction: meta.requireInteraction ? "1" : "0",
      },
      android: { notification: { icon: "https://insomniacsgmrs.com/uploads/mist-icon.png", sound: meta.sound ? "default" : undefined, tag: meta.tag, color: meta.color } },
      apns: { payload: { aps: { sound: meta.sound ? "default" : undefined } } },
      webpush: { notification: { icon: "https://insomniacsgmrs.com/uploads/mist-icon.png", badge: "https://insomniacsgmrs.com/uploads/mist-icon.png", tag: meta.tag, requireInteraction: !!meta.requireInteraction } },
    };

    const res = await NotificationService.sendPush(tokenList, payload);
    const invalid = res.invalidTokens || [];
    if (invalid.length) {
      try {
        await base44.asServiceRole.entities.DeviceToken.updateMany(
          { token: { $in: invalid } },
          { $set: { is_active: false } }
        ).catch(() => {});
        purged += invalid.length;
      } catch {}
    }

    const nextAttempt = (d.attempts || 0) + 1;
    const max = d.max_attempts || 5;
    const backoffMs = Math.min(60_000 * Math.pow(2, nextAttempt - 1), 16 * 60_000);

    if (res.failed === 0 && res.sent > 0) {
      try {
        await base44.asServiceRole.entities.NotificationDelivery.update(d.id, {
          status: "sent",
          attempts: nextAttempt,
          sent_at: nowIso,
          last_error: "",
          next_retry_at: "",
        });
      } catch {}
      succeeded++;
    } else if (nextAttempt >= max) {
      try {
        await base44.asServiceRole.entities.NotificationDelivery.update(d.id, {
          status: "expired",
          attempts: nextAttempt,
          failed_at: nowIso,
          last_error: (res.errors[0] || "retries exhausted").slice(0, 240),
          next_retry_at: "",
        });
      } catch {}
      expired++;
    } else {
      try {
        await base44.asServiceRole.entities.NotificationDelivery.update(d.id, {
          attempts: nextAttempt,
          last_error: (res.errors[0] || "retry failed").slice(0, 240),
          next_retry_at: new Date(now.getTime() + backoffMs).toISOString(),
        });
      } catch {}
    }
    retried++;
  }

  return Response.json({ ok: true, retried, succeeded, expired, purged, considered: (due || []).length });
});