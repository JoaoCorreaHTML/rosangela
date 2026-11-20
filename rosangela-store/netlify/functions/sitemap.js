const { SUPABASE_URL, SUPABASE_ANON_KEY, SITE_URL = 'https://rosangelacorreastore.com.br' } = process.env;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
exports.handler = async () => {
  let items = [];
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/products?select=slug,updated_at&order=created_at.asc`, { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } });
    if (r.ok) items = await r.json();
  } catch { /* sitemap mínimo */ }
  const urls = [`<url><loc>${esc(SITE_URL)}/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>`,
    ...items.filter((p) => /^[a-z0-9-]+$/.test(p.slug)).map((p) => `<url><loc>${esc(SITE_URL)}/produto/${p.slug}</loc><lastmod>${esc(String(p.updated_at).slice(0, 10))}</lastmod><priority>0.7</priority></url>`)];
  return { statusCode: 200, headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' }, body: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n` };
};
