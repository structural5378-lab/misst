// MIST Chat V2 — Community Rooms shared definition.
//
// Default room template applied to every community the first time its room
// list is requested (idempotent). Custom rooms are added by community admins
// via the manageCommunityRoom backend function.

export const DEFAULT_ROOMS = [
  { name: "General",            description: "General community discussion",                        icon: "MessageSquare", type: "text",      order: 1 },
  { name: "Announcements",       description: "Official community announcements (admins only)",     icon: "Megaphone",      type: "admin",     order: 2 },
  { name: "Events",              description: "Plan and discuss community events",                  icon: "CalendarDays",  type: "event",     order: 3 },
  { name: "Buy / Sell / Trade",  description: "Marketplace chatter and listings",                   icon: "ShoppingCart",  type: "text",      order: 4 },
  { name: "Emergency Traffic",   description: "Emergency communications — priority traffic only",  icon: "Siren",         type: "emergency", order: 5 },
  { name: "Net Discussion",      description: "Net operations and check-ins discussion",           icon: "Radio",         type: "text",      order: 6 },
  { name: "Off Topic",           description: "Anything not radio-related",                          icon: "Coffee",        type: "text",      order: 7 },
];