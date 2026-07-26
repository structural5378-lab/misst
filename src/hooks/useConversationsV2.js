import { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

// useConversationsV2 — loads the current user's conversations (via their
// ChatV2Participant rows joined to ChatV2Conversation), kept live through
// entity subscriptions: new message -> backend bumps unread + last_message ->
// participant/conversation update events arrive here in real time.
export function useConversationsV2(userId) {
  const [participants, setParticipants] = useState([]);
  const [conversations, setConversations] = useState({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const myParts = await base44.entities.ChatV2Participant
      .filter({ user_id: userId, left: false }, "-joined_at", 200)
      .catch(() => []);
    setParticipants(myParts || []);
    const ids = [...new Set((myParts || []).map((p) => p.conversation_id).filter(Boolean))];
    const convs = await Promise.all(ids.map((id) => base44.entities.ChatV2Conversation.get(id).catch(() => null)));
    const map = {};
    for (const c of convs) if (c) map[c.id] = c;
    setConversations(map);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    let mounted = true;
    load().finally(() => { if (!mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [load]);

  // Real-time: react to unread bumps and last-message updates.
  useEffect(() => {
    if (!userId) return;
    const unsubP = base44.entities.ChatV2Participant.subscribe((event) => {
      const p = event.data;
      if (!p || p.user_id !== userId) return;
      setParticipants((prev) => {
        if (event.type === "delete") return prev.filter((x) => x.id !== p.id);
        const i = prev.findIndex((x) => x.id === p.id);
        if (i >= 0) { const next = [...prev]; next[i] = p; return next; }
        return [...prev, p];
      });
    });
    const unsubC = base44.entities.ChatV2Conversation.subscribe((event) => {
      const c = event.data;
      if (!c) return;
      setConversations((prev) => {
        if (event.type === "delete") { const n = { ...prev }; delete n[c.id]; return n; }
        return { ...prev, [c.id]: c };
      });
    });
    return () => { try { unsubP(); } catch {} try { unsubC(); } catch {} };
  }, [userId]);

  const list = participants
    .map((p) => ({ participant: p, conversation: conversations[p.conversation_id] }))
    .filter((x) => x.conversation)
    .sort((a, b) => new Date(b.conversation.last_message_at || 0) - new Date(a.conversation.last_message_at || 0));

  return { conversations: list, loading, reload: load };
}