import { presenceStatus } from "@/lib/chatV2/chatV2Utils";

// PresenceDotV2 — colored presence indicator derived from the heartbeat.
const COLORS = {
  online: "bg-emerald-500",
  away: "bg-amber-500",
  offline: "bg-slate-500",
};

export default function PresenceDotV2({ presence, size = "sm", ring = true }) {
  const status = presenceStatus(presence);
  const dot = size === "lg" ? "w-3.5 h-3.5" : "w-2.5 h-2.5";
  const ringCls = ring ? "ring-2 ring-background" : "";
  return (
    <span
      className={`inline-block ${dot} rounded-full ${COLORS[status] || COLORS.offline} ${ringCls} shrink-0`}
      title={status.charAt(0).toUpperCase() + status.slice(1)}
    />
  );
}