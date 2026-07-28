import React, { useEffect, useRef, useState, useCallback } from "react";
import { X, Check, ZoomIn, ZoomOut, Loader2, AlertCircle } from "lucide-react";
import { loadOrientedImage, canvasToFile } from "@/lib/imageUtils";
import { Button } from "@/components/ui/button";

const VP = 300; // viewport (square, px)
const OUTPUT = 512; // output avatar size (px)
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

// AvatarCropModal — square crop with pinch-to-zoom (touch) / wheel-zoom
// (desktop) and drag-to-pan. Outputs a 512×512 JPEG File. Handles EXIF
// orientation via loadOrientedImage.
export default function AvatarCropModal({ file, onDone, onClose }) {
  const [src, setSrc] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const viewportRef = useRef(null);
  const pointers = useRef(new Map());
  const pinch = useRef(null);
  const pan = useRef(null);

  useEffect(() => {
    let disposed = false;
    setErr("");
    setSrc(null);
    loadOrientedImage(file)
      .then((s) => { if (!disposed) setSrc(s); })
      .catch(() => { if (!disposed) setErr("Couldn't process this image. Try a different photo."); });
    return () => { disposed = true; };
  }, [file]);

  // Render the ORIENTED source to a canvas so the live preview matches the
  // crop math exactly (an ImageBitmap can't be an <img src>).
  const displayRef = useRef(null);
  useEffect(() => {
    if (!src || !displayRef.current) return;
    const c = displayRef.current;
    c.width = src.width;
    c.height = src.height;
    c.getContext("2d").drawImage(src.source, 0, 0);
  }, [src]);

  const baseScale = src ? Math.max(VP / src.width, VP / src.height) : 1;

  const clampOffset = useCallback((ox, oy, z) => {
    if (!src) return { x: 0, y: 0 };
    const ds = baseScale * z;
    const dw = src.width * ds;
    const dh = src.height * ds;
    const maxX = Math.max(0, (dw - VP) / 2);
    const maxY = Math.max(0, (dh - VP) / 2);
    return {
      x: Math.max(-maxX, Math.min(maxX, ox || 0)),
      y: Math.max(-maxY, Math.min(maxY, oy || 0)),
    };
  }, [baseScale, src]);

  const setZoomClamped = useCallback((z) => {
    const nz = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z));
    setZoom(nz);
    setOffset((o) => clampOffset(o.x, o.y, nz));
  }, [clampOffset]);

  const localPoint = (e) => {
    const r = viewportRef.current.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const onPointerDown = (e) => {
    e.preventDefault();
    try { viewportRef.current.setPointerCapture(e.pointerId); } catch {}
    const p = localPoint(e);
    pointers.current.set(e.pointerId, p);
    if (pointers.current.size === 2) {
      const pts = Array.from(pointers.current.values());
      pinch.current = { dist: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y), zoom };
      pan.current = null;
    } else {
      pan.current = { start: p, offset: { ...offset } };
    }
  };

  const onPointerMove = (e) => {
    if (!pointers.current.has(e.pointerId)) return;
    const p = localPoint(e);
    pointers.current.set(e.pointerId, p);
    if (pointers.current.size >= 2 && pinch.current) {
      const pts = Array.from(pointers.current.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const ratio = dist / (pinch.current.dist || dist);
      setZoomClamped(pinch.current.zoom * ratio);
    } else if (pan.current) {
      const dx = p.x - pan.current.start.x;
      const dy = p.y - pan.current.start.y;
      setOffset(clampOffset(pan.current.offset.x + dx, pan.current.offset.y + dy, zoom));
    }
  };

  const onPointerUp = (e) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (pointers.current.size === 1) {
      const p = Array.from(pointers.current.values())[0];
      pan.current = { start: p, offset: { ...offset } };
    } else if (pointers.current.size === 0) {
      pan.current = null;
    }
  };

  const onWheel = (e) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.12 : 0.88;
    setZoomClamped(zoom * factor);
  };

  const dispScale = baseScale * zoom;
  const dispW = src ? src.width * dispScale : 0;
  const dispH = src ? src.height * dispScale : 0;
  const imgLeft = (VP - dispW) / 2 + offset.x;
  const imgTop = (VP - dispH) / 2 + offset.y;

  const handleUse = async () => {
    if (!src) return;
    setBusy(true);
    setErr("");
    try {
      const ds = baseScale * zoom;
      let sx = -((VP - src.width * ds) / 2 + offset.x) / ds;
      let sy = -((VP - src.height * ds) / 2 + offset.y) / ds;
      let sw = VP / ds;
      let sh = VP / ds;
      sx = Math.max(0, Math.min(sx, src.width - 1));
      sy = Math.max(0, Math.min(sy, src.height - 1));
      sw = Math.min(sw, src.width - sx);
      sh = Math.min(sh, src.height - sy);
      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT;
      canvas.height = OUTPUT;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, OUTPUT, OUTPUT);
      ctx.drawImage(src.source, sx, sy, sw, sh, 0, 0, OUTPUT, OUTPUT);
      const out = await canvasToFile(canvas, `avatar-${Date.now()}.jpg`, "image/jpeg", 0.85);
      onDone(out);
    } catch (e) {
      setErr("Couldn't process the image. Try a different photo.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 fade-in">
      <div className="w-full max-w-sm rounded-2xl bg-card border border-white/10 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h2 className="text-sm font-bold text-foreground">Crop Avatar</h2>
          <button onClick={onClose} className="p-1.5 -m-1 text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col items-center gap-4 p-5">
          <p className="text-[11px] text-muted-foreground -mt-1">Drag to reposition · pinch or scroll to zoom</p>

          <div
            ref={viewportRef}
            className="relative bg-black rounded-xl overflow-hidden touch-none select-none cursor-grab active:cursor-grabbing"
            style={{ width: VP, height: VP }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onWheel={onWheel}
          >
            {src ? (
              <canvas
                ref={displayRef}
                style={{
                  position: "absolute",
                  width: dispW,
                  height: dispH,
                  transform: `translate(${imgLeft}px, ${imgTop}px)`,
                  maxWidth: "none",
                  pointerEvents: "none",
                }}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                {err ? <AlertCircle className="w-8 h-8 text-rose-400" /> : <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />}
              </div>
            )}
            {/* crop guide overlay */}
            <div className="absolute inset-0 pointer-events-none border-2 border-white/30 rounded-xl" />
          </div>

          {err ? (
            <p className="text-xs text-rose-400 text-center">{err}</p>
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={() => setZoomClamped(zoom - 0.2)} disabled={!src} className="p-2 rounded-lg bg-white/5 border border-white/10 text-foreground disabled:opacity-40">
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs text-muted-foreground tabular-nums w-10 text-center">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoomClamped(zoom + 0.2)} disabled={!src} className="p-2 rounded-lg bg-white/5 border border-white/10 text-foreground disabled:opacity-40">
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-white/10">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button size="sm" onClick={handleUse} disabled={!src || busy || !!err}>
            {busy ? (<><Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing…</>) : (<><Check className="w-3.5 h-3.5" /> Use Photo</>)}
          </Button>
        </div>
      </div>
    </div>
  );
}