import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { subscribeFcm, isSubscribed } from "@/lib/fcmPush";
import { useToast } from "@/components/ui/use-toast";
import { Bell, Loader2, X } from "lucide-react";

const PROMPTED_KEY = "fcm_prompted";

// Shown once per session when permission has not yet been requested.
export default function NotificationPrompt() {
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (localStorage.getItem(PROMPTED_KEY)) return;
        if (await isSubscribed()) return;
        if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
        setTimeout(() => { if (!cancelled) setShow(true); }, 1500);
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleEnable = async () => {
    setBusy(true);
    try {
      const r = await subscribeFcm();
      if (r?.ok) {
        setShow(false);
        // Confirm successful setup with a real test push to this device.
        try { await base44.functions.invoke("sendTestNotification", {}); } catch { /* ignore */ }
        toast({ title: "Push notifications enabled", description: "A test notification is on its way." });
      } else if (r?.reason === "no-vapid-key") {
        toast({ title: "Not configured", description: "The FCM Web Push VAPID key isn't set.", variant: "destructive" });
        setShow(false);
      } else if (r?.reason === "permission-denied") {
        toast({ title: "Permission blocked", description: "Enable notifications in your browser site settings.", variant: "destructive" });
        setShow(false);
      } else {
        toast({ title: "Couldn't enable push", description: r?.reason || "Try again later.", variant: "destructive" });
      }
    } finally {
      setBusy(false);
    }
  };

  const handleDismiss = () => {
    try { localStorage.setItem(PROMPTED_KEY, "1"); } catch { /* ignore */ }
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-[9999] pointer-events-auto">
      <div className="bg-violet-600 text-white rounded-xl p-4 shadow-lg pointer-events-auto relative">
        <button onClick={handleDismiss} className="absolute top-2 right-2 text-white/70 hover:text-white" aria-label="Dismiss">
          <X className="w-4 h-4" />
        </button>
        <p className="text-sm font-semibold mb-2 flex items-center gap-2"><Bell className="w-4 h-4" /> Enable Notifications</p>
        <p className="text-xs text-white/90 mb-3">
          Get alerts for new messages, net reminders, and emergencies — even when the app is closed.
        </p>
        <button
          onClick={handleEnable}
          disabled={busy}
          type="button"
          className="w-full bg-white text-violet-600 text-sm font-semibold py-3 rounded-lg hover:bg-white/90 transition-colors pointer-events-auto cursor-pointer active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
          {busy ? "Enabling…" : "Enable Push Notifications"}
        </button>
      </div>
    </div>
  );
}