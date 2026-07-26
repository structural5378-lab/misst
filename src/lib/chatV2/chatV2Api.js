import { base44 } from "@/api/base44Client";

// chatV2Api — conversation lifecycle helpers used by the Chat V2 UI.
//
// startDirectConversation(me, other): reuses an existing 1:1 conversation if one
// already exists between the two users, otherwise creates a new conversation +
// both participant rows. Returns the ChatV2Conversation record.
export async function startDirectConversation(me, other) {
  const mine = await base44.entities.ChatV2Participant
    .filter({ user_id: me.id, left: false }, "-joined_at", 500)
    .catch(() => []);
  for (const p of mine || []) {
    const others = await base44.entities.ChatV2Participant
      .filter({ conversation_id: p.conversation_id, user_id: other.id, left: false }, "-joined_at", 5)
      .catch(() => []);
    if (others && others.length) {
      const conv = await base44.entities.ChatV2Conversation.get(p.conversation_id).catch(() => null);
      if (conv && !conv.is_group) return conv;
    }
  }

  const now = new Date().toISOString();
  const conv = await base44.entities.ChatV2Conversation.create({
    is_group: false,
    created_by: me.id,
    participants_summary: JSON.stringify([
      { id: me.id, name: me.displayName || "", avatar: me.avatarUrl || "" },
      { id: other.id, name: other.name || "", avatar: other.avatar || "" },
    ]),
  });
  await base44.entities.ChatV2Participant.bulkCreate([
    { conversation_id: conv.id, user_id: me.id, user_name: me.displayName || "", user_avatar: me.avatarUrl || "", joined_at: now },
    { conversation_id: conv.id, user_id: other.id, user_name: other.name || "", user_avatar: other.avatar || "", joined_at: now },
  ]);
  return conv;
}

// Resolve the "other" participant for a 1:1 conversation from participants_summary.
export function otherParticipant(conversation, myId) {
  const summary = (() => {
    try { return JSON.parse(conversation?.participants_summary || "[]"); } catch { return []; }
  })();
  return summary.find((s) => s.id !== myId) || summary[0] || { id: "", name: "Unknown", avatar: "" };
}