import { useEffect } from "react";
import { ensureSubscribed } from "@/lib/fcmPush";
import InAppNotificationCenter from "@/components/notifications/InAppNotificationCenter";
import ChatNotificationListener from "@/components/notifications/ChatNotificationListener";

// Mounted once in AppLayout. Ensures the FCM service worker is registered and, if
// the user is already subscribed, keeps the backend token fresh. Also keeps the
// service worker up to date and cleans up stale third-party workers. Foreground
// push display is handled by <InAppNotificationCenter /> (rendered below), which
// listens to the SW 'fcm-push' messages directly.
export default function NotificationManager() {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    const ensureFresh = async () => {
      try { await ensureSubscribed(); } catch (e) { console.warn("FCM manager init", e); }
    };

    const onMessage = async (event) => {
      const msg = event.data || {};
      if (msg.type === "fcm-subscription-changed") {
        // Browser invalidated the subscription — re-mint & re-register via the SDK.
        try { await ensureSubscribed(); } catch (e) { console.warn("refresh on sub change", e); }
      }
      // Foreground 'fcm-push' is handled by InAppNotificationCenter.
    };

    // Remove any stale third-party service workers (e.g. leftover PushAlert SW)
    // so only the MIST FCM worker (sw.js) remains registered.
    const purgeStaleWorkers = async () => {
      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const r of regs) {
          const url = (r.active && r.active.scriptURL) || (r.installing && r.installing.scriptURL) || (r.waiting && r.waiting.scriptURL) || "";
          if (url && !url.includes("/sw.js")) {
            await r.unregister().catch(() => {});
          }
        }
      } catch { /* ignore */ }
    };

    const onFocus = () => { ensureFresh(); };

    ensureFresh();
    purgeStaleWorkers();
    // Force-check for a new sw.js version on load.
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).then((reg) => reg.update().catch(() => {})).catch(() => {});
    navigator.serviceWorker.addEventListener("message", onMessage);
    window.addEventListener("focus", onFocus);
    window.addEventListener("online", onFocus);

    return () => {
      navigator.serviceWorker.removeEventListener("message", onMessage);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("online", onFocus);
    };
  }, []);

  return (
    <>
      <ChatNotificationListener />
      <InAppNotificationCenter />
    </>
  );
}