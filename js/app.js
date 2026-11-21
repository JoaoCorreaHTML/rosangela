(() => {
  const WA = '5511971752204';
  const $ = (s) => document.querySelector(s);
  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
  const money = (v) => v == null ? 'Preço sob consulta' : Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const wa = (p) => `https://wa.me/${WA}?text=` + encodeURIComponent(p ? `Olá! Vim pelo site da Rosângela Corrêa Store e tenho interesse em: ${p.name}${p.brand ? ' (' + p.brand + ')' : ''}.` : 'Olá! Vim pelo site da Rosângela Corrêa Store.');
  const norm = (s) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const img = (p) => (p.images[0] || {});

  window.RC = { wa, money, norm, load: () => fetch('/.netlify/functions/catalog').then((r) => { if (!r.ok) throw new Error(); return r.json(); }) };

  // menu móvel
  const ham = $('#ham'), nav = $('#nav');
  if (ham) ham.addEventListener('click', () => { const o = nav.classList.toggle('open'); ham.setAttribute('aria-expanded', String(o)); });
  document.querySelectorAll('[data-wa]').forEach((a) => (a.href = wa()));

  function card(p) {
    const a = el('article', 'card' + (p.status === 'indisponivel' ? ' off' : ''));
    const link = el('a', 'card-img'); link.href = '/produto/' + encodeURIComponent(p.slug);
    const i = img(p); const im = el('img'); im.src = i.url || 'assets/images/logo.webp'; im.alt = i.alt || p.name; im.loading = 'lazy'; im.width = 480; im.height = 640;
    link.append(im);
    if (p.status === 'indisponivel') link.append(el('span', 'tag', 'Indisponível'));
    else if (p.badges && p.badges[0]) link.append(el('span', 'tag', p.badges[0]));
    const b = el('div', 'card-body');
    if (p.brand) b.append(el('p', 'brand', p.brand));
    const h = el('h3'); const hl = el('a', null, p.name); hl.href = link.href; h.append(hl);
    b.append(h, el('p', 'price' + (p.price == null ? ' ask' : ''), money(p.price)));
    const btn = el('a', 'btn sm', 'Consultar no WhatsApp'); btn.href = wa(p); btn.target = '_blank'; btn.rel = 'noopener noreferrer';
    b.append(btn); a.append(link, b); return a;
  }

  const grid = $('#grid');
  if (grid) {
    let data, cat = '', q = '';
    const chips = $('#chips'), count = $('#count'), search = $('#search');
    const draw = () => {
      const list = data.products.filter((p) => (!cat || p.category?.slug === cat) && (!q || norm(p.name + ' ' + (p.brand || '')).includes(q)));
      grid.replaceChildren(...list.map(card));
      count.textContent = list.length ? `${list.length} ${list.length === 1 ? 'produto' : 'produtos'}` : '';
      if (!list.length) grid.append(el('p', 'empty', cat && !q ? 'Esta categoria ainda não tem produtos. Fale com a loja para saber das novidades.' : 'Nenhum produto encontrado. Tente outro nome ou limpe os filtros.'));
    };
    const mkChips = () => {
      chips.replaceChildren(...[{ name: 'Todos', slug: '' }, ...data.categories].map((c) => {
        const b = el('button', 'chip' + (c.slug === cat ? ' on' : ''), c.name); b.type = 'button'; b.setAttribute('aria-pressed', String(c.slug === cat));
        b.onclick = () => { cat = c.slug; mkChips(); draw(); }; return b;
      }));
    };
    search.addEventListener('input', () => { q = norm(search.value.trim()); draw(); });
    RC.load().then((d) => { data = d; mkChips(); draw(); }).catch(() => grid.replaceChildren(el('p', 'empty', 'Não foi possível carregar o catálogo agora. Tente novamente em instantes ou fale com a loja pelo WhatsApp.')));
  }

  const det = $('#detail');
  if (det) {
    const slug = decodeURIComponent(location.pathname.split('/').pop() || new URLSearchParams(location.search).get('slug') || '');
    RC.load().then((d) => {
      const p = d.products.find((x) => x.slug === slug);
      if (!p) return det.replaceChildren(el('p', 'empty', 'Produto não encontrado.'));
      const pageTitle = `${p.name}${p.brand ? ' ' + p.brand : ''} | Rosângela Corrêa Store`;
      const pageUrl = `https://rosangelacorreastore.com.br/produto/${encodeURIComponent(p.slug)}`;
      const pageDescription = (p.description || `Conheça ${p.name}${p.brand ? ' da marca ' + p.brand : ''} na Rosângela Corrêa Store, no Guarujá. Consulte disponibilidade pelo WhatsApp.`).slice(0, 155);
      document.title = pageTitle;
      const setMeta = (selector, attr, value, createName, createAttr) => {
        let node = document.querySelector(selector);
        if (!node) { node = document.createElement('meta'); node.setAttribute(createName, createAttr); document.head.append(node); }
        node.setAttribute(attr, value);
      };
      setMeta('meta[name="description"]', 'content', pageDescription, 'name', 'description');
      setMeta('meta[property="og:title"]', 'content', pageTitle, 'property', 'og:title');
      setMeta('meta[property="og:description"]', 'content', pageDescription, 'property', 'og:description');
      setMeta('meta[property="og:url"]', 'content', pageUrl, 'property', 'og:url');
      setMeta('meta[property="og:image"]', 'content', img(p).url || 'https://rosangelacorreastore.com.br/assets/images/og-image.webp', 'property', 'og:image');
      const canonical = document.querySelector('link[rel="canonical"]');
      if (canonical) canonical.href = pageUrl;
      const productData = { '@context': 'https://schema.org', '@type': 'Product', name: p.name, url: pageUrl, image: p.images.map((image) => image.url).filter(Boolean), description: p.description || pageDescription, brand: p.brand ? { '@type': 'Brand', name: p.brand } : undefined };
      if (p.price != null) productData.offers = { '@type': 'Offer', priceCurrency: 'BRL', price: Number(p.price), availability: p.status === 'disponivel' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock', url: pageUrl };
      let productSchema = document.getElementById('product-jsonld');
      if (!productSchema) { productSchema = document.createElement('script'); productSchema.type = 'application/ld+json'; productSchema.id = 'product-jsonld'; document.head.append(productSchema); }
      productSchema.textContent = JSON.stringify(productData);
      const gal = el('div', 'gallery'); const main = el('img'); main.width = 720; main.height = 960;
      const show = (i) => { main.src = i.url; main.alt = i.alt || p.name; };
      show(img(p)); gal.append(main);
      if (p.images.length > 1) { const th = el('div', 'thumbs'); p.images.forEach((i) => { const b = el('button'); b.type = 'button'; b.setAttribute('aria-label', 'Ver imagem de ' + p.name); const t = el('img'); t.src = i.url; t.alt = ''; t.width = 64; t.height = 86; b.append(t); b.onclick = () => show(i); th.append(b); }); gal.append(th); }
      const info = el('div', 'info');
      if (p.brand) info.append(el('p', 'brand', p.brand));
      info.append(el('h1', null, p.name), el('p', 'price' + (p.price == null ? ' ask' : ''), money(p.price)),
        el('p', 'avail ' + p.status, p.status === 'disponivel' ? 'Disponível' : 'Indisponível no momento'));
      if (p.description) info.append(el('p', 'desc', p.description));
      const btn = el('a', 'btn', 'Consultar no WhatsApp'); btn.href = wa(p); btn.target = '_blank'; btn.rel = 'noopener noreferrer';
      const back = el('a', 'back', 'Voltar ao catálogo'); back.href = '/#catalogo';
      info.append(btn, back); det.replaceChildren(gal, info);
    }).catch(() => det.replaceChildren(el('p', 'empty', 'Não foi possível carregar o produto agora.')));
  }
})();
