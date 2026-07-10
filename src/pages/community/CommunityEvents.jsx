import React from 'react';
import { useCommunity } from '@/contexts/CommunityContext';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Clock, MapPin } from 'lucide-react';

const statusColor = {
  upcoming: 'bg-blue-500/20 text-blue-400',
  delayed: 'bg-amber-500/20 text-amber-400',
  active: 'bg-green-500/20 text-green-400',
  ended: 'bg-slate-500/20 text-slate-400',
};

export default function CommunityEvents() {
  const { community } = useCommunity();

  const { data: events, isLoading } = useQuery({
    queryKey: ['community-events', community.id],
    queryFn: async () => {
      return await base44.entities.Event.filter(
        { community_id: community.id },
        'event_time',
        50
      );
    },
  });

  const formatDate = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-4 space-y-3">
      <h1 className="text-xl font-bold text-foreground mb-2">Events</h1>

      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      )}

      {!isLoading && events?.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">No events scheduled.</p>
        </div>
      )}

      {events?.map((event) => {
        const color = statusColor[event.status] || statusColor.upcoming;
        return (
          <div
            key={event.id}
            className="p-3 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-medium text-foreground">{event.title}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${color} shrink-0`}>
                {event.status}
              </span>
            </div>
            {event.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{event.description}</p>
            )}
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDate(event.event_time)}
              </span>
              {event.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {event.location}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}