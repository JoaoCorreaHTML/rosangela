const { out, rest, sb, wrap, uuid, slugify, cleanProduct, HttpError } = require('./_lib');
const SEL = 'id,name,slug,brand,description,price,status,badges,category_id,created_at,updated_at,images:product_images(id,url,alt,is_main,position)';
exports.handler = wrap(async (e, b) => {
  const id = e.queryStringParameters && e.queryStringParameters.id;
  if (e.httpMethod === 'GET') {
    const [products, categories] = await Promise.all([rest(`products?select=${SEL}&order=created_at.desc`), rest('categories?select=id,name,slug,sort_order&order=sort_order')]);
    return out(200, { products, categories });
  }
  if (e.httpMethod === 'POST') {
    const d = cleanProduct(b); const base = slugify(d.name);
    for (let i = 0; i < 3; i++) {
      try { const r = await rest('products', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ ...d, slug: i ? `${base}-${Math.random().toString(36).slice(2, 6)}` : base }) }); return out(201, r[0]); }
      catch (x) { if (!(x instanceof HttpError) || x.status !== 409 || i === 2) throw x; }
    }
  }
  if (e.httpMethod === 'PUT') {
    const r = await rest(`products?id=eq.${uuid(id)}`, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify(cleanProduct(b)) });
    if (!r.length) throw new HttpError(404, 'Produto não encontrado');
    return out(200, r[0]);
  }
  if (e.httpMethod === 'DELETE') {
    if (e.headers['x-confirm'] !== 'delete') throw new HttpError(400, 'Exclusão exige confirmação');
    const imgs = await rest(`product_images?product_id=eq.${uuid(id)}&select=storage_path`);
    for (const i of imgs) if (i.storage_path) await sb(`/storage/v1/object/product-images/${i.storage_path}`, { method: 'DELETE' }).catch(() => {});
    await rest(`products?id=eq.${id}`, { method: 'DELETE' });
    return out(200, { ok: true });
  }
  throw new HttpError(405, 'Método não permitido');
});
