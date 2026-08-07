import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

// useActiveBadge — fetches a user's active premium badge (public display data
// via the getActiveBadge backend function). Cached 60s per user; react-query
// dedupes concurrent calls for the same user so many ActiveBadge instances for
// the same user produce a single network request.
export function useActiveBadge(userId) {
  const { data, isLoading } = useQuery({
    queryKey: ['active-badge', userId],
    queryFn: async () => {
      if (!userId) return null;
      const res = await base44.functions.invoke('getActiveBadge', { user_id: userId });
      return res?.data?.badge || null;
    },
    enabled: !!userId,
    staleTime: 60000,
  });
  return { badge: data, isLoading };
}

// useActiveBadges — batch variant for member lists / leaderboards. Returns a
// map of user_id → badge. One request for the whole list.
export function useActiveBadges(userIds) {
  const key = (userIds || []).filter(Boolean).sort().join(',');
  const { data, isLoading } = useQuery({
    queryKey: ['active-badges', key],
    queryFn: async () => {
      const ids = (userIds || []).filter(Boolean);
      if (!ids.length) return {};
      const res = await base44.functions.invoke('getActiveBadge', { user_ids: ids });
      return res?.data?.badges || {};
    },
    enabled: !!key,
    staleTime: 60000,
  });
  return { badges: data || {}, isLoading };
}