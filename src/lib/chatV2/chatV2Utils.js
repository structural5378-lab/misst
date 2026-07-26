// Chat V2 shared utilities — parsing, status derivation, formatting, ordering.

export function parseJSON(v, fallback) {
  if (v == null) return fallback;
  if (typeof v !== "string") return v;
  try { return JSON.parse(v); } catch { return fallback; }
}

export function genTempId() {
  return "tmp_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 9);
}

export function isTempId(id) {
  return typeof id === "string" && id.startsWith("tmp_");
}

// Normalize a raw entity message into a rich client object (JSON fields parsed).
export function normalizeMessage(m) {
  if (!m) return m;
  return {
    ...m,
    attachments: parseJSON(m.attachments, []),
    reactions: parseJSON(m.reactions, {}),
    read_by: parseJSON(m.read_by, []),
    delivered_to: parseJSON(m.delivered_to, []),
  };
}

// Derive a presence status from the heartbeat timestamp.
export function presenceStatus(p, now = Date.now()) {
  if (!p || !p.last_heartbeat) return "offline";
  const t = new Date(p.last_heartbeat).getTime();
  if (Number.isNaN(t)) return p.status || "offline";
  const diff = now - t;
  if (diff < 45_000) return "online";
  if (diff < 120_000) return "away";
  return "offline";
}

export function isTypingNow(p, conversationId, now = Date.now()) {
  if (!p || !p.typing_conversation_id || !p.typing_at) return false;
  if (p.typing_conversation_id !== conversationId) return false;
  const t = new Date(p.typing_at).getTime();
  if (Number.isNaN(t)) return false;
  return now - t < 3000;
}

export function cmpCreatedAsc(a, b) {
  const ta = new Date(a.created_date).getTime();
  const tb = new Date(b.created_date).getTime();
  return (ta - tb) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
}

export function isSameDay(aIso, bIso) {
  const a = new Date(aIso), b = new Date(bIso);
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function formatTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function formatDayLabel(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
  if (isSameDay(iso, today.toISOString())) return "Today";
  if (isSameDay(iso, yesterday.toISOString())) return "Yesterday";
  const diff = Math.floor((today - d) / 86400000);
  if (diff < 7) return d.toLocaleDateString([], { weekday: "long" });
  return d.toLocaleDateString([], { month: "short", day: "numeric", year: d.getFullYear() !== today.getFullYear() ? "numeric" : undefined });
}

export function timeAgo(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d === 1) return "Yesterday";
  if (d < 7) return new Date(iso).toLocaleDateString([], { weekday: "long" });
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
}

// Human-readable presence line for a chat header: Online / Away / Last seen …
export function lastSeenLabel(p, now = Date.now()) {
  const s = presenceStatus(p, now);
  if (s === "online") return "Online";
  if (s === "away") return "Away";
  if (!p?.last_seen) return "Offline";
  const diff = now - new Date(p.last_seen).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Last seen just now";
  if (m < 60) return `Last seen ${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Last seen ${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `Last seen ${d}d ago`;
  return `Last seen ${new Date(p.last_seen).toLocaleDateString([], { month: "short", day: "numeric" })}`;
}