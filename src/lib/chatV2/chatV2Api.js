import { mist } from '@/api/mist';
// chatV2Api — conversation lifecycle helpers used by the Chat V2 UI.
//
// startDirectConversation(otherUserId): reuses an existing 1:1 conversation if
// one already exists between the two users, otherwise creates a new conversation
// + both participant rows. Runs as the service role in a backend function
// (ChatV2Participant RLS blocks the client from creating the OTHER user's row,
// which is why this must not run client-side). Returns { conversation, participant }.
export async function startDirectConversation(otherUserId) {
  const res = await mist.functions.invoke("startDirectConversation", { other_user_id: otherUserId });
  return res.data;
}

// Resolve the "other" participant for a 1:1 conversation from participants_summary.
export function otherParticipant(conversation, myId) {
  const summary = (() => {
    try { return JSON.parse(conversation?.participants_summary || "[]"); } catch { return []; }
  })();
  return summary.find((s) => s.id !== myId) || summary[0] || { id: "", name: "Unknown", avatar: "" };
}