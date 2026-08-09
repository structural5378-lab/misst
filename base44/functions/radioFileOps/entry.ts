import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// radioFileOps — server-side operations for the Radio File Sharing System.
// Handles upload (validated create), newVersion (append to versions), and
// download (access-gated via RLS + download counter increment via service role).
// Metadata edits, visibility toggle, and soft-delete are done client-side
// (RLS permits owner/admin update). Admin moderation is client-side too.
//
// Security: file extensions are validated against an allowlist of radio
// programming / config / doc types; executables and scripts are rejected.
// Files are stored as downloadable blobs via the UploadFile integration and
// are never executed server-side.

const ALLOWED_EXT = [
  'csv', 'txt', 'json', 'xml', 'rdt', 'alg', 'dat', 'bin', 'img', 'chn',
  'codeplug', 'prg', 'cfg', 'conf', 'log', 'pdf', 'xlsx', 'xls', 'rtf',
  'doc', 'docx', 'chp', 'rdf', 'mem',
];
const MAX_SIZE = 25 * 1024 * 1024; // 25MB

function extOf(name) {
  return String(name || '').split('.').pop().toLowerCase();
}
function safeParse(v, fb) {
  if (v == null) return fb;
  if (Array.isArray(v)) return v;
  try { return JSON.parse(v); } catch { return fb; }
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = body.action;
    const displayName = user.full_name || user.email || '';

    // ── UPLOAD ──────────────────────────────────────────────────────────
    if (action === 'upload') {
      if (!body.file_url) return Response.json({ error: 'Missing file.' }, { status: 400 });
      if (!body.file_name) return Response.json({ error: 'File name required.' }, { status: 400 });
      if (!body.radio_model_id) return Response.json({ error: 'Radio model required.' }, { status: 400 });
      const ext = extOf(body.file_name);
      if (!ALLOWED_EXT.includes(ext)) {
        return Response.json({ error: 'File type ".' + ext + '" is not allowed. Permitted: ' + ALLOWED_EXT.join(', ') }, { status: 400 });
      }
      if (body.file_size && Number(body.file_size) > MAX_SIZE) {
        return Response.json({ error: 'File too large (max 25MB).' }, { status: 400 });
      }
      const now = new Date().toISOString();
      const versionLabel = String(body.version || '1.0').trim() || '1.0';
      const versions = [{
        version: versionLabel,
        file_url: body.file_url,
        file_size: Number(body.file_size) || 0,
        uploaded_by: user.id,
        uploaded_by_name: displayName,
        uploaded_at: now,
        notes: body.notes || '',
      }];
      const record = await base44.entities.RadioFile.create({
        uploader_id: user.id,
        uploader_name: displayName,
        radio_model_id: body.radio_model_id,
        manufacturer_name: body.manufacturer_name || '',
        model_name: body.model_name || '',
        file_name: body.file_name,
        file_url: body.file_url,
        file_type: ext,
        file_size: Number(body.file_size) || 0,
        description: body.description || '',
        notes: body.notes || '',
        version: versionLabel,
        versions: JSON.stringify(versions),
        visibility: body.visibility === 'private' ? 'private' : 'public',
        hidden: false,
        deleted: false,
        verified: false,
        featured: false,
        community: false,
        download_count: 0,
        tags: JSON.stringify(Array.isArray(body.tags) ? body.tags : []),
      });
      return Response.json({ file: record });
    }

    // ── NEW VERSION ─────────────────────────────────────────────────────
    if (action === 'newVersion') {
      if (!body.file_id) return Response.json({ error: 'File id required.' }, { status: 400 });
      if (!body.file_url) return Response.json({ error: 'Missing file.' }, { status: 400 });
      let file;
      try { file = await base44.entities.RadioFile.get(body.file_id); } catch { file = null; }
      if (!file) return Response.json({ error: 'File not found.' }, { status: 404 });
      if (file.created_by_id !== user.id && user.role !== 'admin') {
        return Response.json({ error: 'Forbidden.' }, { status: 403 });
      }
      const name = body.file_name || file.file_name;
      const ext = extOf(name);
      if (!ALLOWED_EXT.includes(ext)) {
        return Response.json({ error: 'File type ".' + ext + '" is not allowed.' }, { status: 400 });
      }
      const now = new Date().toISOString();
      const versionLabel = String(body.version || '').trim() || String(file.versions ? safeParse(file.versions, []).length + 1 : '1.0');
      const versions = safeParse(file.versions, []);
      versions.push({
        version: versionLabel,
        file_url: body.file_url,
        file_size: Number(body.file_size) || 0,
        uploaded_by: user.id,
        uploaded_by_name: displayName,
        uploaded_at: now,
        notes: body.notes || '',
      });
      const updated = await base44.entities.RadioFile.update(file.id, {
        file_url: body.file_url,
        file_size: Number(body.file_size) || 0,
        file_name: name,
        file_type: ext,
        version: versionLabel,
        versions: JSON.stringify(versions),
      });
      return Response.json({ file: updated });
    }

    // ── DOWNLOAD ────────────────────────────────────────────────────────
    // RLS gates the read (public+not hidden+not deleted, owner, or admin).
    // The counter increment uses the service role (owner/admin-only writes).
    if (action === 'download') {
      if (!body.file_id) return Response.json({ error: 'File id required.' }, { status: 400 });
      let file;
      try { file = await base44.entities.RadioFile.get(body.file_id); } catch { file = null; }
      if (!file || file.deleted) return Response.json({ error: 'File not available.' }, { status: 404 });
      let url = file.file_url;
      if (body.version) {
        const versions = safeParse(file.versions, []);
        const v = versions.find((x) => x.version === body.version);
        if (v) url = v.file_url;
      }
      if (!url) return Response.json({ error: 'File not available.' }, { status: 404 });
      // best-effort counter increment (service role bypasses write RLS)
      base44.asServiceRole.entities.RadioFile
        .update(file.id, { download_count: (Number(file.download_count) || 0) + 1 })
        .catch(() => {});
      return Response.json({ url });
    }

    return Response.json({ error: 'Unknown action.' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}