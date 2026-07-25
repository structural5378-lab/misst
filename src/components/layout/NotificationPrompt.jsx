import { useEffect, useState } from "react";
import { subscribeFcm, isSubscribed } from "@/lib/fcmPush";

const PROMPTED_KEY = "fcm_prompted";

export default function NotificationPrompt() {
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (localStorage.getItem(PROMPTED_KEY)) return;
        if (await isSubscribed()) return;
        if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
        setTimeout(() => {
          if (!cancelled) setShow(true);
        }, 1500);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleEnable = async () => {
    setBusy(true);
    try {
      const r = await subscribeFcm();
      if (r?.ok) setShow(false);
      else if (r?.reason === "no-vapid-key") {
        alert("Push notifications aren't configured yet. Ask an admin to set the FCM Web Push VAPID key.");
      } else if (r?.reason === "permission-denied") {
        alert("Notification permission was blocked. You can enable it later from your browser settings.");
      }
    } finally {
      setBusy(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-[9999] pointer-events-auto">
      <div className="bg-violet-600 text-white rounded-xl p-4 shadow-lg pointer-events-auto">
        <p className="text-sm font-semibold mb-2">🔔 Enable Notifications</p>
        <p className="text-xs text-white/90 mb-3">
          Get alerts for new messages, net reminders, and emergency alerts — even when the app is closed.
        </p>
        <button
          onClick={handleEnable}
          disabled={busy}
          type="button"
          className="w-full bg-white text-violet-600 text-sm font-semibold py-3 rounded-lg hover:bg-white/90 transition-colors pointer-events-auto cursor-pointer active:scale-[0.98] disabled:opacity-60"
        >
          {busy ? "Enabling…" : "Enable Push Notifications"}
        </button>
      </div>
    </div>
  );
}