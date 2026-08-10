import { mist } from '@/api/mist';
// Emit a notification event to the MIST Notification Service.
//
// Features call this instead of implementing their own notification logic.
// The service resolves recipients (explicit list or community fan-out),
// honors per-user preferences, and persists the notification. Phase 2 will
// add FCM push / email / SMS delivery without changing any caller.
//
// Example:
//   emitNotification({
//     type: "direct_message",
//     title: "New message from Sarah",
//     message: "Hey, are you on the repeater tonight?",
//     recipient_ids: ["<user-id>"],
//     related_object_id: "<conversation-id>",
//     related_object_type: "conversation",
//   });
export async function emitNotification(event) {
  const res = await mist.functions.invoke("notify", event);
  return res.data;
}