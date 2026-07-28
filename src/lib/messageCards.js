// Message card detection. Cards render as rich, branded layouts instead of
// plain text bubbles when a message carries structured content.
//
// Supported sources:
//  - message_type: "image" | "file" | "system"
//  - attachments JSON array with { kind/type } for image/file/location
//  - attachments item with { card: { type, ...payload } } for domain cards:
//    weather, lightning, emergency, net_active, net_scheduled, event, poll,
//    radio_checkin, repeater

export function parseAttachments(message) {
  try {
    const raw = message?.attachments;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string") return JSON.parse(raw);
    return [];
  } catch {
    return [];
  }
}

export function detectCard(message) {
  if (!message) return null;
  const atts = parseAttachments(message);

  // Explicit domain card convention.
  const cardAtt = atts.find((a) => a && a.card && a.card.type);
  if (cardAtt) return { type: cardAtt.card.type, data: cardAtt.card, attachments: atts };

  // Shared location.
  const loc = atts.find((a) => a && (a.type === "location" || a.kind === "location"));
  if (loc) return { type: "location", data: loc, attachments: atts };

  // Image.
  const hasImg =
    message.message_type === "image" ||
    atts.some((a) => (a?.type || "").startsWith("image/") || a?.kind === "image");
  if (hasImg) {
    const img =
      atts.find((a) => a?.url && ((a.type || "").startsWith("image/") || a.kind === "image")) ||
      atts.find((a) => a?.url) ||
      { url: message.body };
    return { type: "photo", data: img, attachments: atts };
  }

  // File.
  const hasFile =
    message.message_type === "file" ||
    atts.some((a) => a && (a.kind === "file" || (a.type && !a.type.startsWith("image/"))));
  if (hasFile) {
    const f =
      atts.find((a) => a?.kind === "file" || (a.type && !a.type.startsWith("image/"))) ||
      atts.find((a) => a?.url) ||
      { name: message.body };
    return { type: "file", data: f, attachments: atts };
  }

  // System.
  if (message.message_type === "system") {
    return { type: "system", data: { body: message.body }, attachments: atts };
  }

  return null;
}