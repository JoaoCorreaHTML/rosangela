// Atendimento por regras: respostas baseadas exclusivamente no catálogo real do Supabase.
const { SUPABASE_URL, SUPABASE_ANON_KEY } = process.env;
const H = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };
const WA = '5511971752204';
const MAPS = 'https://www.google.com/maps/search/?api=1&query=Rua+Ab%C3%ADlio+do+Santos+Branco+498+Jardim+Praiano+Guaruj%C3%A1';
const IG = 'https://www.instagram.com/rosangela_correastoreoficial';
const norm = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const wa = (txt) => ({ label: 'Conversar pelo WhatsApp', url: 'https://wa.me/' + WA + '?text=' + encodeURIComponent(txt || 'Olá! Vim pelo site da Rosângela Corrêa Store.') });
const money = (v) => (v == null ? 'Preço sob consulta' : Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
const line = (p) => p.name + (p.brand ? ' (' + p.brand + ')' : '') + ' — ' + money(p.price) + ' · ' + (p.status === 'disponivel' ? 'Disponível' : 'Indisponível no momento');
const DEF = ['Ver perfumes', 'Ver roupas', 'Falar com a loja'];
const R = (reply, links, suggestions, productCards) => ({
  reply: reply || '',
  links: links || [],
  suggestions: suggestions || DEF,
  productCards: productCards || []
});

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

function fallbackImageFor(p) {
  const slug = String(p.slug || '');
  if (/^parka-de-microfibra-[1-4]$/.test(slug)) return '/assets/images/roupa' + slug.slice(-1) + '.webp';
  const known = {
    'asad': 'asad.jpeg', 'salvo-elixir': 'salvo-elixir.jpeg', 'yeah-man': 'yeah-man.jpeg',
    'victorioso': 'victorioso.jpeg', 'atheeri': 'atheeri.jpeg', 'yara': 'yara.jpeg',
    'no-2-men': 'no-2-men.jpeg', 'opulent-dubai': 'opulent-dubai.jpeg',
    'delilah-pour-femme': 'delilah-pour-femme.jpeg', 'fakhar-gold': 'fakhar-gold.jpeg',
    'asad-zanzibar': 'asad-zanzibar.jpeg'
  };
  return known[slug] ? '/assets/images/perfumes/' + known[slug] : null;
}

function imageFor(p) {
  const images = Array.isArray(p.images) ? p.images.slice().sort((a, b) =>
    (Number(b.is_main) - Number(a.is_main)) || (Number(a.position) - Number(b.position))
  ) : [];
  const item = images[0];
  if (!item || !item.url) return fallbackImageFor(p) ? { url: fallbackImageFor(p), alt: p.name } : null;
  let url = String(item.url).trim();
  if (/^assets\//.test(url)) url = '/' + url;
  if (!/^https:\/\//.test(url) && !/^\/(?!\/)/.test(url)) return fallbackImageFor(p) ? { url: fallbackImageFor(p), alt: p.name } : null;
  return { url, alt: item.alt || p.name };
}

function cardFor(p) {
  return {
    name: p.name,
    slug: p.slug,
    brand: p.brand || '',
    price: money(p.price),
    status: p.status === 'disponivel' ? 'Disponível' : 'Indisponível no momento',
    image: imageFor(p),
    url: '/produto/' + encodeURIComponent(p.slug),
    whatsapp: wa('Olá! Vim pelo site da Rosângela Corrêa Store e tenho interesse em: ' + p.name + (p.brand ? ' (' + p.brand + ')' : '') + '.')
  };
}

function answer(msg, data) {
  const products = data.products;
  const categories = data.categories;
  const t = norm(msg);
  if (!t) return R('Escreva sua dúvida e eu ajudo.');

  const hit = find(t, products);
  if (hit.length === 1) {
    const p = hit[0];
    return R(
      p.description ? p.description : 'Encontrei este produto no catálogo da loja. Confira os detalhes e consulte a disponibilidade pelo WhatsApp.',
      [{ label: 'Ver detalhes do produto', url: '/produto/' + p.slug }, wa('Olá! Tenho interesse em: ' + p.name + '.')],
      ['Ver outros produtos', 'Consultar disponibilidade', 'Falar com a loja'],
      [cardFor(p)]
    );
  }
  if (hit.length > 1) {
    return R('Encontrei algumas opções que podem corresponder à sua busca:', [wa()], ['Ver perfumes', 'Ver roupas'], hit.slice(0, 6).map(cardFor));
  }

  if (/^(oi|ola|bom dia|boa tarde|boa noite|e ai)\b/.test(t) && t.split(' ').length <= 4) {
    return R('Olá! Seja bem-vinda à Rosângela Corrêa Store. Como posso ajudar você hoje?', [], ['Ver perfumes', 'Ver roupas', 'Encontrar um produto']);
  }
  if (/(entrega|entregam|frete|envio|enviam)/.test(t)) return R('No momento, a loja não realiza entregas. Para confirmar outras informações, fale diretamente com a equipe.', [wa()]);
  if (/(endereco|onde fica|localizacao|como chegar|mapa)/.test(t)) return R('A loja fica no Guarujá, em São Paulo. Você pode consultar a localização pelo mapa.', [{ label: 'Ver localização no mapa', url: MAPS }]);
  if (/(instagram|insta)\b/.test(t)) return R('Acompanhe as novidades da loja pelo Instagram.', [{ label: 'Visitar Instagram', url: IG }]);
  if (/(atendente|humano|pessoa|whatsapp|zap|telefone|contato|falar com|loja)/.test(t)) return R('Nossa equipe pode atender você pelo WhatsApp: (11) 97175-2204.', [wa(), { label: 'Instagram da loja', url: IG }], ['Ver perfumes', 'Ver roupas']);
  if (/(categoria|o que voces (vendem|tem)|tipos de produto|catalogo)/.test(t)) {
    return R('Estas são as categorias disponíveis no catálogo:', [{ label: 'Abrir catálogo completo', url: '/#catalogo' }], categories.slice(0, 4).map((c) => 'Ver ' + c.name), []);
  }

  const cat = categories.find((c) => t.includes(norm(c.name).replace(/s$/, '')));
  if (cat) {
    const list = products.filter((p) => p.category && p.category.slug === cat.slug);
    return list.length
      ? R('Aqui estão algumas opções da categoria ' + cat.name + ':', [{ label: 'Ver catálogo completo', url: '/#catalogo' }], ['Ver outras categorias', 'Falar com a loja'], list.slice(0, 6).map(cardFor))
      : R('Ainda não há produtos cadastrados na categoria ' + cat.name + '.', [wa('Olá! Gostaria de saber sobre novidades em ' + cat.name + '.')]);
  }

  const brand = [...new Set(products.map((p) => p.brand).filter(Boolean))].find((b) => t.includes(norm(b)));
  if (brand) {
    const list = products.filter((p) => p.brand === brand);
    return R('Encontrei estes produtos da marca ' + brand + ':', [{ label: 'Abrir catálogo', url: '/#catalogo' }], ['Ver perfumes', 'Falar com a loja'], list.slice(0, 6).map(cardFor));
  }

  if (/(disponivel|disponibilidade|estoque|preco|valor|quanto|custa)/.test(t)) {
    return R('Não consegui identificar qual produto você procura. Digite o nome do produto como aparece no catálogo ou escolha uma categoria.', [{ label: 'Ver catálogo', url: '/#catalogo' }], ['Ver perfumes', 'Ver roupas', 'Falar com a loja']);
  }
  if (/(como|onde).*(encontr|busc|pesquis|achar|ver)/.test(t)) return R('Você pode explorar a coleção pelo catálogo, usar a busca por nome ou marca e filtrar por categoria. Selecione um produto para ver os detalhes.', [{ label: 'Explorar catálogo', url: '/#catalogo' }], ['Ver perfumes', 'Ver roupas']);
  return R('Ainda não tenho essa informação cadastrada. Posso ajudar você a encontrar um produto ou encaminhar sua dúvida para a equipe da loja.', [wa()], ['Ver perfumes', 'Ver roupas', 'Falar com a loja']);
}

const hits = new Map();
exports.handler = async (event) => {
  const err = (status, message) => ({ statusCode: status, headers: H, body: JSON.stringify({ error: message }) });
  if (event.httpMethod !== 'POST') return err(405, 'Método não permitido');
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return err(500, 'Servidor sem configuração do Supabase');

  const headers = event.headers || {};
  const ip = headers['x-nf-client-connection-ip'] || (headers['x-forwarded-for'] || '').split(',')[0] || 'x';
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((time) => now - time < 60000);
  if (recent.length >= 20) return err(429, 'Muitas mensagens. Aguarde um minuto.');
  recent.push(now);
  hits.set(ip, recent);

  let message;
  try { message = JSON.parse(event.body || '{}').message; } catch { return err(400, 'JSON inválido'); }
  if (typeof message !== 'string' || message.length > 300) return err(400, 'Mensagem inválida (máximo 300 caracteres)');

  try {
    const [categories, products] = await Promise.all([
      fetch(SUPABASE_URL + '/rest/v1/categories?select=id,name,slug&order=sort_order', {
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: 'Bearer ' + SUPABASE_ANON_KEY }
      }).then((r) => { if (!r.ok) throw new Error('categories'); return r.json(); }),
      fetch(SUPABASE_URL + '/rest/v1/products?select=name,slug,brand,description,price,status,category:categories(slug),images:product_images(url,alt,is_main,position)&order=created_at.asc', {
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: 'Bearer ' + SUPABASE_ANON_KEY }
      }).then((r) => { if (!r.ok) throw new Error('products'); return r.json(); })
    ]);
    return { statusCode: 200, headers: H, body: JSON.stringify(answer(message, { products, categories })) };
  } catch (error) {
    console.error('[CHAT CATALOG ERROR]', { name: error && error.name || 'Error' });
    return { statusCode: 200, headers: H, body: JSON.stringify(R('Não consegui consultar o catálogo agora. Tente novamente ou fale com a loja pelo WhatsApp.', [wa()])) };
  }
};
