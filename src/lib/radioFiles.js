import { base44 } from '@/api/base44Client';

// Radio File Sharing System — shared client helpers, constants, and API wrappers.
// File-type validation mirrors the backend allowlist (base44/functions/radioFileOps).

export const ALLOWED_EXTENSIONS = [
  'csv', 'txt', 'json', 'xml', 'rdt', 'alg', 'dat', 'bin', 'img', 'chn',
  'codeplug', 'prg', 'cfg', 'conf', 'log', 'pdf', 'xlsx', 'xls', 'rtf',
  'doc', 'docx', 'chp', 'rdf', 'mem',
];
export const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
export const SUGGESTED_TAGS = [
  'GMRS', 'HAM', 'South Florida', 'Miami', 'Broward', 'Palm Beach',
  'Repeaters', 'Simplex', 'Emergency', 'Travel', 'Base', 'Mobile',
];

export function fileExt(name) {
  return String(name || '').split('.').pop().toLowerCase();
}
export function isAllowedFile(name) {
  return ALLOWED_EXTENSIONS.includes(fileExt(name));
}

export function formatSize(bytes) {
  const n = Number(bytes);
  if (!n || n <= 0) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1048576) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1048576).toFixed(1)} MB`;
}

export function parseJSON(v, fb) {
  if (v == null) return fb;
  if (Array.isArray(v) || typeof v === 'object') return v;
  try { return JSON.parse(v); } catch { return fb; }
}

// ── API wrappers ────────────────────────────────────────────────────────
export const fetchManufacturers = () => base44.entities.RadioManufacturer.list(500);
export const fetchModels = () => base44.entities.RadioModel.list(1000);
export const fetchUserRadios = (userId) =>
  base44.entities.UserRadio.filter({ user_id: userId }, '-created_date', 200);
export const fetchPublicFilesByUser = (userId) =>
  base44.entities.RadioFile.filter({ uploader_id: userId, visibility: 'public', deleted: false }, '-created_date', 100);
export const fetchMyUploads = (userId) =>
  base44.entities.RadioFile.filter({ uploader_id: userId, deleted: false }, '-created_date', 200);
export const fetchAllPublicFiles = () =>
  base44.entities.RadioFile.filter({ visibility: 'public', deleted: false }, '-created_date', 500);
export const fetchFile = (id) => base44.entities.RadioFile.get(id);

// Files compatible with a user's radios (matched by radio_model_id).
export async function fetchCompatibleFiles(modelIds) {
  if (!modelIds || modelIds.length === 0) return [];
  const all = await fetchAllPublicFiles();
  const set = new Set(modelIds);
  return all.filter((f) => set.has(f.radio_model_id));
}

// Client-side search across the fetched file set.
export function searchFiles(files, q) {
  const term = String(q || '').toLowerCase().trim();
  if (!term) return files;
  return files.filter((f) => {
    const tags = parseJSON(f.tags, []);
    return [
      f.manufacturer_name, f.model_name, f.file_name, f.description,
      f.uploader_name, ...(tags || []),
    ].some((v) => String(v || '').toLowerCase().includes(term));
  });
}

export async function radioFileOps(payload) {
  const res = await base44.functions.invoke('radioFileOps', payload);
  return res.data;
}

export async function uploadRadioFile(file) {
  const res = await base44.integrations.Core.UploadFile({ file });
  return res.file_url;
}