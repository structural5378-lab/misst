import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

// useNotifications — React Query interface to the MIST Notification entity.
// Powers the Notification Center (paginated list, search/filter, bulk actions)
// and the global unread badge. Real-time via entity subscriptions. Keeps the
// PWA app-icon badge synchronized with the unread count across devices.
export function useNotifications() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [pageSize, setPageSize] = useState(30);

  const listQ = useQuery({
    queryKey: ["notifications", user?.id, pageSize],
    queryFn: () =>
      base44.entities.Notification.filter({ recipient_id: user.id }, "-created_date", pageSize),
    enabled: !!user?.id,
    staleTime: 15000,
  });

  const unreadQ = useQuery({
    queryKey: ["notifications-unread", user?.id],
    queryFn: async () => {
      const items = await base44.entities.Notification.filter(
        { recipient_id: user.id, read: false }, "-created_date", 200
      );
      return (items || []).length;
    },
    enabled: !!user?.id,
    staleTime: 15000,
  });

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

  // Keep the PWA app-icon badge synchronized with the unread count.
  useEffect(() => {
    if (typeof navigator !== "undefined" && "setAppBadge" in navigator) {
      const count = unreadQ.data || 0;
      try {
        if (count > 0) navigator.setAppBadge(count).catch(() => {});
        else navigator.clearAppBadge().catch(() => {});
      } catch { /* badge API unsupported */ }
    }
  }, [unreadQ.data]);

  const list = listQ.data || [];
  const hasMore = list.length >= pageSize;

  const loadMore = () => setPageSize((p) => p + 30);

  const markRead = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { read: true, read_at: new Date().toISOString() }),
    onSuccess: () => { qc.invalidateQueries(["notifications"]); qc.invalidateQueries(["notifications-unread"]); },
  });

  const markManyRead = useMutation({
    mutationFn: (ids) =>
      base44.entities.Notification.bulkUpdate(
        ids.map((id) => ({ id, read: true, read_at: new Date().toISOString() }))
      ),
    onSuccess: () => { qc.invalidateQueries(["notifications"]); qc.invalidateQueries(["notifications-unread"]); },
  });

  const markAllRead = useMutation({
    mutationFn: () =>
      base44.entities.Notification.updateMany(
        { recipient_id: user.id, read: false },
        { $set: { read: true, read_at: new Date().toISOString() } }
      ),
    onSuccess: () => { qc.invalidateQueries(["notifications"]); qc.invalidateQueries(["notifications-unread"]); },
  });

  const remove = useMutation({
    mutationFn: (id) => base44.entities.Notification.delete(id),
    onSuccess: () => { qc.invalidateQueries(["notifications"]); qc.invalidateQueries(["notifications-unread"]); },
  });

  const removeMany = useMutation({
    mutationFn: async (ids) => { for (const id of ids) await base44.entities.Notification.delete(id); },
    onSuccess: () => { qc.invalidateQueries(["notifications"]); qc.invalidateQueries(["notifications-unread"]); },
  });

  const deleteAll = useMutation({
    mutationFn: () => base44.entities.Notification.deleteMany({ recipient_id: user.id }),
    onSuccess: () => { qc.invalidateQueries(["notifications"]); qc.invalidateQueries(["notifications-unread"]); },
  });

  return {
    list,
    unreadCount: unreadQ.data || 0,
    loading: listQ.isLoading,
    refetch: listQ.refetch,
    hasMore,
    loadMore,
    markRead,
    markManyRead,
    markAllRead,
    remove,
    removeMany,
    deleteAll,
  };
}