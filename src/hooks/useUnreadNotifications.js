import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

// Global unread notification count for the bell badge.
// Reads from the canonical Notification entity (Phase 1 notification engine).
export function useUnreadNotifications() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["notifications-unread", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const items = await base44.entities.Notification.filter(
        { recipient_id: user.id, read: false },
        "-created_date",
        200
      );
      return (items || []).length;
    },
    enabled: !!user?.id,
    staleTime: 15000,
  });
}