import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// startDirectConversation — create or reuse a 1:1 DM conversation between the
// caller and another user. Runs as the service role so BOTH ChatV2Participant
// rows can be written (the client SDK is blocked by RLS from creating the
// other user's participant row, which is why the previous client-side flow
// silently failed on tap).
//
// Returns { conversation, participant } where `participant` is the CALLER's
// ChatV2Participant row, so the client can optimistically insert the thread
// into its conversation list without waiting for the realtime subscription
// (avoids the "Conversation not found" flash right after starting a chat).

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const otherUserId = String(body.other_user_id || '').trim();
    if (!otherUserId) return Response.json({ error: 'other_user_id is required' }, { status: 400 });
    if (otherUserId === user.id) return Response.json({ error: 'Cannot start a conversation with yourself' }, { status: 400 });

    // Resolve the other user (service role) and validate availability.
    let otherUser = null;
    try {
      otherUser = await base44.asServiceRole.entities.User.get(otherUserId);
    } catch { /* not found */ }
    if (!otherUser) return Response.json({ error: 'User not found' }, { status: 404 });
    if (otherUser.is_platform_suspended || otherUser.is_banned || otherUser.account_status === 'deactivated') {
      return Response.json({ error: 'This account is not available' }, { status: 403 });
    }

    const meName = user.full_name || user.username || user.mybb_username || user.email || 'MIST Member';
    const meAvatar = user.avatar_url || user.avatar || '';
    const otherName = otherUser.full_name || otherUser.username || otherUser.mybb_username || otherUser.email || 'MIST Member';
    const otherAvatar = otherUser.avatar_url || otherUser.avatar || '';

    // Reuse an existing 1:1 conversation between these two users (enforces
    // exactly one DM per pair). A conversation is a match iff both users are
    // non-left participants and the conversation is not a group.
    const myParts = await base44.asServiceRole.entities.ChatV2Participant
      .filter({ user_id: user.id, left: false }, '-joined_at', 500)
      .catch(() => []);
    for (const p of myParts || []) {
      const others = await base44.asServiceRole.entities.ChatV2Participant
        .filter({ conversation_id: p.conversation_id, user_id: otherUserId, left: false }, '-joined_at', 5)
        .catch(() => []);
      if (others && others.length) {
        const conv = await base44.asServiceRole.entities.ChatV2Conversation.get(p.conversation_id).catch(() => null);
        if (conv && !conv.is_group) {
          return Response.json({ conversation: conv, participant: p });
        }
      }
    }

    // Create a new conversation + both participant rows (service role bypasses RLS).
    const now = new Date().toISOString();
    const conv = await base44.asServiceRole.entities.ChatV2Conversation.create({
      is_group: false,
      created_by: user.id,
      participants_summary: JSON.stringify([
        { id: user.id, name: meName, avatar: meAvatar },
        { id: otherUser.id, name: otherName, avatar: otherAvatar },
      ]),
    });
    const participants = await base44.asServiceRole.entities.ChatV2Participant.bulkCreate([
      { conversation_id: conv.id, user_id: user.id, user_name: meName, user_avatar: meAvatar, joined_at: now, unread_count: 0, muted: false, left: false },
      { conversation_id: conv.id, user_id: otherUser.id, user_name: otherName, user_avatar: otherAvatar, joined_at: now, unread_count: 0, muted: false, left: false },
    ]);
    const myParticipant = (participants || []).find((p) => p.user_id === user.id) || null;

    return Response.json({ conversation: conv, participant: myParticipant });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});