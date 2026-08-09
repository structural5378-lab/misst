import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Download, ShieldCheck, Star, Zap } from 'lucide-react';
import { formatSize, fileExt, parseJSON } from '@/lib/radioFiles';

// RadioFileCard — compact file card used across the library, dashboard, and
// profile shared-files sections. Shows name, model, type, size, downloads,
// description, tags, and admin badges (verified/featured).
export default function RadioFileCard({ file, compat }) {
  const tags = parseJSON(file.tags, []);
  return (
    <Link to={`/radio-files/${file.id}`} className="block rounded-xl bg-card/60 border border-border/60 p-3.5 hover:border-primary/40 transition-colors active:scale-[0.99]">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <FileText className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold text-foreground truncate">{file.file_name}</p>
            {file.verified && <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
            {file.featured && <Star className="w-3 h-3 text-amber-400 shrink-0" />}
            {compat && <Zap className="w-3 h-3 text-cyan-400 shrink-0" title="Compatible with your radios" />}
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5">{file.manufacturer_name} {file.model_name}</p>
          <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground">
            <span className="uppercase font-semibold">{fileExt(file.file_name) || file.file_type}</span>
            <span>·</span>
            <span>{formatSize(file.file_size)}</span>
            <span>·</span>
            <span className="flex items-center gap-0.5"><Download className="w-3 h-3" />{file.download_count || 0}</span>
            <span>·</span>
            <span className="truncate">{file.uploader_name || 'Unknown'}</span>
          </div>
        </div>
      </div>
      {file.description && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{file.description}</p>}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {tags.slice(0, 5).map((t, i) => (
            <span key={i} className="text-[9px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded">{t}</span>
          ))}
        </div>
      )}
    </Link>
  );
}