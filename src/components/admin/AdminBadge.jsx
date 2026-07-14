import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

/**
 * Admin notification badge — shows count of unread system alerts
 * (pending moderation items, user reports, flagged posts, system alerts).
 */
export default function AdminBadge({ size = "sm" }) {
  const { data: count = 0 } = useQuery({
    queryKey: ['admin-badge-count'],
    queryFn: async () => {
      const alerts = await base44.entities.Alert.filter({ is_read: false });
      return alerts.length;
    },
    refetchInterval: 60000,
    staleTime: 30000,
  });

  if (count === 0) return null;

  const dims = size === "lg"
    ? "min-w-[20px] h-[20px] text-[10px] -top-1.5 -right-1.5"
    : "min-w-[16px] h-[16px] text-[9px] -top-1 -right-1";

  return (
    <span className={`absolute ${dims} flex items-center justify-center rounded-full bg-destructive text-destructive-foreground font-bold px-1 leading-none shadow-md ring-2 ring-background`}>
      {count > 9 ? "9+" : count}
    </span>
  );
}