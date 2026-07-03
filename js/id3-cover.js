// ============================================
// OMNIBITES — ID3v2.3 Cover Art Embedder
// Genera un tag ID3 con portada (APIC) y lo antepone a los datos MP3
// ============================================

function strToBytes(s) { return new Uint8Array([...s].map(c => c.charCodeAt(0))); }

function concatBytes(arrs) {
  let len = 0; arrs.forEach(a => len += a.length);
  const out = new Uint8Array(len);
  let o = 0; arrs.forEach(a => { out.set(a, o); o += a.length; });
  return out;
}

function writeUInt32BE(buf, offset, val) {
  buf[offset]   = (val >>> 24) & 0xFF;
  buf[offset+1] = (val >>> 16) & 0xFF;
  buf[offset+2] = (val >>> 8)  & 0xFF;
  buf[offset+3] = val & 0xFF;
}

function writeSyncSafe(buf, offset, val) {
  buf[offset]   = (val >>> 21) & 0x7F;
  buf[offset+1] = (val >>> 14) & 0x7F;
  buf[offset+2] = (val >>> 7)  & 0x7F;
  buf[offset+3] = val & 0x7F;
}

// Descarga una imagen y la comprime a JPEG chiquito (máx 300px, calidad 0.72)
export async function getCoverJpegBytes(imgUrl, maxSize = 300, quality = 0.72) {
  if (!imgUrl) return null;
  try {
export async function getCoverJpegBytes(imgUrl, maxSize = 300, quality = 0.72) {
  if (!imgUrl) return null;
  try {
    const res = await fetch(imgUrl, { mode: 'cors' });
    if (!res.ok) throw new Error('img fetch failed: HTTP ' + res.status);
    const blob = await res.blob();
    const bitmap = await createImageBitmap(blob);
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width  * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h);
    const outBlob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', quality));
    if (!outBlob) return null;
    return new Uint8Array(await outBlob.arrayBuffer());
  } catch (e) {
    console.warn('Portada no embebida (CORS o imagen inválida):', imgUrl, '—', e.message);
    return null; // CORS bloqueado o imagen inválida — no rompe la descarga
  }
}

// Construye un tag ID3v2.3 con frame APIC (portada) a partir de bytes JPEG
export function buildID3Cover(jpegBytes) {
  if (!jpegBytes) return null;
  const encodingByte = new Uint8Array([0]);        // ISO-8859-1
  const mime      = strToBytes('image/jpeg\0');
  const picType   = new Uint8Array([3]);           // 3 = Cover (front)
  const desc      = strToBytes('\0');               // descripción vacía
  const frameData = concatBytes([encodingByte, mime, picType, desc, jpegBytes]);

  const frameHeader = new Uint8Array(10);
  frameHeader.set(strToBytes('APIC'), 0);
  writeUInt32BE(frameHeader, 4, frameData.length);  // tamaño del frame (no sync-safe en v2.3)

  const frame = concatBytes([frameHeader, frameData]);

  const header = new Uint8Array(10);
  header.set(strToBytes('ID3'), 0);
  header[3] = 3; header[4] = 0;                     // versión 2.3.0
  header[5] = 0;                                    // flags
  writeSyncSafe(header, 6, frame.length);           // tamaño del tag (sync-safe)

  return concatBytes([header, frame]);
}

// Une el tag ID3 (si hay portada) con los chunks MP3 de lamejs
export async function buildMp3Blob(mp3Chunks, imgUrl) {
  const jpeg  = await getCoverJpegBytes(imgUrl);
  const id3   = buildID3Cover(jpeg);
  const parts = id3 ? [id3, ...mp3Chunks] : mp3Chunks;
  return new Blob(parts, { type: 'audio/mpeg' });
}
