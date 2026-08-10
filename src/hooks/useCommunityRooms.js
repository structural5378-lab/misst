import { useEffect, useState, useCallback } from "react";

import { mist } from '@/api/mist';
// useCommunityRooms — loads a community's Chat V2 rooms (seeding defaults the
// first time via ensureCommunityRooms), ensures the current user has a
// ChatV2RoomMembership row for every room, and subscribes to room + membership
// updates so unread counts and last-message previews stay live.
export function useCommunityRooms(communityId, user) {
  const [rooms, setRooms] = useState([]);
  const [memberships, setMemberships] = useState({}); // room_id -> membership
  const [loading, setLoading] = useState(true);

  const ensureRooms = useCallback(async () => {
    if (!communityId) return [];
    try {
      const res = await mist.functions.invoke("ensureCommunityRooms", {
        community_id: communityId,
        user_id: user?.id,
        user_name: user?.full_name || user?.email || "",
      });
      const r = res?.data?.rooms || [];
      setRooms(r);
      return r;
    } catch {
      // ensureCommunityRooms now validates membership server-side; a failure
      // means access denied — never fall back to an open entity read.
      setRooms([]);
      return [];
    }
  }, [communityId, user?.id, user?.full_name, user?.email]);

  const ensureMemberships = useCallback(async (roomList) => {
    if (!user?.id || !roomList.length) return;
    const my = await mist.entities.ChatV2RoomMembership
      .filter({ user_id: user.id, community_id: communityId }, "-created_date", 500)
      .catch(() => []);
    const map = {};
    (my || []).forEach((m) => { map[m.room_id] = m; });
    const missing = roomList.filter((r) => !map[r.id]);
    if (missing.length) {
      const created = await mist.entities.ChatV2RoomMembership.bulkCreate(
        missing.map((r) => ({
          room_id: r.id,
          user_id: user.id,
          user_name: user.full_name || user.email || "",
          community_id: communityId,
          joined_at: new Date().toISOString(),
        }))
      ).catch(() => []);
      (Array.isArray(created) ? created : []).forEach((m) => { map[m.room_id] = m; });
    }
    setMemberships(map);
  }, [communityId, user?.id, user?.full_name, user?.email]);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const r = await ensureRooms();
      if (active) await ensureMemberships(r);
      if (active) setLoading(false);
    })();
    return () => { active = false; };
  }, [ensureRooms, ensureMemberships]);

  // Live room updates (last message, renames, new rooms, deletes)
  useEffect(() => {
    if (!communityId) return;
    const unsub = mist.entities.ChatV2Room.subscribe((event) => {
      setRooms((prev) => {
        if (event.type === "delete") return prev.filter((r) => r.id !== event.id);
        const d = event.data;
        if (!d || d.community_id !== communityId) return prev;
        const idx = prev.findIndex((r) => r.id === event.id);
        if (idx === -1) return [...prev, d];
        const next = [...prev]; next[idx] = { ...next[idx], ...d }; return next;
      });
    });
    return unsub;
  }, [communityId]);

  // Live membership updates (unread counts, mute/favorite/pin)
  useEffect(() => {
    if (!user?.id) return;
    const unsub = mist.entities.ChatV2RoomMembership.subscribe((event) => {
      setMemberships((prev) => {
        if (event.type === "delete") { const n = { ...prev }; delete n[event.id]; return n; }
        const m = event.data;
        if (!m || m.user_id !== user.id) return prev;
        return { ...prev, [m.room_id]: m };
      });
    });
    return unsub;
  }, [user?.id]);

  const reload = useCallback(async () => { await ensureRooms(); }, [ensureRooms]);

  const updateMembership = useCallback(async (roomId, patch) => {
    const cur = memberships[roomId];
    if (!cur) return;
    setMemberships((p) => ({ ...p, [roomId]: { ...cur, ...patch } }));
    try { await mist.entities.ChatV2RoomMembership.update(cur.id, patch); } catch {}
  }, [memberships]);

  const markRead = useCallback(async (roomId, lastMessageId) => {
    await updateMembership(roomId, {
      last_read_message_id: lastMessageId || "",
      last_read_at: new Date().toISOString(),
      unread_count: 0,
    });
  }, [updateMembership]);

  return { rooms, memberships, loading, reload, markRead, updateMembership };
}