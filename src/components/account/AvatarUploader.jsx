import { useState, useRef } from "react";
import { Camera, Trash2, Upload, RefreshCw } from "lucide-react";
import { useMistUser } from "@/hooks/useMistUser";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { squareCropOptimize } from "@/lib/imageUtils";

export default function AvatarUploader({ size = 96 }) {
  const { mistUser, updateProfile } = useMistUser();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [drag, setDrag] = useState(false);
  const inputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setErr("Please use JPG, PNG, or WEBP.");
      return;
    }
    setErr("");
    setBusy(true);
    try {
      const blob = await squareCropOptimize(file, 512, 0.85);
      const res = await base44.integrations.Core.UploadFile({ file: blob });
      await updateProfile({ avatar_url: res.file_url });
    } catch {
      setErr("Upload failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        {mistUser.avatarUrl ? (
          <img src={mistUser.avatarUrl} alt="avatar" className="w-full h-full rounded-full object-cover border border-border" />
        ) : (
          <div className="w-full h-full rounded-full bg-primary/15 text-primary flex items-center justify-center text-2xl font-bold border border-primary/20">
            {(mistUser.displayName || "M").charAt(0)}
          </div>
        )}
        {busy && (
          <div className="absolute inset-0 rounded-full bg-background/70 flex items-center justify-center">
            <RefreshCw className="w-5 h-5 animate-spin text-primary" />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2 flex-1">
        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files?.[0]); }}
          onClick={() => inputRef.current?.click()}
          className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border border-dashed text-xs cursor-pointer transition-colors ${
            drag ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
          }`}
        >
          <Upload className="w-3.5 h-3.5 shrink-0" />
          Drag & drop or click to upload (JPG / PNG / WEBP)
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => inputRef.current?.click()} disabled={busy}>
            <Camera className="w-3.5 h-3.5" /> Change
          </Button>
          {mistUser.avatarUrl && (
            <Button size="sm" variant="ghost" onClick={() => updateProfile({ avatar_url: "" })}>
              <Trash2 className="w-3.5 h-3.5" /> Remove
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => updateProfile({ avatar_url: "" })}>
            Restore default
          </Button>
        </div>
        {err && <p className="text-xs text-destructive">{err}</p>}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}