import { useState, useRef } from "react";
import { Trash2, Upload, RefreshCw, ImageIcon } from "lucide-react";
import { useMistUser } from "@/hooks/useMistUser";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { optimizeImage } from "@/lib/imageUtils";

export default function BannerUploader() {
  const { user, updateProfile } = useMistUser();
  const bannerUrl = user?.banner_url;
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [drag, setDrag] = useState(false);
  const inputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErr("Please use an image file.");
      return;
    }
    setErr("");
    setBusy(true);
    try {
      const blob = await optimizeImage(file, 1500, 0.82);
      const res = await base44.integrations.Core.UploadFile({ file: blob });
      await updateProfile({ banner_url: res.file_url });
    } catch {
      setErr("Upload failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files?.[0]); }}
        onClick={() => inputRef.current?.click()}
        className={`relative h-28 rounded-xl overflow-hidden border border-dashed cursor-pointer transition-colors ${
          drag ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"
        }`}
      >
        {bannerUrl ? (
          <img src={bannerUrl} alt="banner" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-1">
            <ImageIcon className="w-6 h-6" />
            <span className="text-xs">Drag & drop or click to upload a banner</span>
          </div>
        )}
        {busy && (
          <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
            <RefreshCw className="w-5 h-5 animate-spin text-primary" />
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => inputRef.current?.click()} disabled={busy}>
          <Upload className="w-3.5 h-3.5" /> {bannerUrl ? "Replace banner" : "Upload banner"}
        </Button>
        {bannerUrl && (
          <Button size="sm" variant="ghost" onClick={() => updateProfile({ banner_url: "" })}>
            <Trash2 className="w-3.5 h-3.5" /> Remove
          </Button>
        )}
      </div>
      {err && <p className="text-xs text-destructive">{err}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}