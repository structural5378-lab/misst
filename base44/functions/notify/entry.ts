import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { dispatchNotifications, NOTIF_TYPES } from "../../shared/notifications.ts";

// notify — the MIST Notification Service HTTP endpoint.
//
// Any feature (frontend or backend) emits an event here instead of implementing
// its own notification logic. The shared engine resolves recipients, honors
// per-user preferences, persists Notification records, and runs pluggable
// delivery (in-app today; FCM/email/SMS in Phase 2).
//
// Body:
//   type*        — one of NOTIF_TYPES
//   title|message* — at least one required
//   recipient_ids?: string[]   — explicit recipients (e.g. a DM target)
//   community_id?: string      — fan out to all active members of a community
//   sender_id?, sender_name?    — defaults to the authenticated caller
//   related_object_id?, related_object_type?, link?, metadata?, skip_sender?

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    if (!body.type || !NOTIF_TYPES.includes(body.type)) {
      return Response.json({ error: 'Invalid or missing type' }, { status: 400 });
    }
    if (!body.title && !body.message) {
      return Response.json({ error: 'title or message is required' }, { status: 400 });
    }
    if (!Array.isArray(body.recipient_ids) && !body.community_id) {
      return Response.json({ error: 'recipient_ids or community_id is required' }, { status: 400 });
    }

    const event = {
      ...body,
      sender_id: body.sender_id || user.id,
      sender_name:
        body.sender_name ||
        user.display_name ||
        user.full_name ||
        user.username ||
        '',
    };

    const result = await dispatchNotifications(base44, event);
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});