const { out, rest, wrap, uuid, slugify, str, HttpError } = require('./_lib');
const clean = (b) => { const n = Number(b.sort_order ?? 0); if (!Number.isInteger(n) || n < 0 || n > 999) throw new HttpError(400, 'Ordem inválida'); return { name: str(b.name, 60, 'Nome', true), sort_order: n }; };
exports.handler = wrap(async (e, b) => {
  const id = e.queryStringParameters && e.queryStringParameters.id;
  if (e.httpMethod === 'GET') return out(200, await rest('categories?select=id,name,slug,sort_order&order=sort_order'));
  if (e.httpMethod === 'POST') { const d = clean(b); return out(201, (await rest('categories', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ ...d, slug: slugify(d.name) }) }))[0]); }
  if (e.httpMethod === 'PUT') { const r = await rest(`categories?id=eq.${uuid(id)}`, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify(clean(b)) }); if (!r.length) throw new HttpError(404, 'Categoria não encontrada'); return out(200, r[0]); }
  if (e.httpMethod === 'DELETE') {
    if (e.headers['x-confirm'] !== 'delete') throw new HttpError(400, 'Exclusão exige confirmação');
    const used = await rest(`products?category_id=eq.${uuid(id)}&select=id&limit=1`);
    if (used.length) throw new HttpError(409, 'Esta categoria tem produtos. Mova ou exclua os produtos antes');
    await rest(`categories?id=eq.${id}`, { method: 'DELETE' }); return out(200, { ok: true });
  }
  throw new HttpError(405, 'Método não permitido');
});
