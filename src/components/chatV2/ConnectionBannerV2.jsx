import { WifiOff, RefreshCw } from "lucide-react";

// ConnectionBannerV2 — shown when the client is offline or the realtime
// connection is being re-established. Queued messages are safe in localStorage.
export default function ConnectionBannerV2({ online, reconnecting }) {
  if (online && !reconnecting) return null;
  const offline = !online;
  return (
    <div className="px-4 py-2 bg-amber-500/15 border-b border-amber-500/30 text-amber-200 text-xs flex items-center gap-2">
      {offline ? <WifiOff className="w-3.5 h-3.5" /> : <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
      <span>
        {offline
          ? "You're offline — messages will be sent when you reconnect."
          : "Reconnecting…"}
      </span>
    </div>
  );
}