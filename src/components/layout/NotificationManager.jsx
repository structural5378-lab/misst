import { useEffect } from "react";
import { isSubscribed, getCurrentToken, registerToken, getVapidKey } from "@/lib/fcmPush";

// Mounted once in AppLayout. Ensures the FCM service worker is registered and,
// if the user is already subscribed, keeps the backend token fresh.
export default function NotificationManager() {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
        const vapid = await getVapidKey();
        if (!vapid) return; // FCM web push not configured yet
        await navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
        await navigator.serviceWorker.ready;
        if (await isSubscribed()) {
          const token = await getCurrentToken();
          if (token) await registerToken(token);
        }
      } catch (e) {
        console.warn("FCM manager init", e);
      } finally {
        cancelled = false;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}