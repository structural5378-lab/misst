import { useEffect } from "react";

export default function NotificationManager() {
  useEffect(() => {
    // PushAlert SDK handles service worker registration automatically
    // Just monitor subscription status
    const checkSubscription = () => {
      const pa = window.PushAlertCo || window.pa_push;
      const isSub = pa?.isSubscribed?.() || localStorage.getItem("pa_subscription_active") === "1";
      if (isSub) {
        localStorage.setItem("pa_subscription_active", "1");
      }
    };
    
    // Wait for SDK to load then check
    setTimeout(checkSubscription, 2000);
    const interval = setInterval(checkSubscription, 3000);
    setTimeout(() => clearInterval(interval), 15000);
  }, []);

  return null;
}