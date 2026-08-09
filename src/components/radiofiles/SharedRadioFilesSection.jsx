import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { FolderOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchPublicFilesByUser } from '@/lib/radioFiles';
import RadioFileCard from './RadioFileCard';

// SharedRadioFilesSection — public profile section showing only the files a
// member has marked Public. Private files are never exposed (RLS enforces).
export default function SharedRadioFilesSection({ userId }) {
  const { data: files = [] } = useQuery({
    queryKey: ['shared-radio-files', userId], queryFn: () => fetchPublicFilesByUser(userId), enabled: !!userId, staleTime: 30000,
  });
  return (
    <div className="p-4 rounded-xl bg-card border border-border/60">
      <div className="flex items-center gap-1.5 mb-3">
        <FolderOpen className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Shared Radio Files</h3>
        <span className="ml-auto text-xs text-muted-foreground">{files.length}</span>
      </div>
      {files.length === 0 ? (
        <p className="text-sm text-muted-foreground">No shared radio files.</p>
      ) : (
        <div className="space-y-2">
          {files.slice(0, 6).map((f) => <RadioFileCard key={f.id} file={f} />)}
          {files.length > 6 && (
            <Link to={`/radio-files?uploader=${userId}`} className="block text-center text-xs text-primary font-medium py-2 hover:text-primary/80">View all {files.length} files →</Link>
          )}
        </div>
      )}
    </div>
  );
}