import { useEffect, useState } from "react";

const STORAGE_KEY = "pa_subscription_prompted";

export default function NotificationPrompt() {
  const [showButton, setShowButton] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return;

    let attempts = 0;
    const maxAttempts = 20;

    const trySubscribe = () => {
      attempts++;
      const pa = window.PushAlertCo;

      if (pa?.triggerOptIn) {
        pa.triggerOptIn();
        localStorage.setItem(STORAGE_KEY, "1");
        setShowButton(false);
        return;
      }
      if (pa?.subscribe) {
        pa.subscribe();
        localStorage.setItem(STORAGE_KEY, "1");
        setShowButton(false);
        return;
      }

      if (attempts < maxAttempts) {
        setTimeout(trySubscribe, 1000);
      } else {
        if (typeof Notification !== "undefined") {
          Notification.requestPermission();
        }
        localStorage.setItem(STORAGE_KEY, "1");
        setShowButton(false);
      }
    };

    const timer = setTimeout(() => {
      const pa = window.PushAlertCo;
      if (pa?.triggerOptIn || pa?.subscribe) {
        setSdkReady(true);
        trySubscribe();
      } else {
        setShowButton(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleEnable = () => {
    const pa = window.PushAlertCo;
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