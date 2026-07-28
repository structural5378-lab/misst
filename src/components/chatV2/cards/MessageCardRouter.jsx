import { AlertCards, RadioCards, MediaCards } from "./cards-index";

// MessageCardRouter — renders the matching rich card for a detected message.
// Falls back to null (caller renders a normal bubble when no card is detected).
export default function MessageCardRouter({ message, card, isMine, onReply }) {
  if (!card) return null;
  const p = { message, data: card.data || {}, isMine, onReply };
  switch (card.type) {
    case "weather":
      return <AlertCards.WeatherAlertCard {...p} />;
    case "lightning":
      return <AlertCards.LightningAlertCard {...p} />;
    case "emergency":
      return <AlertCards.EmergencyTrafficCard {...p} />;
    case "net_active":
      return <RadioCards.ActiveNetCard {...p} />;
    case "net_scheduled":
      return <RadioCards.ScheduledNetCard {...p} />;
    case "radio_checkin":
      return <RadioCards.RadioCheckinCard {...p} />;
    case "repeater":
      return <RadioCards.RepeaterCard {...p} />;
    case "event":
      return <MediaCards.EventCard {...p} />;
    case "poll":
      return <MediaCards.PollCard {...p} />;
    case "photo":
      return <MediaCards.PhotoCard {...p} />;
    case "file":
      return <MediaCards.FileCard {...p} />;
    case "location":
      return <MediaCards.LocationCard {...p} />;
    case "system":
      return <MediaCards.SystemCard {...p} />;
    default:
      return null;
  }
}