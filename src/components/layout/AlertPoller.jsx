import { useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { useLocation } from "react-router-dom";

export default function AlertPoller() {
  const { toast } = useToast();
  const location = useLocation();
  const lastCountRef = useRef(null);
  const lastIdsRef = useRef(null);

  useEffect(() => {
    const check = async () => {
      try {
        const alerts = await base44.entities.Alert.filter({ is_read: false });
        const currentIds = new Set(alerts.map(a => a.id));
        const currentCount = alerts.length;

        if (lastIdsRef.current === null) {
          // First load — just record state, don't toast
          lastIdsRef.current = currentIds;
          lastCountRef.current = currentCount;
          return;
        }

        // Find truly new alerts (ids we haven't seen before)
        const newAlerts = alerts.filter(a => !lastIdsRef.current.has(a.id));

        if (newAlerts.length > 0) {
          // Show one toast per new alert (max 3)
          newAlerts.slice(0, 3).forEach(alert => {
            toast({
              title: alert.title,
              description: alert.message,
              duration: 6000,
            });
          });
          lastIdsRef.current = currentIds;
          lastCountRef.current = currentCount;
        }
      } catch {
        // silently ignore
      }
    };

    // Initial check after a short delay
    const initTimer = setTimeout(check, 3000);
    // Then poll every 60 seconds
    const interval = setInterval(check, 60000);

    return () => {
      clearTimeout(initTimer);
      clearInterval(interval);
    };
  }, []);

  return null;
}