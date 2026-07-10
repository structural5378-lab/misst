import React from 'react';
import { useCommunity } from '@/contexts/CommunityContext';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Radio } from 'lucide-react';

const statusColor = {
  online: 'bg-green-500/20 text-green-400',
  offline: 'bg-red-500/20 text-red-400',
  busy: 'bg-amber-500/20 text-amber-400',
};

export default function CommunityRepeaters() {
  const { community } = useCommunity();

  const { data: repeaters, isLoading } = useQuery({
    queryKey: ['community-repeaters', community.id],
    queryFn: async () => {
      return await base44.entities.Repeater.filter({ community_id: community.id }, '-created_date', 50);
    },
  });

  return (
    <div className="p-4 space-y-3">
      <h1 className="text-xl font-bold text-foreground mb-2">Repeaters</h1>

      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      )}

      {!isLoading && repeaters?.length === 0 && (
        <div className="text-center py-12">
          <Radio className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">No repeaters listed.</p>
        </div>
      )}

      {repeaters?.map((repeater) => {
        const color = statusColor[repeater.status] || statusColor.online;
        return (
          <div
            key={repeater.id}
            className="p-3 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-medium text-foreground">{repeater.callsign}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {repeater.frequency ? `${repeater.frequency} MHz` : 'No frequency'}
                  {repeater.offset && ` · ${repeater.offset}`}
                  {repeater.tone && ` · ${repeater.tone}`}
                </p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${color} shrink-0`}>
                {repeater.status}
              </span>
            </div>
            {repeater.location && (
              <p className="text-xs text-muted-foreground mt-1">{repeater.location}</p>
            )}
            {repeater.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{repeater.description}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}