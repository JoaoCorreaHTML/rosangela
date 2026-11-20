(() => {
  const $ = (s) => document.querySelector(s);
  const el = (t, c, x) => { const n = document.createElement(t); if (c) n.className = c; if (x != null) n.textContent = x; return n; };
  const iconPaths = {
    products: '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 8 9 5 9-5M3 13l9 5 9-5M12 13v8"/>',
    categories: '<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z"/><circle cx="7.5" cy="7.5" r="1"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/>',
    delete: '<path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6"/>',
    add: '<path d="M12 5v14M5 12h14"/>',
    view: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>'
  };
  function addIcon(button, kind) {
    const ns = 'http://www.w3.org/2000/svg', svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('aria-hidden', 'true');
    const g = document.createElementNS(ns, 'g');
    g.setAttribute('fill', 'none'); g.setAttribute('stroke', 'currentColor');
    g.setAttribute('stroke-width', '1.8'); g.setAttribute('stroke-linecap', 'round'); g.setAttribute('stroke-linejoin', 'round');
    const template = document.createElementNS(ns, 'svg'); template.innerHTML = iconPaths[kind] || iconPaths.view;
    while (template.firstChild) g.append(template.firstChild);
    svg.append(g); button.prepend(svg); button.classList.add('has-icon');
  }
  const money = (v) => v == null ? 'Preço sob consulta' : Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const src = (u) => (u && !/^(https?:|\/)/.test(u) ? '/' + u : u);
  const S = { products: [], categories: [] };
  let tok = sessionStorage.getItem('rc_t'), ref = sessionStorage.getItem('rc_r'), editing = null;

  const toast = (m) => { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 3200); };
  const save = (d) => { tok = d.access_token; ref = d.refresh_token; sessionStorage.setItem('rc_t', tok); sessionStorage.setItem('rc_r', ref); };
  const logout = () => { sessionStorage.clear(); tok = ref = null; $('#app').hidden = true; $('#login').hidden = false; };
  async function refresh() {
    try { const r = await fetch('/.netlify/functions/admin-login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token: ref }) }); if (!r.ok) return false; save(await r.json()); return true; } catch { return false; }
  }
  async function api(fn, method = 'GET', body, extra = {}, retry = true) {
    const r = await fetch('/.netlify/functions/' + fn, { method, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tok, ...extra }, body: body ? JSON.stringify(body) : undefined });
    const d = await r.json().catch(() => ({}));
    if (r.status === 401) { if (retry && ref && await refresh()) return api(fn, method, body, extra, false); logout(); throw new Error(d.error || 'Sessão expirada'); }
    if (!r.ok) throw new Error(d.error || 'Não foi possível concluir a operação');
    return d;
  }
  const ask = (msg) => new Promise((res) => { const d = $('#xdlg'); $('#xm').textContent = msg; const end = (v) => { d.close(); res(v); }; $('#xyes').onclick = () => end(true); $('#xno').onclick = () => end(false); d.oncancel = () => res(false); d.showModal(); });
  const catName = (id) => (S.categories.find((c) => c.id === id) || {}).name || 'Sem categoria';

  async function load() { Object.assign(S, await api('admin-products')); render(); }
  function render() {
    const on = S.products.filter((p) => p.status === 'disponivel').length;
    $('#stats').replaceChildren(...[[S.products.length, 'Produtos'], [on, 'Disponíveis'], [S.products.length - on, 'Indisponíveis'], [S.categories.length, 'Categorias']].map(([n, l]) => { const s = el('div', 'stat'); const ico = el('span', 'stat-icon'); addIcon(ico, l === 'Produtos' ? 'products' : l === 'Categorias' ? 'categories' : 'view'); s.append(ico, el('b', null, n), el('span', null, l)); return s; }));
    $('#recent').replaceChildren(...S.products.slice(0, 5).map((p) => prow(p, true)));
    const pc = $('#pc'), cur = pc.value; pc.replaceChildren(new Option('Todas as categorias', ''), ...S.categories.map((c) => new Option(c.name, c.id))); pc.value = cur;
    drawProducts(); drawCats();
  }
  function prow(p, ro) {
    const r = el('div', 'row'); const i = p.images.find((x) => x.is_main) || p.images[0];
    if (i) { const im = el('img'); im.src = src(i.url); im.alt = ''; im.width = 56; im.height = 74; r.append(im); } else r.append(el('div', 'ph'));
    const m = el('div'); const b = el('b', null, p.name); b.append(el('span', 'pill' + (p.status === 'disponivel' ? ' ok' : ''), p.status === 'disponivel' ? 'Disponível' : 'Indisponível'));
    m.append(b, el('small', null, `${catName(p.category_id)} · ${money(p.price)}`)); r.append(m);
    if (!ro) { const a = el('div', 'ra'); const e = el('button', 'btn ghost xs', 'Editar'); addIcon(e, 'edit'); e.type = 'button'; e.onclick = () => openProduct(p);
      const d = el('button', 'btn ghost xs', 'Excluir'); addIcon(d, 'delete'); d.type = 'button'; d.onclick = async () => { if (!await ask(`Excluir "${p.name}" e todas as suas imagens? Esta ação não pode ser desfeita.`)) return; try { await api('admin-products?id=' + p.id, 'DELETE', null, { 'x-confirm': 'delete' }); toast('Produto excluído'); await load(); } catch (x) { toast(x.message); } };
      a.append(e, d); r.append(a); }
    return r;
  }
  const norm = (s) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  function drawProducts() {
    const q = norm($('#ps').value.trim()), c = $('#pc').value;
    const l = S.products.filter((p) => (!c || p.category_id === c) && (!q || norm(p.name + ' ' + (p.brand || '')).includes(q)));
    $('#plist').replaceChildren(...(l.length ? l.map((p) => prow(p)) : [el('p', 'sub', 'Nenhum produto encontrado.')]));
  }
  function drawCats() {
    $('#clist').replaceChildren(...S.categories.map((c) => {
      const n = S.products.filter((p) => p.category_id === c.id).length; const r = el('div', 'row cat');
      const m = el('div'); m.append(el('b', null, c.name), el('small', null, `${n} ${n === 1 ? 'produto' : 'produtos'}`));
      const a = el('div', 'ra'); const e = el('button', 'btn ghost xs', 'Editar'); e.type = 'button'; e.onclick = () => openCat(c);
      const d = el('button', 'btn ghost xs', 'Excluir'); d.type = 'button'; d.onclick = async () => { if (!await ask(`Excluir a categoria "${c.name}"?`)) return; try { await api('admin-categories?id=' + c.id, 'DELETE', null, { 'x-confirm': 'delete' }); toast('Categoria excluída'); await load(); } catch (x) { toast(x.message); } };
      a.append(e, d); r.append(m, a); return r;
    }));
  }

  function drawImgs() {
    const box = $('#pimgs'); const p = editing && S.products.find((x) => x.id === editing); $('#imgsbox').hidden = !p;
    if (!p) return; box.replaceChildren(...(p.images.length ? p.images : []).map((i) => {
      const w = el('div', 'im'); const im = el('img', i.is_main ? 'on' : ''); im.src = src(i.url); im.alt = i.alt || ''; im.width = 72; im.height = 96;
      const m = el('button', 'btn ghost xs', i.is_main ? 'Principal' : 'Tornar principal'); addIcon(m, 'view'); m.type = 'button'; m.disabled = i.is_main;
      m.onclick = async () => { try { await api('admin-upload', 'PATCH', { image_id: i.id }); await load(); drawImgs(); } catch (x) { toast(x.message); } };
      const d = el('button', 'btn ghost xs', 'Remover'); addIcon(d, 'delete'); d.type = 'button';
      d.onclick = async () => { if (!await ask('Remover esta imagem?')) return; try { await api('admin-upload?image_id=' + i.id, 'DELETE', null, { 'x-confirm': 'delete' }); await load(); drawImgs(); } catch (x) { toast(x.message); } };
      w.append(im, m, d); return w;
    }));
  }
  function openProduct(p) {
    editing = p ? p.id : null; const f = $('#pf'); f.reset(); $('#perr').textContent = ''; $('#files').value = '';
    $('#pt').textContent = p ? 'Editar produto' : 'Novo produto';
    $('#pcat').replaceChildren(new Option('Sem categoria', ''), ...S.categories.map((c) => new Option(c.name, c.id)));
    if (p) { f.name.value = p.name; f.brand.value = p.brand || ''; f.category_id.value = p.category_id || ''; f.price.value = p.price ?? ''; f.status.value = p.status; f.badges.value = (p.badges || []).join(', '); f.description.value = p.description || ''; }
    drawImgs(); $('#pdlg').showModal();
  }
  async function prep(file) {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size > 25e6) throw new Error('Use imagens JPEG, PNG ou WebP de até 25 MB');
    const bmp = await createImageBitmap(file); const s = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas'); c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s); c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    const blob = await new Promise((r) => c.toBlob(r, 'image/webp', 0.85)); if (!blob || blob.size > 3.5e6) throw new Error('Não foi possível reduzir a imagem');
    return new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(fr.result.split(',')[1]); fr.readAsDataURL(blob); });
  }
  $('#pf').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target, btn = $('#psave'), err = $('#perr'); err.textContent = ''; btn.disabled = true;
    try {
      const pr = f.price.value.trim().replace(',', '.');
      const body = { name: f.name.value, brand: f.brand.value, category_id: f.category_id.value || null, price: pr === '' ? null : pr, status: f.status.value, description: f.description.value, badges: f.badges.value.split(',').map((x) => x.trim()).filter(Boolean) };
      const files = [...$('#files').files]; const blobs = []; for (const x of files) blobs.push(await prep(x));
      const p = editing ? await api('admin-products?id=' + editing, 'PUT', body) : await api('admin-products', 'POST', body);
      for (const [i, data] of blobs.entries()) { toast(`Enviando imagem ${i + 1} de ${blobs.length}…`); await api('admin-upload', 'POST', { product_id: p.id, data, alt: p.name }); }
      $('#pdlg').close(); toast('Produto salvo'); await load();
    } catch (x) { err.textContent = x.message; } finally { btn.disabled = false; }
  });

  let ecat = null;
  function openCat(c) { ecat = c ? c.id : null; const f = $('#cf'); f.reset(); $('#cerr').textContent = ''; $('#ct').textContent = c ? 'Editar categoria' : 'Nova categoria'; if (c) { f.name.value = c.name; f.sort_order.value = c.sort_order; } $('#cdlg').showModal(); }
  $('#cf').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target;
    try { const b = { name: f.name.value, sort_order: Number(f.sort_order.value) }; await (ecat ? api('admin-categories?id=' + ecat, 'PUT', b) : api('admin-categories', 'POST', b)); $('#cdlg').close(); toast('Categoria salva'); await load(); } catch (x) { $('#cerr').textContent = x.message; }
  });

  document.querySelectorAll('[data-close]').forEach((b) => (b.onclick = () => b.closest('dialog').close()));
  document.querySelectorAll('.tabs button').forEach((b) => (b.onclick = () => { document.querySelectorAll('.tabs button').forEach((x) => x.classList.toggle('on', x === b)); ['dash', 'prod', 'cat'].forEach((v) => ($('#v-' + v).hidden = v !== b.dataset.v)); }));
  addIcon($('#np'), 'add'); addIcon($('#nc'), 'add'); $('#np').onclick = () => openProduct(null); $('#nc').onclick = () => openCat(null); $('#out').onclick = logout;
  $('#ps').addEventListener('input', drawProducts); $('#pc').addEventListener('change', drawProducts);

  async function enter() { $('#login').hidden = true; $('#app').hidden = false; try { await load(); } catch (x) { if (tok) toast(x.message); } }
  $('#lf').addEventListener('submit', async (e) => {
    e.preventDefault(); const err = $('#lerr'); err.textContent = '';
    try {
      const r = await fetch('/.netlify/functions/admin-login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: $('#em').value, password: $('#pw').value }) });
      const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.error || 'Não foi possível entrar'); save(d); $('#pw').value = ''; enter();
    } catch (x) { err.textContent = x.message; }
  });
  if (tok) enter();
})();
