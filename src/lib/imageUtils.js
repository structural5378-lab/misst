export function loadImage(file) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = URL.createObjectURL(file);
  });
}

export async function optimizeImage(file, maxDim = 1500, quality = 0.82) {
  const img = await loadImage(file);
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d").drawImage(img, 0, 0, w, h);
  return await new Promise((res) => canvas.toBlob(res, "image/webp", quality));
}

export async function squareCropOptimize(file, dim = 512, quality = 0.85) {
  const img = await loadImage(file);
  const side = Math.min(img.width, img.height);
  const sx = (img.width - side) / 2;
  const sy = (img.height - side) / 2;
  const canvas = document.createElement("canvas");
  canvas.width = dim;
  canvas.height = dim;
  canvas.getContext("2d").drawImage(img, sx, sy, side, side, 0, 0, dim, dim);
  return await new Promise((res) => canvas.toBlob(res, "image/webp", quality));
}