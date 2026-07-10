import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const PRESET_COLORS = [
  '#8B5CF6', '#3B82F6', '#06B6D4', '#10B981',
  '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6',
  '#6366F1', '#14B8A6', '#F97316', '#84CC16'
];

function ImageUploader({ label, value, onChange, aspectClass }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');
    try {
      const response = await base44.integrations.Core.UploadFile({ file });
      onChange(response.file_url);
    } catch (err) {
      setError('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <Label>{label}</Label>
      <div className={`relative mt-2 ${aspectClass} rounded-xl border border-border overflow-hidden bg-card`}>
        {value ? (
          <>
            <img src={value} alt={label} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onChange('')}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/80 backdrop-blur flex items-center justify-center text-foreground hover:bg-background"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="w-full h-full flex flex-col items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            {uploading ? (
              <div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" />
            ) : (
              <>
                <ImageIcon className="w-8 h-8 mb-1" />
                <span className="text-xs">Click to upload</span>
              </>
            )}
          </button>
        )}
      </div>
      {error && <p className="text-destructive text-xs mt-1">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
      />
    </div>
  );
}

export default function StepBranding({ data, update }) {
  return (
    <div className="space-y-5">
      <ImageUploader
        label="Banner Image"
        value={data.banner_url}
        onChange={(url) => update({ banner_url: url })}
        aspectClass="aspect-[3/1]"
      />
      <p className="text-muted-foreground text-xs -mt-2">
        Shown at the top of your community home page. Recommended: 1200×400px.
      </p>

      <ImageUploader
        label="Logo"
        value={data.logo_url}
        onChange={(url) => update({ logo_url: url })}
        aspectClass="aspect-square w-32"
      />
      <p className="text-muted-foreground text-xs -mt-2">
        Shown in the community header and navigation. Square image recommended.
      </p>

      <div>
        <Label>Primary Color</Label>
        <div className="flex items-center gap-2 mt-2">
          <input
            type="color"
            value={data.primary_color}
            onChange={(e) => update({ primary_color: e.target.value })}
            className="w-10 h-10 rounded-lg border border-border cursor-pointer"
          />
          <input
            type="text"
            value={data.primary_color}
            onChange={(e) => update({ primary_color: e.target.value })}
            className="flex-1 h-9 rounded-md border border-input bg-transparent px-3 text-sm font-mono"
            placeholder="#8B5CF6"
          />
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => update({ primary_color: color })}
              className="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110"
              style={{
                backgroundColor: color,
                borderColor: data.primary_color === color ? '#fff' : 'transparent'
              }}
            />
          ))}
        </div>
      </div>

      <div>
        <Label>Accent Color</Label>
        <div className="flex items-center gap-2 mt-2">
          <input
            type="color"
            value={data.accent_color}
            onChange={(e) => update({ accent_color: e.target.value })}
            className="w-10 h-10 rounded-lg border border-border cursor-pointer"
          />
          <input
            type="text"
            value={data.accent_color}
            onChange={(e) => update({ accent_color: e.target.value })}
            className="flex-1 h-9 rounded-md border border-input bg-transparent px-3 text-sm font-mono"
            placeholder="#06B6D4"
          />
        </div>
      </div>

      {/* Preview */}
      <div>
        <Label>Preview</Label>
        <div className="mt-2 rounded-xl border border-border overflow-hidden">
          <div
            className="h-20 bg-cover bg-center flex items-center justify-center"
            style={{
              backgroundColor: data.primary_color,
              backgroundImage: data.banner_url ? `url(${data.banner_url})` : undefined
            }}
          >
            {!data.banner_url && (
              <span className="text-white/80 text-xs font-medium">Banner preview</span>
            )}
          </div>
          <div className="p-3 flex items-center gap-2">
            {data.logo_url ? (
              <img src={data.logo_url} alt="Logo" className="w-10 h-10 rounded-lg object-cover" />
            ) : (
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                style={{ backgroundColor: data.primary_color }}
              >
                {(data.name || '?').charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground truncate">
                {data.name || 'Community Name'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                /c/{data.slug || 'slug'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}