import { useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

export default function AlertPoller() {
  const { toast } = useToast();
  const seenIdsRef = useRef(new Set());

  useEffect(() => {
    // Load existing unread alerts to populate seen set (no toast on initial load)
    base44.entities.Alert.filter({ is_read: false }).then((alerts) => {
      alerts.forEach(a => seenIdsRef.current.add(a.id));
    }).catch(() => {});

    // Subscribe to new alerts in real-time — replaces 60s polling
    const unsubscribe = base44.entities.Alert.subscribe((event) => {
      if (event.type === "create") {
        const alert = event.data;
        if (!alert || seenIdsRef.current.has(alert.id)) return;
        seenIdsRef.current.add(alert.id);
        toast({
          title: alert.title,
          description: alert.message,
          duration: 6000,
        });
      }
    });
    return unsubscribe;
  }, []);

  return null;
}