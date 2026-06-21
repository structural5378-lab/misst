import { useEffect, useState } from "react";

const STORAGE_KEY = "pa_subscription_prompted";

export default function NotificationPrompt() {
  const [showButton, setShowButton] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return;

    // Poll for SDK availability for up to 20 seconds
    const pollInterval = setInterval(() => {
      const pa = window.PushAlertCo || window.pa_push;
      if (pa?.triggerOptIn || pa?.subscribe) {
        clearInterval(pollInterval);
        setSdkReady(true);
        // Try auto-subscribe
        if (pa.triggerOptIn) {
          pa.triggerOptIn();
        } else if (pa.subscribe) {
          pa.subscribe();
        }
        localStorage.setItem(STORAGE_KEY, "1");
        setShowButton(false);
      }
    }, 500);

    // Fallback: show manual button after 2 seconds if SDK not ready
    const timeout = setTimeout(() => {
      clearInterval(pollInterval);
      const pa = window.PushAlertCo || window.pa_push;
      if (pa?.triggerOptIn || pa?.subscribe) {
        setSdkReady(true);
      } else {
        setShowButton(true);
      }
    }, 2000);

    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeout);
    };
  }, []);

  const handleEnable = () => {
    const pa = window.PushAlertCo || window.pa_push;
    if (pa?.triggerOptIn) {
      pa.triggerOptIn();
    } else if (pa?.subscribe) {
      pa.subscribe();
    } else if (typeof Notification !== "undefined") {
      Notification.requestPermission();
    }
    localStorage.setItem(STORAGE_KEY, "1");
    setShowButton(false);
  };

  // Expose manual trigger for Dashboard
  useEffect(() => {
    window.enableNotificationsManual = handleEnable;
    return () => { delete window.enableNotificationsManual; };
  }, [handleEnable]);

  if (!showButton) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-50">
      <div className="bg-violet-600 text-white rounded-xl p-4 shadow-lg">
        <p className="text-sm font-semibold mb-2">Enable Notifications</p>
        <p className="text-xs text-white/90 mb-3">Stay updated with important alerts and community news.</p>
        <button
          onClick={handleEnable}
          className="w-full bg-white text-violet-600 text-sm font-semibold py-2.5 rounded-lg hover:bg-white/90 transition-colors"
        >
          Enable Notifications
        </button>
      </div>
    </div>
  );
}