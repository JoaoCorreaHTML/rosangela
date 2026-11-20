// Chatbot por regras: toda resposta sobre produtos vem do banco; nada é inventado.
const { SUPABASE_URL, SUPABASE_ANON_KEY } = process.env;
const H = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };
const WA = '5511971752204';
const MAPS = 'https://www.google.com/maps/search/?api=1&query=Rua+Ab%C3%ADlio+do+Santos+Branco+498+Jardim+Praiano+Guaruj%C3%A1';
const IG = 'https://www.instagram.com/rosangela_correastoreoficial';
const norm = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const wa = (txt) => ({ label: 'Falar no WhatsApp', url: `https://wa.me/${WA}?text=${encodeURIComponent(txt || 'Olá! Vim pelo site da Rosângela Corrêa Store.')}` });
const money = (v) => (v == null ? 'preço sob consulta' : Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
const line = (p) => `${p.name}${p.brand ? ' (' + p.brand + ')' : ''}: ${money(p.price)}, ${p.status === 'disponivel' ? 'disponível' : 'indisponível no momento'}`;
const DEF = ['Quais categorias vocês têm?', 'Falar com a loja'];
const R = (reply, links = [], suggestions = DEF) => ({ reply, links, suggestions });

async function rest(p) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${p}`, { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } });
  if (!r.ok) throw new Error('db'); return r.json();
}
function find(t, prods) {
  let full = prods.filter((p) => t.includes(norm(p.name)));
  full = full.filter((p) => !full.some((o) => o !== p && norm(o.name).includes(norm(p.name)) && norm(o.name) !== norm(p.name)));
  if (full.length) {
    const sib = prods.filter((p) => !full.includes(p) && full.some((f) => norm(p.name).startsWith(norm(f.name) + ' ')) && !full.some((f) => t.includes(norm(p.name))));
    return [...full, ...sib];
  }
  const words = t.split(' ').filter((w) => w.length >= 4);
  return prods.filter((p) => norm(p.name).split(' ').some((n) => n.length >= 4 && words.includes(n)));
}
function answer(msg, { products, categories }) {
  const t = norm(msg);
  if (!t) return R('Escreva sua dúvida e eu ajudo.');
  const hit = find(t, products);
  if (hit.length === 1) { const p = hit[0]; return R(`${line(p)}.${p.description ? ' ' + p.description : ''}`, [{ label: 'Ver produto', url: '/produto/' + p.slug }, wa(`Olá! Vim pelo site da Rosângela Corrêa Store e tenho interesse em: ${p.name}${p.brand ? ' (' + p.brand + ')' : ''}.`)], ['Quais categorias vocês têm?']); }
  if (hit.length > 1) return R('Encontrei estes produtos:\n' + hit.slice(0, 6).map((p) => '• ' + line(p)).join('\n'), [wa()], DEF);
  if (/^(oi|ola|bom dia|boa tarde|boa noite|e ai)\b/.test(t) && t.split(' ').length <= 4) return R('Olá! Posso ajudar com produtos, categorias, disponibilidade e contato. O que você procura?');
  if (/(entrega|entregam|frete|envio|enviam)/.test(t)) return R('A loja não faz entregas. Para tirar dúvidas, fale com a equipe pelo WhatsApp.', [wa()]);
  if (/(endereco|onde fica|localizacao|como chegar|mapa)/.test(t)) return R('Você pode ver a localização da loja no Google Maps.', [{ label: 'Abrir no Google Maps', url: MAPS }]);
  if (/(instagram|insta)\b/.test(t)) return R('Estamos no Instagram.', [{ label: 'Abrir Instagram', url: IG }]);
  if (/(atendente|humano|pessoa|whatsapp|zap|telefone|contato|falar com|loja)/.test(t)) return R('O WhatsApp da loja é (11) 97175-2204. É só tocar no botão para iniciar a conversa.', [wa(), { label: 'Instagram', url: IG }], ['Quais categorias vocês têm?']);
  if (/(categoria|o que voces (vendem|tem)|tipos de produto|catalogo)/.test(t)) return R('Categorias do catálogo:\n' + categories.map((c) => `• ${c.name} (${products.filter((p) => p.category && p.category.slug === c.slug).length})`).join('\n'), [], categories.slice(0, 3).map((c) => 'Ver ' + c.name.toLowerCase()));
  const cat = categories.find((c) => t.includes(norm(c.name).replace(/s$/, '')));
  if (cat) { const l = products.filter((p) => p.category && p.category.slug === cat.slug); return l.length ? R(`${cat.name}:\n` + l.slice(0, 10).map((p) => '• ' + line(p)).join('\n') + (l.length > 10 ? `\n…e mais ${l.length - 10}. Veja todos no catálogo.` : ''), [{ label: 'Abrir catálogo', url: '/#catalogo' }]) : R(`A categoria ${cat.name} ainda não tem produtos cadastrados. Fale com a loja para saber das novidades.`, [wa(`Olá! Quero saber sobre ${cat.name.toLowerCase()}.`)]); }
  const brand = [...new Set(products.map((p) => p.brand).filter(Boolean))].find((b) => t.includes(norm(b)));
  if (brand) return R(`Produtos ${brand}:\n` + products.filter((p) => p.brand === brand).slice(0, 10).map((p) => '• ' + line(p)).join('\n'), [{ label: 'Abrir catálogo', url: '/#catalogo' }]);
  if (/(disponivel|disponibilidade|estoque|preco|valor|quanto|custa)/.test(t)) return R(`Não identifiquei o produto. Informe o nome como aparece no catálogo (por exemplo: ${products.slice(0, 2).map((p) => p.name).join(' ou ')}) ou fale com a loja.`, [wa()], ['Quais categorias vocês têm?']);
  if (/(como|onde).*(encontr|busc|pesquis|achar|ver)/.test(t)) return R('No catálogo do site, use a busca por nome ou marca e os filtros de categoria. Tocando num produto você vê os detalhes e pode consultar a loja pelo WhatsApp.', [{ label: 'Abrir catálogo', url: '/#catalogo' }]);
  return R('Não encontrei essa informação por aqui. Posso te encaminhar para um atendente da loja pelo WhatsApp.', [wa()]);
}
const hits = new Map();
exports.handler = async (event) => {
  const err = (s, m) => ({ statusCode: s, headers: H, body: JSON.stringify({ error: m }) });
  if (event.httpMethod !== 'POST') return err(405, 'Método não permitido');
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return err(500, 'Servidor sem configuração do Supabase');
  const ip = event.headers['x-nf-client-connection-ip'] || (event.headers['x-forwarded-for'] || '').split(',')[0] || 'x'; const now = Date.now();
  const h = (hits.get(ip) || []).filter((x) => now - x < 60000); if (h.length >= 20) return err(429, 'Muitas mensagens. Aguarde um minuto.'); h.push(now); hits.set(ip, h);
  let m; try { m = JSON.parse(event.body || '{}').message; } catch { return err(400, 'JSON inválido'); }
  if (typeof m !== 'string' || m.length > 300) return err(400, 'Mensagem inválida (máximo 300 caracteres)');
  try {
    const [categories, products] = await Promise.all([rest('categories?select=id,name,slug&order=sort_order'), rest('products?select=name,slug,brand,description,price,status,category:categories(slug)&order=created_at.asc')]);
    return { statusCode: 200, headers: H, body: JSON.stringify(answer(m, { products, categories })) };
  } catch { return { statusCode: 200, headers: H, body: JSON.stringify(R('Não consegui consultar o catálogo agora. Fale com a loja pelo WhatsApp.', [wa()])) }; }
};
