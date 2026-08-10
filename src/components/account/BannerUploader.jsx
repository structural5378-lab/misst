import React, { useRef, useState } from "react";
import { Camera, Image as ImageIcon, Trash2, RefreshCw, Loader2, AlertCircle, Upload } from "lucide-react";
import { useMistUser } from "@/hooks/useMistUser";
import { mist } from '@/api/mist';
import { Button } from "@/components/ui/button";
import { validateBannerFile } from "@/lib/imageUtils";
import BannerCropModal from "./BannerCropModal";

// Structured client-side log for every banner upload attempt.
function logBanner(ev) {
  console.log("[banner-upload]", { t: new Date().toISOString(), platform: navigator.platform, ua: navigator.userAgent, ...ev });
}

// Map raw exceptions to a meaningful, actionable message.
function describeError(e) {
  const status = e?.status || e?.response?.status;
  const msg = String(e?.message || e || "");
  if (status === 401 || status === 403 || /unauthorized|forbidden|auth/i.test(msg)) return "Your session expired. Please log in again.";
  if (status === 413 || /too large|payload|413/i.test(msg)) return "File too large. Maximum size is 15 MB.";
  if (status === 415 || /unsupported media|415/i.test(msg)) return "Unsupported format. Use JPG, PNG, WEBP, or HEIC.";
  if (/network|fetch|failed to fetch|offline|ERR_NETWORK/i.test(msg)) return "Network error. Check your connection and retry.";
  if (/timeout|timed out/i.test(msg)) return "Upload timed out. Please retry.";
  if (/IMAGE_DECODE_FAILED|IMAGE_PROCESSING_FAILED|processing|couldn't process/i.test(msg)) return "Couldn't process the image. Try a different photo.";
  if (/save|update|profile|updateMe/i.test(msg)) return "Couldn't save your banner. Please retry.";
  return "Upload failed. Check your connection and retry.";
}

const STAGE_LABEL = { processing: "Processing…", uploading: "Uploading…", saving: "Saving…" };

export default function BannerUploader() {
  const { mistUser, updateProfile } = useMistUser();
  const bannerUrl = mistUser.bannerUrl;
  const [sheet, setSheet] = useState(false);
  const [cropFile, setCropFile] = useState(null);
  const [stage, setStage] = useState("");
  const [err, setErr] = useState("");
  const [drag, setDrag] = useState(false);
  const inputCam = useRef(null);
  const inputLib = useRef(null);

  const busy = !!stage;

  const startUpload = async (file) => {
    setErr("");
    setCropFile(null);
    setStage("uploading");
    const t0 = Date.now();
    logBanner({ step: "start", size: file.size, type: file.type, name: file.name });
    try {
      const res = await mist.integrations.Core.UploadFile({ file });
      logBanner({ step: "upload", ok: true, fileUrl: res.file_url, ms: Date.now() - t0 });
      if (!res?.file_url) throw new Error("Upload failed: no URL returned.");
      setStage("saving");
      await updateProfile({ banner_url: res.file_url });
      logBanner({ step: "save", ok: true, ms: Date.now() - t0 });
    } catch (e) {
      logBanner({ step: "upload/save", ok: false, error: e?.message, status: e?.status, ms: Date.now() - t0 });
      setErr(describeError(e));
    } finally {
      setStage("");
    }
  };

  const onPicked = (f) => {
    setSheet(false);
    if (!f) return;
    const v = validateBannerFile(f);
    if (!v.ok) { setErr(v.error); return; }
    setErr("");
    setCropFile(f);
  };

  const removeBanner = async () => {
    setSheet(false);
    setErr("");
    try {
      setStage("saving");
      await updateProfile({ banner_url: "" });
      logBanner({ step: "remove", ok: true });
    } catch (e) {
      setErr(describeError(e));
      logBanner({ step: "remove", ok: false, error: e?.message });
    } finally {
      setStage("");
    }
  };

  const openCam = () => { setSheet(false); setTimeout(() => inputCam.current?.click(), 50); };
  const openLib = () => { setSheet(false); setTimeout(() => inputLib.current?.click(), 50); };

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f) { const v = validateBannerFile(f); if (!v.ok) { setErr(v.error); return; } setErr(""); setCropFile(f); } }}
        onClick={() => setSheet(true)}
        className={`relative h-28 rounded-xl overflow-hidden border border-dashed cursor-pointer transition-colors ${
          drag ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"
        }`}
      >
        {bannerUrl ? (
          <img src={bannerUrl} alt="banner" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-1">
            <ImageIcon className="w-6 h-6" />
            <span className="text-xs">Tap to upload a banner · 3:1 · max 15 MB</span>
          </div>
        )}
        {busy && (
          <div className="absolute inset-0 bg-background/75 flex flex-col items-center justify-center gap-1">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="text-[10px] text-muted-foreground font-medium">{STAGE_LABEL[stage]}</span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => setSheet(true)} disabled={busy}>
          <Upload className="w-3.5 h-3.5" /> {bannerUrl ? "Replace banner" : "Upload banner"}
        </Button>
        {bannerUrl && (
          <Button size="sm" variant="ghost" onClick={removeBanner} disabled={busy}>
            <Trash2 className="w-3.5 h-3.5" /> Remove
          </Button>
        )}
      </div>

      {err && (
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-destructive/10 border border-destructive/20">
          <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-destructive">{err}</p>
            <button onClick={() => { setErr(""); setSheet(true); }} className="text-[11px] text-destructive/80 font-semibold underline mt-1 inline-flex items-center gap-1">
              <RefreshCw className="w-3 h-3" /> Retry
            </button>
          </div>
        </div>
      )}

      {/* Hidden inputs: camera + library */}
      <input ref={inputCam} type="file" accept="image/*" capture="user" className="hidden" onChange={(e) => onPicked(e.target.files?.[0])} />
      <input ref={inputLib} type="file" accept="image/*" className="hidden" onChange={(e) => onPicked(e.target.files?.[0])} />

      {/* Action sheet */}
      {sheet && (
        <>
          <div className="fixed inset-0 z-[80] bg-black/60 fade-in" onClick={() => setSheet(false)} />
          <div className="fixed left-0 right-0 bottom-0 z-[90] sheet-up" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 8px)" }}>
            <div className="max-w-md mx-auto rounded-2xl bg-card border border-white/10 overflow-hidden shadow-2xl">
              <div className="px-4 pt-3 pb-2 text-center">
                <div className="w-10 h-1 rounded-full bg-white/15 mx-auto mb-2" />
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Profile Banner</p>
              </div>
              <div className="divide-y divide-white/[0.06]">
                <button onClick={openLib} className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-foreground hover:bg-white/5 transition-colors text-left">
                  <ImageIcon className="w-5 h-5 text-violet-400" /> Choose from Library
                </button>
                <button onClick={openCam} className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-foreground hover:bg-white/5 transition-colors text-left">
                  <Camera className="w-5 h-5 text-cyan-400" /> Take Photo
                </button>
                {bannerUrl && (
                  <button onClick={removeBanner} className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-rose-400 hover:bg-white/5 transition-colors text-left">
                    <Trash2 className="w-5 h-5" /> Remove Banner
                  </button>
                )}
              </div>
              <div className="border-t border-white/[0.06]">
                <button onClick={() => setSheet(false)} className="w-full px-4 py-3.5 text-sm font-semibold text-muted-foreground hover:bg-white/5 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Crop modal */}
      {cropFile && (
        <BannerCropModal file={cropFile} onDone={startUpload} onClose={() => setCropFile(null)} />
      )}
    </div>
  );
}