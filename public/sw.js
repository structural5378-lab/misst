/* MIST FCM Web Push service worker (production-hardened).
   - Background push delivery (rich system notification: title, body, icon, badge,
     image, vibration, sound, tag, requireInteraction where supported)
   - Foreground push forwarded to the focused client (graceful, no duplicate
     system notification while the app is open) — InAppNotificationCenter renders it
   - notificationclick deep-links into the correct app screen and focuses an
     existing MIST tab if one is already open (no duplicates)
   - pushsubscriptionchange re-notifies the client to re-subscribe & re-register
*/
const LOGO_URL = "https://media.base44.com/images/public/6a24d788be1af31b2258fab2/5e4366214_insomniacsgmrslogo.png";

const SW_VERSION = "mist-fcm-v5";

self.addEventListener("install", () => { self.skipWaiting(); });
self.addEventListener("activate", (event) => {
  // Claim clients immediately so the new SW controls the page on update,
  // replacing any stale PushAlert worker that was previously registered.
  event.waitUntil((async () => {
    await self.clients.claim();
    try {
      const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      clients.forEach((c) => c.postMessage({ type: "sw-activated", version: SW_VERSION }));
    } catch { /* ignore */ }
  })());
});

function readPayload(event) {
  if (!event.data) return {};
  try { return event.data.json(); } catch { try { return JSON.parse(event.data.text()); } catch { return {}; } }
}

function extract(payload) {
  const data = payload.data || {};
  const notification = payload.notification || {};
  let fcmOptions = payload.fcm_options || {};
  if (!fcmOptions && data.fcm_options) {
    try { fcmOptions = typeof data.fcm_options === "string" ? JSON.parse(data.fcm_options) : data.fcm_options; } catch { fcmOptions = {}; }
  }
  const title = notification.title || data.title || "MIST";
  const body = notification.body || data.body || "";
  const image = notification.image || data.image || "";
  const link = fcmOptions.link || data.link || "/notifications";
  const tag = data.tag || data.related_object_type || "mist";
  const vibrate = (() => {
    if (!data.vibrate) return undefined;
    try { return String(data.vibrate).split(",").map((n) => parseInt(n, 10)).filter((n) => !isNaN(n)); }
    catch { return undefined; }
  })();
  const requireInteraction = data.requireInteraction === "1" || data.requireInteraction === true;
  return { title, body, image, link, tag, vibrate, requireInteraction };
}

self.addEventListener("push", (event) => {
  const payload = readPayload(event);
  const { title, body, image, link, tag, vibrate, requireInteraction } = extract(payload);
  event.waitUntil((async () => {
    try {
      const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const focused = clients.find((c) => c.focused);
      if (focused) {
        // App is in the foreground — forward and skip the system notification.
        focused.postMessage({ type: "fcm-push", payload });
        return;
      }
    } catch {}
    const notifOptions = {
      body,
      icon: LOGO_URL,
      badge: LOGO_URL,
      data: { link },
      tag,
      requireInteraction,
    };
    if (image) notifOptions.image = image;
    if (vibrate && vibrate.length) notifOptions.vibrate = vibrate;
    await self.registration.showNotification(title, notifOptions);
  })());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = (event.notification.data && event.notification.data.link) || "/notifications";
  const target = new URL(link, self.location.origin).href;
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    // Focus an existing MIST tab if one is already open (avoid duplicates).
    for (const c of all) {
      if ("focus" in c) {
        try {
          await c.focus();
          if (c.navigate) await c.navigate(target);
        } catch {}
        return;
      }
    }
    try { await self.clients.openWindow(target); } catch {}
  })());
});

self.addEventListener("pushsubscriptionchange", () => {
  // Browser invalidated the subscription — ask the open client to re-subscribe.
  self.clients.matchAll({ type: "window", includeUncontrolled: true })
    .then((clients) => clients.forEach((c) => c.postMessage({ type: "fcm-subscription-changed" })))
    .catch(() => {});
});
