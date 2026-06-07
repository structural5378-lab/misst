import React from "react";

const statusStyles = {
  online: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  offline: "bg-red-500/20 text-red-400 border-red-500/30",
  busy: "bg-amber-500/20 text-amber-400 border-amber-500/30",
};

const dotStyles = {
  online: "bg-emerald-400",
  offline: "bg-red-400",
  busy: "bg-amber-400",
};

export default function StatusBadge({ status = "online", className = "" }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${statusStyles[status] || statusStyles.online} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotStyles[status] || dotStyles.online}`} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}