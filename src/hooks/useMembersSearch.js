import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useMistUser } from "@/hooks/useMistUser";

/**
 * useMembersSearch — the single client-side contract for the MIST member
 * directory. Talks ONLY to the native `listMembers` backend function (which
 * reads the application User entity). No MyBB calls, no forum mapping.
 *
 * - Debounced free-text search across display name, username, call sign,
 *   and email (email returned only when the caller is an admin).
 * - Infinite pagination: append pages via `loadMore()`; `hasMore` flags
 *   whether additional pages remain for the current query.
 * - `reset()` clears back to page 1 (used when the query changes).
 */
export function useMembersSearch({ pageSize = 20, debounceMs = 250 } = {}) {
  const { mistUser } = useMistUser();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);
  const [accumulated, setAccumulated] = useState([]);
  const timerRef = useRef(null);

  // Debounce the search input so results update quickly without hammering
  // the backend on every keystroke.
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDebounced(query);
      setPage(1);
      setAccumulated([]);
    }, debounceMs);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query, debounceMs]);

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["mist-members", debounced, page, pageSize, mistUser?.role],
    queryFn: async () => {
      const res = await base44.functions.invoke("listMembers", {
        query: debounced,
        page,
        pageSize,
        includeEmail: true, // backend gates email to admins
      });
      return res.data;
    },
  });

  // Append newly fetched pages into the accumulated list; reset on page 1.
  useEffect(() => {
    if (!data) return;
    if (page === 1) {
      setAccumulated(data.members || []);
    } else {
      setAccumulated((prev) => {
        const ids = new Set(prev.map((m) => m.id));
        const merged = [...prev];
        (data.members || []).forEach((m) => { if (!ids.has(m.id)) merged.push(m); });
        return merged;
      });
    }
  }, [data, page]);

  const loadMore = useCallback(() => {
    if (data?.hasMore && !isFetching) setPage((p) => p + 1);
  }, [data, isFetching]);

  const reset = useCallback(() => { setPage(1); setAccumulated([]); }, []);

  return {
    query,
    setQuery,
    members: accumulated,
    total: data?.total ?? 0,
    hasMore: data?.hasMore ?? false,
    isLoading: isLoading && page === 1,
    isFetchingMore: isFetching && page > 1,
    loadMore,
    reset,
    error,
  };
}

export default useMembersSearch;