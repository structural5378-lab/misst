import { useCallback, useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";

// useChatV2Presence — owns the current user's presence row (heartbeat + lifecycle)
// and subscribes to every other user's presence for live status + typing indicators.
//
// Lifecycle handled:
//   - App opens      -> online, heartbeat every 15s
//   - Tab hidden     -> away (heartbeat continues)
//   - Tab visible    -> online
//   - App closes     -> offline (best-effort on beforeunload/pagehide)
//   - Connection lost-> heartbeat update throws -> reconnecting=true
//   - Connection back-> online event -> re-ensure presence, reconnecting=false
//
// Exposes setTyping(convId, isTyping) and setActiveConversation(convId) so the
// chat window can flag the user as viewing/typing (used for push suppression
// and typing indicators).
export function useChatV2Presence(user) {
  const presenceIdRef = useRef(null);
  const [presenceByUser, setPresenceByUser] = useState({});
  const [online, setOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [reconnecting, setReconnecting] = useState(false);

  const ensurePresence = useCallback(async () => {
    if (!user?.id) return;
    const now = new Date().toISOString();
    try {
      const mine = await base44.entities.ChatV2Presence
        .filter({ user_id: user.id }, "-last_heartbeat", 5)
        .catch(() => []);
      const data = {
        user_id: user.id,
        user_name: user.displayName || "",
        user_avatar: user.avatarUrl || "",
        status: "online",
        last_seen: now,
        last_heartbeat: now,
      };
      if (mine && mine.length) {
        presenceIdRef.current = mine[0].id;
        await base44.entities.ChatV2Presence.update(mine[0].id, data);
      } else {
        const created = await base44.entities.ChatV2Presence.create(data);
        presenceIdRef.current = created?.id || null;
      }
      setReconnecting(false);
    } catch {
      setReconnecting(true);
    }
  }, [user?.id, user?.displayName, user?.avatarUrl]);

  // Subscribe to all presence rows (initial snapshot + live updates).
  useEffect(() => {
    if (!user?.id) return;
    let mounted = true;
    let unsub = null;
    (async () => {
      const all = await base44.entities.ChatV2Presence.list("-last_heartbeat", 500).catch(() => []);
      if (!mounted) return;
      const map = {};
      for (const p of all || []) if (p.user_id) map[p.user_id] = p;
      setPresenceByUser(map);
      unsub = base44.entities.ChatV2Presence.subscribe((event) => {
        const p = event.data;
        if (!p || !p.user_id) return;
        setPresenceByUser((prev) => {
          if (event.type === "delete") { const n = { ...prev }; delete n[p.user_id]; return n; }
          return { ...prev, [p.user_id]: p };
        });
      });
    })();
    return () => { mounted = false; if (unsub) try { unsub(); } catch {} };
  }, [user?.id]);

  // Own presence lifecycle.
  useEffect(() => {
    if (!user?.id) return;
    ensurePresence();
    const hb = setInterval(async () => {
      if (typeof navigator !== "undefined" && !navigator.onLine) { setOnline(false); return; }
      const now = new Date().toISOString();
      try {
        if (presenceIdRef.current) {
          await base44.entities.ChatV2Presence.update(presenceIdRef.current, {
            last_heartbeat: now,
            status: document.visibilityState === "visible" ? "online" : "away",
          });
        }
        setReconnecting(false);
      } catch { setReconnecting(true); }
    }, 15000);

    const onVis = () => {
      const now = new Date().toISOString();
      const status = document.visibilityState === "visible" ? "online" : "away";
      if (presenceIdRef.current) {
        base44.entities.ChatV2Presence.update(presenceIdRef.current, { status, last_heartbeat: now, last_seen: now }).catch(() => {});
      }
    };
    const onOnline = () => { setOnline(true); setReconnecting(false); ensurePresence(); };
    const onOffline = () => setOnline(false);
    const onUnload = () => {
      const now = new Date().toISOString();
      if (presenceIdRef.current) {
        base44.entities.ChatV2Presence.update(presenceIdRef.current, { status: "offline", last_seen: now }).catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    window.addEventListener("beforeunload", onUnload);
    window.addEventListener("pagehide", onUnload);
    return () => {
      clearInterval(hb);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("beforeunload", onUnload);
      window.removeEventListener("pagehide", onUnload);
    };
  }, [user?.id, ensurePresence]);

  const setTyping = useCallback((conversationId, isTyping) => {
    if (!presenceIdRef.current) return;
    const now = new Date().toISOString();
    base44.entities.ChatV2Presence.update(presenceIdRef.current, {
      typing_conversation_id: isTyping ? conversationId : "",
      typing_at: isTyping ? now : "",
    }).catch(() => {});
  }, []);

  const setActiveConversation = useCallback((conversationId) => {
    if (!presenceIdRef.current) return;
    base44.entities.ChatV2Presence.update(presenceIdRef.current, {
      active_conversation_id: conversationId || "",
    }).catch(() => {});
  }, []);

  return { presenceByUser, online, reconnecting, setTyping, setActiveConversation, presenceIdRef };
}