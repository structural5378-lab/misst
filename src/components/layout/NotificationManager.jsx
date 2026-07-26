import { useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { isSubscribed, getCurrentToken, registerToken, getVapidKey, refreshSubscription } from "@/lib/fcmPush";

// Mounted once in AppLayout. Ensures the FCM service worker is registered and, if
// the user is already subscribed, keeps the backend token fresh. Also handles
// foreground push (toast) and browser-initiated subscription refresh.
export default function NotificationManager() {
  const { toast } = useToast();

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    const ensureFresh = async () => {
      try {
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
      }
    };

    const onMessage = async (event) => {
      const msg = event.data || {};
      if (msg.type === "fcm-push") {
        // Foreground: graceful in-app toast instead of a system notification.
        const p = msg.payload || {};
        const data = p.data || {};
        const notif = p.notification || {};
        const title = notif.title || data.title || "MIST";
        const body = notif.body || data.body || "";
        const link = data.link || (p.fcm_options && p.fcm_options.link) || "/notifications";
        toast({
          title,
          description: body,
          // Tap the toast to navigate to the relevant screen.
          onClick: () => { try { window.location.href = link; } catch { /* ignore */ } },
        });
      } else if (msg.type === "fcm-subscription-changed") {
        // Browser invalidated the subscription — re-subscribe & re-register.
        try { await refreshSubscription(); } catch (e) { console.warn("refresh on sub change", e); }
      }
    };

    const onFocus = () => { ensureFresh(); };

    ensureFresh();
    navigator.serviceWorker.addEventListener("message", onMessage);
    window.addEventListener("focus", onFocus);
    window.addEventListener("online", onFocus);

    return () => {
      navigator.serviceWorker.removeEventListener("message", onMessage);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("online", onFocus);
    };
  }, [toast]);

  return null;
}