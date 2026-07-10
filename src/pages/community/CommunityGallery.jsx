import React from 'react';
import { useCommunity } from '@/contexts/CommunityContext';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Image as ImageIcon } from 'lucide-react';

export default function CommunityGallery() {
  const { community } = useCommunity();

  const { data: photos, isLoading } = useQuery({
    queryKey: ['community-gallery', community.id],
    queryFn: async () => {
      return await base44.entities.GatheringPhoto.filter(
        { community_id: community.id },
        '-created_date',
        50
      );
    },
  });

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold text-foreground mb-4">Gallery</h1>

      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      )}

      {!isLoading && photos?.length === 0 && (
        <div className="text-center py-12">
          <ImageIcon className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">No photos uploaded yet.</p>
        </div>
      )}

      {photos && photos.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {photos.map((photo) => (
            <div key={photo.id} className="rounded-xl overflow-hidden bg-card border border-border">
              <div className="aspect-square">
                <img
                  src={photo.photo_url}
                  alt={photo.caption || ''}
                  className="w-full h-full object-cover"
                />
              </div>
              {(photo.caption || photo.gathering_label || photo.uploader_name) && (
                <div className="p-2">
                  {photo.caption && (
                    <p className="text-xs text-foreground truncate">{photo.caption}</p>
                  )}
                  <div className="flex items-center justify-between mt-1 text-[10px] text-muted-foreground">
                    {photo.gathering_label && <span>{photo.gathering_label}</span>}
                    {photo.uploader_name && <span className="truncate ml-1">by {photo.uploader_name}</span>}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}