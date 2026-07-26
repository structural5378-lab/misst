// Centralized NotificationService — the single push delivery layer for MIST.
//
// All push delivery flows through here. Firebase Cloud Messaging (FCM) is the
// ONLY active provider. The provider interface is modular so additional providers
// (e.g. APNs for native iOS) can be registered in ACTIVE_PROVIDERS later without
// touching any caller.
//
// In-app delivery (the Notification DB record) is owned by the engine in
// notifications.ts; this service owns the push channel only.

import { sendFcmMulticast } from "./fcm.ts";

// A push provider sends a prepared FCM-style message payload to a list of
// device tokens and returns { sent, failed, errors }.
const fcmProvider = {
  name: "fcm",
  async send(tokens, payload) {
    return sendFcmMulticast(tokens, payload);
  },
};

// Active push providers, applied in order. Register an APNs provider here when
// native iOS push is added.
const ACTIVE_PROVIDERS = [fcmProvider];

export const NotificationService = {
  // Send a push notification to the given tokens via the active provider(s).
  async sendPush(tokens, payload) {
    if (!tokens || tokens.length === 0) return { sent: 0, failed: 0, errors: [] };
    const merged = { sent: 0, failed: 0, errors: [] };
    for (const provider of ACTIVE_PROVIDERS) {
      const res = await provider.send(tokens, payload);
      merged.sent += res.sent || 0;
      merged.failed += res.failed || 0;
      if (Array.isArray(res.errors)) merged.errors.push(...res.errors);
    }
    return merged;
  },

  // Convenience: send to a single token.
  async sendPushOne(token, payload) {
    return this.sendPush([token], payload);
  },
};