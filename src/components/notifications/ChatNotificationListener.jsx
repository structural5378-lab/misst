import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { showInAppNotification } from "@/components/notifications/InAppNotificationCenter";
import { isViewingCommunity, isViewingConversation } from "@/lib/activeChatView";

// ChatNotificationListener — app-wide realtime subscriber that turns new
// Notification records into in-app banners. Mounted once via NotificationManager
// (which lives in every AppLayout variant), so it is active on every page.
//
// Responsibilities:
//  1. Subscribe to Notification entity create events for the current user.
//  2. Invalidate the unread-badge + list queries so the bell updates instantly.
//  3. Show an in-app banner (showInAppNotification) with sender name, preview,
//     avatar, and a tap-to-open deep link.
//  4. Suppress the banner when the user is actively viewing that exact
//     conversation/community (don't banner what they're already reading).
//  5. Auto-mark community_chat notifications as read when the user is viewing
//     that community (badge stays clean while reading live).
//  6. Dedup by notification ID (InAppNotificationCenter also dedups by content
//     so FCM push + realtime never double-banner the same message).
export default function ChatNotificationListener() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const shownIds = useRef(new Set());

  useEffect(() => {
    if (!user?.id) return;
    const unsub = base44.entities.Notification.subscribe((event) => {
      if (event.type !== "create") return;
      const n = event.data;
      if (!n || n.recipient_id !== user.id) return;

      // Update the bell badge + notification list immediately.
      qc.invalidateQueries(["notifications-unread"]);
      qc.invalidateQueries(["notifications"]);

      const nid = n.id || "";
      // Dedup by notification ID (realtime can fire once per record).
      if (nid && shownIds.current.has(nid)) return;
      if (nid) {
        shownIds.current.add(nid);
        setTimeout(() => shownIds.current.delete(nid), 10000);
      }

      const meta = parseMeta(n.metadata);

      // Active-viewer suppression: don't banner a message the user is reading.
      if (n.type === "community_chat" && meta.community_id && isViewingCommunity(meta.community_id)) {
        // User is in this community's chat — auto-mark read, no banner.
        if (nid) base44.entities.Notification.update(nid, { read: true, read_at: new Date().toISOString() }).catch(() => {});
        return;
      }
      if (n.type === "direct_message" && n.related_object_id && isViewingConversation(n.related_object_id)) {
        // Safety net: the backend already suppresses DM records for active
        // viewers, but if one slips through, don't banner it.
        return;
      }

      showInAppNotification({
        id: nid,
        type: n.type,
        title: n.title || "MIST",
        body: n.message || "",
        image: n.image_url || "",
        link: n.link || "/notifications",
        ts: n.created_date || new Date().toISOString(),
      });
    });
    return unsub;
  }, [user?.id, qc]);

  return null;
}

function parseMeta(s) {
  try { return s ? JSON.parse(s) : {}; } catch { return {}; }
}