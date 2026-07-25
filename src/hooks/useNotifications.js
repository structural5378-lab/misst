import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

// useNotifications — React Query interface to the MIST Notification entity.
// Powers the Notification Center (list, filter, mark read/all read, delete)
// and the global unread badge. Real-time via entity subscriptions.
export function useNotifications() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const listQ = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: () =>
      base44.entities.Notification.filter(
        { recipient_id: user.id },
        "-created_date",
        100
      ),
    enabled: !!user?.id,
    staleTime: 15000,
  });

  const unreadQ = useQuery({
    queryKey: ["notifications-unread", user?.id],
    queryFn: async () => {
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

  // Real-time: refetch when any Notification record touching this user changes.
  useEffect(() => {
    if (!user?.id) return;
    const unsub = base44.entities.Notification.subscribe((event) => {
      if (event.data?.recipient_id === user.id) {
        listQ.refetch();
        unreadQ.refetch();
      }
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const markRead = useMutation({
    mutationFn: (id) =>
      base44.entities.Notification.update(id, {
        read: true,
        read_at: new Date().toISOString(),
      }),
    onSuccess: () => {
      qc.invalidateQueries(["notifications"]);
      qc.invalidateQueries(["notifications-unread"]);
    },
  });

  const markAllRead = useMutation({
    mutationFn: () =>
      base44.entities.Notification.updateMany(
        { recipient_id: user.id, read: false },
        { $set: { read: true, read_at: new Date().toISOString() } }
      ),
    onSuccess: () => {
      qc.invalidateQueries(["notifications"]);
      qc.invalidateQueries(["notifications-unread"]);
    },
  });

  const remove = useMutation({
    mutationFn: (id) => base44.entities.Notification.delete(id),
    onSuccess: () => {
      qc.invalidateQueries(["notifications"]);
      qc.invalidateQueries(["notifications-unread"]);
    },
  });

  return {
    list: listQ.data || [],
    unreadCount: unreadQ.data || 0,
    loading: listQ.isLoading,
    refetch: listQ.refetch,
    markRead,
    markAllRead,
    remove,
  };
}