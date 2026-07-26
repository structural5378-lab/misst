import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { X, Bell } from "lucide-react";
import { getNotifMeta } from "@/lib/notificationTypes";

// Foreground in-app notification banner queue.
// Listens to:
//   - service worker 'fcm-push' messages (forwarded by sw.js while app is focused)
//   - window 'mist-inapp-notification' custom events (from app code / NotificationManager)
// Renders a stacked, auto-dismissing banner queue (top-right on desktop, top on mobile)
// with category icon/color, title, body, timestamp, optional image, and click-to-navigate.
// Emergency banners require manual dismissal (no auto-timeout).

const MAX_VISIBLE = 4;
const DEFAULT_TIMEOUT = 6000;

// Pub/sub helper so any module can surface an in-app notification.
export function showInAppNotification(notif) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("mist-inapp-notification", { detail: notif }));
}

function formatTime(ts) {
  try {
    const d = ts ? new Date(ts) : new Date();
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export default function InAppNotificationCenter() {
  const [queue, setQueue] = useState([]);
  const navigate = useNavigate();
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setQueue((prev) => prev.filter((n) => n.id !== id));
    const t = timers.current.get(id);
    if (t) {
      clearTimeout(t);
      timers.current.delete(id);
    }
  }, []);

  const enqueue = useCallback(
    (notif) => {
      const meta = getNotifMeta(notif.type);
      const id = (notif.id || Date.now()) + "-" + Math.random().toString(36).slice(2, 6);
      const item = {
        id,
        type: notif.type || "system",
        title: notif.title || "MIST",
        body: notif.body || notif.message || "",
        image: notif.image || "",
        link: notif.link || "/notifications",
        color: meta.color,
        Icon: meta.icon,
        requireInteraction: !!meta.requireInteraction,
        ts: notif.ts || new Date().toISOString(),
      };
      setQueue((prev) => [...prev, item].slice(-MAX_VISIBLE));
      if (!item.requireInteraction) {
        const t = setTimeout(() => dismiss(id), DEFAULT_TIMEOUT);
        timers.current.set(id, t);
      }
    },
    [dismiss]
  );

  useEffect(() => {
    const onSwMessage = (event) => {
      const msg = event.data || {};
      if (msg.type !== "fcm-push") return;
      const p = msg.payload || {};
      const data = p.data || {};
      const notif = p.notification || {};
      enqueue({
        type: data.type || "system",
        title: notif.title || data.title || "MIST",
        body: notif.body || data.body || "",
        image: data.image || notif.image || "",
        link: data.link || (p.fcm_options && p.fcm_options.link) || "/notifications",
      });
    };
    const onCustom = (event) => enqueue(event.detail || {});
    navigator.serviceWorker?.addEventListener?.("message", onSwMessage);
    window.addEventListener("mist-inapp-notification", onCustom);
    return () => {
      navigator.serviceWorker?.removeEventListener?.("message", onSwMessage);
      window.removeEventListener("mist-inapp-notification", onCustom);
    };
  }, [enqueue]);

  // Cleanup timers on unmount
  useEffect(() => () => { timers.current.forEach((t) => clearTimeout(t)); timers.current.clear(); }, []);

  const handleClick = (item) => {
    dismiss(item.id);
    if (item.link) {
      // Prefer SPA navigation for in-app routes; hard navigate for absolute URLs.
      if (/^https?:\/\//.test(item.link)) {
        window.location.href = item.link;
      } else {
        navigate(item.link);
      }
    }
  };

  if (queue.length === 0) return null;

  return (
    <div className="fixed top-3 right-3 left-3 sm:left-auto z-[100] flex flex-col gap-2 sm:w-96 pointer-events-none">
      {queue.map((item) => {
        const Icon = item.Icon || Bell;
        return (
          <div
            key={item.id}
            role="alert"
            onClick={() => handleClick(item)}
            className="pointer-events-auto cursor-pointer msg-in rounded-xl border border-border/60 bg-card/95 backdrop-blur-md shadow-2xl overflow-hidden"
          >
            <div className="flex items-start gap-3 p-3">
              <div
                className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: `${item.color}22`, color: item.color }}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground truncate">{item.title}</p>
                  <button
                    onClick={(e) => { e.stopPropagation(); dismiss(item.id); }}
                    className="shrink-0 text-muted-foreground hover:text-foreground"
                    aria-label="Dismiss"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {item.body && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{item.body}</p>
                )}
                <div className="flex items-center justify-between gap-2 mt-1.5">
                  <span className="text-[10px] text-muted-foreground/70">{formatTime(item.ts)}</span>
                  {item.requireInteraction && (
                    <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: item.color }}>
                      Requires attention
                    </span>
                  )}
                </div>
              </div>
            </div>
            {item.image && (
              <img src={item.image} alt="" className="w-full max-h-32 object-cover" />
            )}
            <div
              className="h-1 origin-left"
              style={{
                background: item.color,
                animation: item.requireInteraction ? "none" : "mist-fade-up 6s linear forwards",
              }}
            />
          </div>
        );
      })}
    </div>
  );
}