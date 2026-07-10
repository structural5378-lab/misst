import React from 'react';
import { useCommunity } from '@/contexts/CommunityContext';
import { FileText, Upload, FolderOpen } from 'lucide-react';

export default function CommunityFiles() {
  const { community, hasPermission } = useCommunity();
  const canUpload = hasPermission('community:upload_photos');

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-foreground mb-2">Files</h1>

      <div className="text-center py-12">
        <FolderOpen className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-muted-foreground text-sm mb-1">No files shared yet.</p>
        <p className="text-muted-foreground/60 text-xs">
          File sharing for {community.name} will appear here.
        </p>
      </div>

      {canUpload && (
        <button
          disabled
          className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-primary/10 border border-dashed border-primary/30 text-primary text-sm font-medium opacity-50 cursor-not-allowed"
        >
          <Upload className="w-4 h-4" />
          Upload File (coming soon)
        </button>
      )}

      <div className="text-xs text-muted-foreground/60 text-center pt-2">
        <FileText className="w-3 h-3 inline mr-1" />
        File storage integration will be configured in a later phase.
      </div>
    </div>
  );
}