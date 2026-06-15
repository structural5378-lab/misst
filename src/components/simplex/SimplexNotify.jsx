// Utility to fire simplex status change toasts
import { toast } from "@/components/ui/use-toast";

export function notifyAccepted(username) {
  toast({ title: "✅ Accepted!", description: `${username} accepted your request. You're now live on the map.`, duration: 5000 });
}

export function notifyDeclined(username) {
  toast({ title: "Request declined", description: `${username} declined your location share request.`, duration: 4000 });
}