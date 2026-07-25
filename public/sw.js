// MIST service worker — handles Firebase Cloud Messaging (FCM) web push.
// Registered with scope "/" by src/lib/fcmPush.js. No external SDK required.
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    try {
      data = { notification: { body: event.data ? event.data.text() : "" } };
    } catch {
      data = {};
    }
  }
  const n = data.notification || {};
  const d = data.data || {};
  const title = n.title || "MIST";
  const options = {
    body: n.body || "",
    icon: n.icon || "https://insomniacsgmrs.com/uploads/mist-icon.png",
    badge: n.badge || "https://insomniacsgmrs.com/uploads/mist-icon.png",
    data: { link: d.link || "/notifications", ...d },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = (event.notification.data && event.notification.data.link) || "/notifications";
  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of allClients) {
        if (client.url.includes(self.location.origin)) {
          client.focus();
          client.postMessage({ type: "navigate", link });
          return;
        }
      }
      return self.clients.openWindow(link);
    })()
  );
});
