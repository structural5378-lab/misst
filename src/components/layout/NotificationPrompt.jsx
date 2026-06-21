import { useEffect, useState } from "react";

const STORAGE_KEY = "pa_subscription_prompted";

export default function NotificationPrompt() {
  const [showButton, setShowButton] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [swRegistered, setSwRegistered] = useState(false);

  // Register service worker explicitly on mount
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/serviceworker.js')
        .then(reg => {
          console.log('Service Worker registered:', reg.scope);
          setSwRegistered(true);
        })
        .catch(err => {
          console.error('Service Worker registration failed:', err);
          setSwRegistered(false);
        });
    }
  }, []);

  useEffect(() => {
    // Check if already subscribed
    try {
      const subscribed = localStorage.getItem("pa_subscription_active") === "1";
      setIsSubscribed(subscribed);
      if (subscribed) return;
    } catch {}

    if (localStorage.getItem(STORAGE_KEY)) return;

    // Poll for SDK availability for up to 10 seconds
    let pollCount = 0;
    const pollInterval = setInterval(() => {
      pollCount++;
      const pa = window.PushAlertCo || window.pa_push;
      
      if (pa?.triggerOptIn || pa?.subscribe) {
        clearInterval(pollInterval);
        setSdkReady(true);
        // Don't auto-subscribe - show button instead
        setShowButton(true);
      } else if (pollCount >= 20) {
        // After 10 seconds, give up and show button anyway
        clearInterval(pollInterval);
        setShowButton(true);
      }
    }, 500);

    return () => {
      clearInterval(pollInterval);
    };
  }, []);

  const handleEnable = async () => {
    const pa = window.PushAlertCo || window.pa_push;
    
    console.log("Attempting to enable notifications...", { pa, hasTriggerOptIn: !!pa?.triggerOptIn, hasSubscribe: !!pa?.subscribe });
    
    try {
      // Try PushAlert methods first
      if (pa?.triggerOptIn) {
        console.log("Calling triggerOptIn...");
        pa.triggerOptIn();
      } else if (pa?.subscribe) {
        console.log("Calling subscribe...");
        pa.subscribe();
      } else {
        console.log("PushAlert SDK not found, trying native...");
        if (typeof Notification !== "undefined") {
          const perm = await Notification.requestPermission();
          console.log("Native permission:", perm);
        }
      }
      
      // Mark as prompted
      localStorage.setItem(STORAGE_KEY, "1");
      
      // Check subscription status multiple times
      const checkStatus = () => {
        try {
          const isNowSubscribed = window.pa_push?.isSubscribed?.() || localStorage.getItem("pa_subscription_active") === "1";
          console.log("Subscription check:", { isNowSubscribed, pa_push: !!window.pa_push, pushAlertCo: !!window.PushAlertCo });
          if (isNowSubscribed) {
            localStorage.setItem("pa_subscription_active", "1");
            setIsSubscribed(true);
            setShowButton(false);
            return true;
          }
        } catch (e) {
          console.log("Error checking subscription:", e);
        }
        return false;
      };
      
      // Check at 2s, 4s, 6s
      setTimeout(() => { if (!checkStatus()) setTimeout(() => { if (!checkStatus()) setTimeout(checkStatus, 2000); }, 2000); }, 2000);
      
    } catch (error) {
      console.error("Error enabling notifications:", error);
    }
  };

  // Expose manual trigger for Dashboard
  useEffect(() => {
    window.enableNotificationsManual = handleEnable;
    window.checkNotificationStatus = () => {
      const pa = window.PushAlertCo || window.pa_push;
      const status = {
        sdkLoaded: !!pa,
        hasTriggerOptIn: !!pa?.triggerOptIn,
        hasSubscribe: !!pa?.subscribe,
        isSubscribed: pa?.isSubscribed?.() || localStorage.getItem("pa_subscription_active") === "1",
        permission: typeof Notification !== "undefined" ? Notification.permission : "unknown",
        swRegistered,
      };
      console.log("Notification status:", status);
      return status;
    };
    return () => { 
      delete window.enableNotificationsManual;
      delete window.checkNotificationStatus;
    };
  }, [handleEnable, swRegistered]);

  if (isSubscribed) return null;
  if (!showButton) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-50">
      <div className="bg-violet-600 text-white rounded-xl p-4 shadow-lg">
        <p className="text-sm font-semibold mb-2">🔔 Enable Notifications</p>
        <p className="text-xs text-white/90 mb-3">Get alerts for new messages, location requests, and community updates - even when the app is closed.</p>
        <button
          onClick={handleEnable}
          className="w-full bg-white text-violet-600 text-sm font-semibold py-3 rounded-lg hover:bg-white/90 transition-colors"
        >
          Enable Push Notifications
        </button>
      </div>
    </div>
  );
}