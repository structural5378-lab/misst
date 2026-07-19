import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

// Total unread across forum subscriptions, alerts, and direct messages — used
// for the global notification bell badge.
export function useUnreadNotifications() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["unread-notifications", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const [subs, alerts, parts] = await Promise.allSettled([
        base44.entities.ForumSubscription.filter({ user_id: user.id }),
        base44.entities.Alert.filter({ is_read: false }),
        base44.entities.ConversationParticipant.filter({ user_id: user.id }),
      ]);
      const forum = subs.status === "fulfilled" ? (subs.value || []).filter((s) => (s.unread_count || 0) > 0).length : 0;
      const al = alerts.status === "fulfilled" ? (alerts.value || []).length : 0;
      const dms = parts.status === "fulfilled" ? (parts.value || []).filter((p) => (p.unread_count || 0) > 0).length : 0;
      return forum + al + dms;
    },
    enabled: !!user?.id,
    staleTime: 20000,
  });
}