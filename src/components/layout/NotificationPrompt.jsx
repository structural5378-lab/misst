import { useEffect } from "react";

const STORAGE_KEY = "pa_subscription_prompted";

export default function NotificationPrompt() {
  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return;

    let attempts = 0;
    const maxAttempts = 20; // try for up to 20 seconds

    const trySubscribe = () => {
      attempts++;
      const pa = window.PushAlertCo;

      if (pa?.triggerOptIn) {
        pa.triggerOptIn();
        localStorage.setItem(STORAGE_KEY, "1");
        return;
      }
      if (pa?.subscribe) {
        pa.subscribe();
        localStorage.setItem(STORAGE_KEY, "1");
        return;
      }

      // SDK not ready yet — retry
      if (attempts < maxAttempts) {
        setTimeout(trySubscribe, 1000);
      } else {
        // Last resort: native browser permission
        if (typeof Notification !== "undefined") {
          Notification.requestPermission();
        }
        localStorage.setItem(STORAGE_KEY, "1");
      }
    };

    // Start after 2s to let PushAlert SDK initialize
    const timer = setTimeout(trySubscribe, 2000);
    return () => clearTimeout(timer);
  }, []);

  return null;
}