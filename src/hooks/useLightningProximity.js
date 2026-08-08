import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useMistUser } from '@/hooks/useMistUser';

// useLightningProximity — fetches the current user's LightningAlertSettings
// (cached) to anchor lightning severity tiers to their EXISTING alert radius.
// No invented thresholds: the user's configured radius_miles is the "critical"
// boundary used by lightningSeverity.js. Falls back to the platform default
// (10mi) when unset or not yet configured. This is a settings read (not a
// weather API call, not a lightning polling system).
export function useLightningProximity() {
  const { mistUser } = useMistUser();
  const userId = mistUser?.id;
  const { data: settings } = useQuery({
    queryKey: ['lightning-alert-settings', userId],
    queryFn: async () => {
      if (!userId) return null;
      const rows = await base44.entities.LightningAlertSettings.filter({ user_id: userId });
      return rows?.[0] || null;
    },
    enabled: !!userId,
    staleTime: 60 * 1000,
  });
  const radiusMiles = settings?.radius_miles || 10;
  const enabled = !!settings?.enabled;
  return { settings, radiusMiles, enabled };
}