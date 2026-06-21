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
    // Log all available SDK properties for debugging
    console.log("=== PushAlert SDK Debug ===");
    console.log("PushAlertCo:", window.PushAlertCo);
    console.log("pa_push:", window.pa_push);
    console.log("All PushAlertCo keys:", window.PushAlertCo ? Object.keys(window.PushAlertCo) : "not found");
    console.log("All pa_push keys:", window.pa_push ? Object.keys(window.pa_push) : "not found");
    
    try {
      // Try all possible method names
      const methodsToTry = [
        () => window.PushAlertCo?.triggerOptIn?.(),
        () => window.PushAlertCo?.subscribe?.(),
        () => window.PushAlertCo?.optIn?.(),
        () => window.PushAlertCo?.push?.(),
        () => window.pa_push?.triggerOptIn?.(),
        () => window.pa_push?.subscribe?.(),
        () => window.pa_push?.optIn?.(),
        () => window.pa_push?.push?.(),
      ];
      
      let called = false;
      for (const method of methodsToTry) {
        try {
          const result = method();
          if (result !== undefined) {
            console.log("Successfully called method:", method.toString());
            called = true;
            break;
          }
        } catch (e) {
          console.log("Method failed:", method.toString(), e);
        }
      }
      
      if (!called) {
        console.log("No SDK method found, trying native permission...");
        if (typeof Notification !== "undefined") {
          const perm = await Notification.requestPermission();
          console.log("Native permission:", perm);
          if (perm === "granted") {
            localStorage.setItem("pa_subscription_active", "1");
            setIsSubscribed(true);
            setShowButton(false);
            return;
          }
        }
      }
      
      // Mark as prompted
      localStorage.setItem(STORAGE_KEY, "1");
      
      // Check subscription status after delay
      setTimeout(() => {
        const isNowSubscribed = window.pa_push?.isSubscribed?.() || localStorage.getItem("pa_subscription_active") === "1";
        console.log("Post-enable check:", { isNowSubscribed });
        if (isNowSubscribed) {
          localStorage.setItem("pa_subscription_active", "1");
          setIsSubscribed(true);
          setShowButton(false);
        }
      }, 3000);
      
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