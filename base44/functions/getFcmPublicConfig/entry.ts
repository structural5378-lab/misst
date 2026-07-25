import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

// Returns the FCM Web Push VAPID public key (safe to expose to the browser).
// Used by the client to subscribe via the Push API. No auth required — it is a
// public key. Returns { vapidPublicKey: string|null }.
Deno.serve(async () => {
  try {
    const vapid = Deno.env.get("FCM_WEB_VAPID_KEY");
    return Response.json({ vapidPublicKey: vapid ? vapid : null });
  } catch (error) {
    return Response.json({ vapidPublicKey: null, error: error.message }, { status: 500 });
  }
});