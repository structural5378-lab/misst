// imageUtils — avatar/banner image processing helpers.
//
// IMPORTANT: outputs JPEG (not WebP). WebP encoding via canvas.toBlob is
// unsupported on Safari/iOS (toBlob calls back with null → upload throws),
// which was the root cause of the system-wide "Upload failed" avatar bug.
// JPEG is universally encodable and displayable. EXIF orientation is
// corrected via createImageBitmap({ imageOrientation: 'from-image' }).

export function loadImage(file) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => rej(new Error("IMAGE_DECODE_FAILED"));
    img.src = URL.createObjectURL(file);
  });
}

// Load an image with EXIF orientation corrected. Prefers createImageBitmap
// (handles orientation natively) and falls back to <img>.
export async function loadOrientedImage(file) {
  if (typeof createImageBitmap === "function") {
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
      if (bmp.width > 0 && bmp.height > 0) {
        return { source: bmp, width: bmp.width, height: bmp.height };
      }
      try { bmp.close && bmp.close(); } catch {}
    } catch (e) {
      // fall through to <img>
    }
  }
  const img = await loadImage(file);
  return { source: img, width: img.naturalWidth || img.width, height: img.naturalHeight || img.height };
}

export async function canvasToBlob(canvas, type = "image/jpeg", quality = 0.85) {
  const blob = await new Promise((res) => canvas.toBlob(res, type, quality));
  if (!blob) throw new Error("IMAGE_PROCESSING_FAILED");
  return blob;
}

export async function canvasToFile(canvas, filename, type = "image/jpeg", quality = 0.85) {
  const blob = await canvasToBlob(canvas, type, quality);
  return new File([blob], filename, { type });
}

export async function optimizeImage(file, maxDim = 1500, quality = 0.82) {
  const { source: img, width, height } = await loadOrientedImage(file);
  const scale = Math.min(1, maxDim / Math.max(width, height));
  const w = Math.max(1, Math.round(width * scale));
  const h = Math.max(1, Math.round(height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d").drawImage(img, 0, 0, w, h);
  return await canvasToBlob(canvas, "image/jpeg", quality);
}

export async function squareCropOptimize(file, dim = 512, quality = 0.85) {
  const { source: img, width, height } = await loadOrientedImage(file);
  const side = Math.min(width, height);
  const sx = (width - side) / 2;
  const sy = (height - side) / 2;
  const canvas = document.createElement("canvas");
  canvas.width = dim;
  canvas.height = dim;
  canvas.getContext("2d").drawImage(img, sx, sy, side, side, 0, 0, dim, dim);
  return await canvasToBlob(canvas, "image/jpeg", quality);
}

// ── Avatar validation ──
const AVATAR_MAX_BYTES = 10 * 1024 * 1024;
const AVATAR_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic", "image/heif"];
const AVATAR_EXTS = [".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"];

export function validateAvatarFile(file) {
  if (!file) return { ok: false, error: "No file selected." };
  if (file.size > AVATAR_MAX_BYTES) return { ok: false, error: "File too large. Maximum size is 10 MB." };
  const typeOk = file.type && AVATAR_TYPES.includes(file.type.toLowerCase());
  const extOk = AVATAR_EXTS.some((ext) => (file.name || "").toLowerCase().endsWith(ext));
  if (!typeOk && !extOk) return { ok: false, error: "Unsupported format. Use JPG, PNG, WEBP, or HEIC." };
  return { ok: true };
}