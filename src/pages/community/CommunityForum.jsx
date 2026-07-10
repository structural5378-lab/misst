import React from 'react';
import { useCommunity } from '@/contexts/CommunityContext';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { MessageSquare } from 'lucide-react';

export default function CommunityForum() {
  const { community } = useCommunity();

  const { data: threads, isLoading } = useQuery({
    queryKey: ['community-forum-threads', community.id],
    queryFn: async () => {
      return await base44.entities.ForumThread.filter(
        { community_id: community.id },
        '-created_date',
        50
      );
    },
  });

  return (
    <div className="p-4 space-y-3">
      <h1 className="text-xl font-bold text-foreground mb-2">Forum</h1>

      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      )}

      {!isLoading && threads?.length === 0 && (
        <div className="text-center py-12">
          <MessageSquare className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">No threads yet.</p>
        </div>
      )}

      {threads?.map((thread) => (
        <div
          key={thread.id}
          className="p-3 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors"
        >
          <h3 className="text-sm font-medium text-foreground">{thread.title}</h3>
          {thread.body && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{thread.body}</p>
          )}
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span>{thread.author_name || 'Unknown'}</span>
            {thread.reply_count > 0 && <span>{thread.reply_count} replies</span>}
            {thread.view_count > 0 && <span>{thread.view_count} views</span>}
          </div>
        </div>
      ))}
    </div>
  );
}