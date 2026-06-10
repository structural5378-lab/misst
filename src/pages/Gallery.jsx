import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useMyBBAuth } from "@/lib/MyBBAuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, Upload, X, ChevronLeft, ChevronRight, Plus, ImageIcon } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

function currentMonthLabel() {
  const d = new Date();
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function LightboxModal({ photos, startIndex, onClose }) {
  const [idx, setIdx] = useState(startIndex);
  const photo = photos[idx];
  const prev = () => setIdx(i => Math.max(0, i - 1));
  const next = () => setIdx(i => Math.min(photos.length - 1, i + 1));

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/70 hover:text-white p-2"
      >
        <X className="w-6 h-6" />
      </button>

      {idx > 0 && (
        <button
          onClick={e => { e.stopPropagation(); prev(); }}
          className="absolute left-3 text-white/70 hover:text-white p-2 bg-black/40 rounded-full"
        >
          <ChevronLeft className="w-7 h-7" />
        </button>
      )}

      <div
        className="max-w-2xl max-h-[80vh] flex flex-col items-center gap-3"
        onClick={e => e.stopPropagation()}
      >
        <img
          src={photo.photo_url}
          alt={photo.caption || "Gallery photo"}
          className="max-w-full max-h-[68vh] object-contain rounded-xl"
        />
        {(photo.caption || photo.uploader_name) && (
          <div className="text-center">
            {photo.caption && <p className="text-white font-medium">{photo.caption}</p>}
            {photo.uploader_name && (
              <p className="text-white/50 text-xs mt-0.5">📸 {photo.uploader_name}</p>
            )}
          </div>
        )}
        <p className="text-white/30 text-xs">{idx + 1} / {photos.length}</p>
      </div>

      {idx < photos.length - 1 && (
        <button
          onClick={e => { e.stopPropagation(); next(); }}
          className="absolute right-3 text-white/70 hover:text-white p-2 bg-black/40 rounded-full"
        >
          <ChevronRight className="w-7 h-7" />
        </button>
      )}
    </div>
  );
}

function UploadModal({ onClose, onSuccess, uploaderName }) {
  const [files, setFiles] = useState([]);
  const [caption, setCaption] = useState("");
  const [gatheringLabel, setGatheringLabel] = useState(currentMonthLabel());
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef();

  const handleFiles = e => {
    const selected = Array.from(e.target.files).filter(f => f.type.startsWith("image/"));
    setFiles(selected);
  };

  const handleUpload = async () => {
    if (!files.length) return;
    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: files[i] });
        await base44.entities.GatheringPhoto.create({
          photo_url: file_url,
          caption: files.length === 1 ? caption : "",
          gathering_label: gatheringLabel,
          uploader_name: uploaderName,
        });
        setProgress(Math.round(((i + 1) / files.length) * 100));
      }
      onSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-foreground text-lg">Add Photos</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Gathering label */}
        <div>
          <label className="text-xs text-muted-foreground font-medium mb-1.5 block">Gathering (Month / Year)</label>
          <input
            value={gatheringLabel}
            onChange={e => setGatheringLabel(e.target.value)}
            placeholder="e.g. June 2026"
            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        {/* File picker */}
        <div
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-violet-500/50 hover:bg-violet-500/5 transition-all"
        >
          <Camera className="w-8 h-8 text-violet-400 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            {files.length ? `${files.length} photo${files.length > 1 ? "s" : ""} selected` : "Tap to choose photos"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">You can select multiple</p>
          <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
        </div>

        {/* Caption — only when single file */}
        {files.length === 1 && (
          <div>
            <label className="text-xs text-muted-foreground font-medium mb-1.5 block">Caption (optional)</label>
            <input
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="What's happening here?"
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        )}

        {uploading && (
          <div className="space-y-1">
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-muted-foreground text-center">Uploading… {progress}%</p>
          </div>
        )}

        <Button
          onClick={handleUpload}
          disabled={!files.length || uploading}
          className="w-full bg-violet-600 hover:bg-violet-700 text-white"
        >
          <Upload className="w-4 h-4 mr-2" />
          {uploading ? "Uploading…" : `Upload ${files.length > 1 ? files.length + " Photos" : "Photo"}`}
        </Button>
      </div>
    </div>
  );
}

export default function Gallery() {
  const { mybbUser } = useMyBBAuth();
  const queryClient = useQueryClient();
  const [showUpload, setShowUpload] = useState(false);
  const [lightbox, setLightbox] = useState(null); // { photos, index }
  const [activeGroup, setActiveGroup] = useState(null);

  const { data: photos = [], isLoading } = useQuery({
    queryKey: ["gallery-photos"],
    queryFn: () => base44.entities.GatheringPhoto.list("-created_date", 200),
  });

  // Group by gathering_label
  const groups = photos.reduce((acc, photo) => {
    const label = photo.gathering_label || "Uncategorized";
    if (!acc[label]) acc[label] = [];
    acc[label].push(photo);
    return acc;
  }, {});
  const groupKeys = Object.keys(groups);
  const displayKey = activeGroup || groupKeys[0];

  const uploaderName = mybbUser?.username || "Member";

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader
        title="📷 Photo Gallery"
        showBack
        rightAction={
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600/30 hover:bg-violet-600/50 text-violet-300 text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        }
      />

      <div className="px-4 py-4 space-y-4">
        {/* Month tabs */}
        {groupKeys.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {groupKeys.map(key => (
              <button
                key={key}
                onClick={() => setActiveGroup(key)}
                className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                  displayKey === key
                    ? "bg-violet-600 text-white"
                    : "bg-white/[0.05] text-muted-foreground hover:bg-white/[0.10]"
                }`}
              >
                {key}
              </button>
            ))}
          </div>
        )}

        {isLoading && (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!isLoading && groupKeys.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-violet-500/15 flex items-center justify-center mx-auto mb-4">
              <ImageIcon className="w-8 h-8 text-violet-400" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-1">No photos yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Be the first to share gathering memories!</p>
            <Button onClick={() => setShowUpload(true)} className="bg-violet-600 hover:bg-violet-700 text-white">
              <Camera className="w-4 h-4 mr-2" /> Upload Photos
            </Button>
          </div>
        )}

        {!isLoading && displayKey && groups[displayKey] && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">{displayKey}</h2>
              <span className="text-xs text-muted-foreground">{groups[displayKey].length} photo{groups[displayKey].length !== 1 ? "s" : ""}</span>
            </div>

            {/* Masonry-style grid */}
            <div className="columns-2 gap-2 space-y-2">
              {groups[displayKey].map((photo, idx) => (
                <div
                  key={photo.id}
                  onClick={() => setLightbox({ photos: groups[displayKey], index: idx })}
                  className="break-inside-avoid rounded-xl overflow-hidden cursor-pointer group relative"
                >
                  <img
                    src={photo.photo_url}
                    alt={photo.caption || "Gathering photo"}
                    className="w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  {photo.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white text-xs font-medium line-clamp-2">{photo.caption}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onSuccess={() => {
            setShowUpload(false);
            queryClient.invalidateQueries({ queryKey: ["gallery-photos"] });
          }}
          uploaderName={uploaderName}
        />
      )}

      {lightbox && (
        <LightboxModal
          photos={lightbox.photos}
          startIndex={lightbox.index}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}