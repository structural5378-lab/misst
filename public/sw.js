/* MIST FCM Web Push service worker.
   - Background push delivery (system notification)
   - Foreground push forwarded to the focused client (graceful, no duplicate
     system notification while the app is open)
   - notificationclick deep-links into the correct app screen
   - pushsubscriptionchange re-notifies the client to re-subscribe & re-register
*/
const LOGO_URL = "https://media.base44.com/images/public/6a24d788be1af31b2258fab2/5e4366214_insomniacsgmrslogo.png";

self.addEventListener("install", () => { self.skipWaiting(); });
self.addEventListener("activate", (event) => { event.waitUntil(self.clients.claim()); });

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
  const link = fcmOptions.link || data.link || "/notifications";
  const tag = data.tag || data.related_object_type || "mist";
  return { title, body, link, tag };
}

self.addEventListener("push", (event) => {
  const payload = readPayload(event);
  const { title, body, link, tag } = extract(payload);
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
    await self.registration.showNotification(title, {
      body,
      icon: LOGO_URL,
      badge: LOGO_URL,
      data: { link },
      tag,
    });
  })());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = (event.notification.data && event.notification.data.link) || "/notifications";
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const c of all) {
      if ("focus" in c) {
        try {
          await c.focus();
          if (c.navigate) await c.navigate(new URL(link, self.location.origin).href);
        } catch {}
        return;
      }
    }
    try { await self.clients.openWindow(link); } catch {}
  })());
});

self.addEventListener("pushsubscriptionchange", () => {
  // Browser invalidated the subscription — ask the open client to re-subscribe.
  self.clients.matchAll({ type: "window", includeUncontrolled: true })
    .then((clients) => clients.forEach((c) => c.postMessage({ type: "fcm-subscription-changed" })))
    .catch(() => {});
});
