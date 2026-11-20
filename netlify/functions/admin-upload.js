const crypto = require('crypto');
const { out, rest, sb, wrap, uuid, str, HttpError, env } = require('./_lib');
const MAX = 4 * 1024 * 1024;
function kind(b) {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return ['jpg', 'image/jpeg'];
  if (b.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return ['png', 'image/png'];
  if (b.slice(0, 4).toString() === 'RIFF' && b.slice(8, 12).toString() === 'WEBP') return ['webp', 'image/webp'];
  return null;
}
const rm = (p) => sb(`/storage/v1/object/product-images/${p}`, { method: 'DELETE' }).catch(() => {});
exports.handler = wrap(async (e, b) => {
  const q = e.queryStringParameters || {};
  if (e.httpMethod === 'POST') {
    const pid = uuid(b.product_id);
    if (typeof b.data !== 'string' || !/^[A-Za-z0-9+/=]+$/.test(b.data)) throw new HttpError(400, 'Imagem inválida');
    const buf = Buffer.from(b.data, 'base64');
    if (buf.length > MAX) throw new HttpError(413, 'Imagem acima de 4 MB');
    const k = kind(buf); if (!k) throw new HttpError(400, 'Use imagens JPEG, PNG ou WebP');
    const p = await rest(`products?id=eq.${pid}&select=name`); if (!p.length) throw new HttpError(404, 'Produto não encontrado');
    const existing = await rest(`product_images?product_id=eq.${pid}&select=id`);
    const main = existing.length === 0 || b.is_main === true;
    const path = `${pid}/${crypto.randomUUID()}.${k[0]}`;
    await sb(`/storage/v1/object/product-images/${path}`, { method: 'POST', headers: { 'Content-Type': k[1] }, body: buf });
    try {
      if (main) await rest(`product_images?product_id=eq.${pid}&is_main=eq.true`, { method: 'PATCH', body: JSON.stringify({ is_main: false }) });
      const r = await rest('product_images', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ product_id: pid, url: `${env.URL_}/storage/v1/object/public/product-images/${path}`, storage_path: path, alt: str(b.alt, 160, 'Texto alternativo') || p[0].name, is_main: main, position: existing.length }) });
      return out(201, r[0]);
    } catch (x) { await rm(path); throw x; }
  }
  if (e.httpMethod === 'PATCH') {
    const iid = uuid(b.image_id); const im = await rest(`product_images?id=eq.${iid}&select=product_id`); if (!im.length) throw new HttpError(404, 'Imagem não encontrada');
    await rest(`product_images?product_id=eq.${im[0].product_id}&is_main=eq.true`, { method: 'PATCH', body: JSON.stringify({ is_main: false }) });
    await rest(`product_images?id=eq.${iid}`, { method: 'PATCH', body: JSON.stringify({ is_main: true }) }); return out(200, { ok: true });
  }
  if (e.httpMethod === 'DELETE') {
    if (e.headers['x-confirm'] !== 'delete') throw new HttpError(400, 'Exclusão exige confirmação');
    const iid = uuid(q.image_id); const im = (await rest(`product_images?id=eq.${iid}&select=product_id,storage_path,is_main`))[0]; if (!im) throw new HttpError(404, 'Imagem não encontrada');
    if (im.storage_path) await rm(im.storage_path);
    await rest(`product_images?id=eq.${iid}`, { method: 'DELETE' });
    if (im.is_main) { const n = await rest(`product_images?product_id=eq.${im.product_id}&select=id&order=position&limit=1`); if (n[0]) await rest(`product_images?id=eq.${n[0].id}`, { method: 'PATCH', body: JSON.stringify({ is_main: true }) }); }
    return out(200, { ok: true });
  }
  throw new HttpError(405, 'Método não permitido');
});
