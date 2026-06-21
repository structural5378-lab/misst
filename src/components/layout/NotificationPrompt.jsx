import { useEffect } from "react";

const STORAGE_KEY = "pa_subscription_prompted";

export default function NotificationPrompt() {
  useEffect(() => {
    // Only prompt once ever
    if (localStorage.getItem(STORAGE_KEY)) return;

    const trySubscribe = () => {
      try {
        if (window.PushAlertCo?.triggerOptIn) {
          window.PushAlertCo.triggerOptIn();
        } else if (window.PushAlertCo?.subscribe) {
          window.PushAlertCo.subscribe();
        } else {
          // Fallback: native browser permission
          Notification.requestPermission();
        }
        localStorage.setItem(STORAGE_KEY, "1");
      } catch {}
    };

    // Wait for PushAlert SDK to load, then prompt after a short delay
    const timer = setTimeout(() => {
      if (document.readyState === "complete") {
        trySubscribe();
      } else {
        window.addEventListener("load", trySubscribe, { once: true });
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return null;
}