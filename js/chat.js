(() => {
  const el = (tag, cls, text) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  };
  const ICONS = {
    spark: '<path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"/><path d="m19 14 .9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14Z"/>',
    grid: '<rect x="4" y="4" width="6" height="6" rx="1.5"/><rect x="14" y="4" width="6" height="6" rx="1.5"/><rect x="4" y="14" width="6" height="6" rx="1.5"/><rect x="14" y="14" width="6" height="6" rx="1.5"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    perfume: '<path d="M9 4h6v3H9zM10 7v3l-3 3v7h10v-7l-3-3V7"/><path d="M9 14h6"/>',
    clothes: '<path d="m8 4 4 2 4-2 4 4-3 3-1-1v10H8V10l-1 1-3-3 4-4Z"/>',
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',
    message: '<path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 8.5 8.5 0 0 1-3.5-.8L4 20l1.4-3.7A7.2 7.2 0 0 1 4 11.5 7.5 7.5 0 0 1 12 4a7.5 7.5 0 0 1 8 7.5Z"/><path d="M8 11h8M8 14h5"/>',
    box: '<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="m4.5 7.8 7.5 4.3 7.5-4.3M12 12v9"/>',
    arrow: '<path d="M4 12h15M13 6l6 6-6 6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'
  };
  const icon = (name) => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '18');
    svg.setAttribute('height', '18');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '1.7');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = ICONS[name] || ICONS.spark;
    return svg;
  };
  const iconButton = (button, name) => { button.replaceChildren(icon(name)); return button; };
  const fallbackImage = (slug) => {
    if (!slug) return '';
    if (slug.startsWith('parka-de-microfibra-')) {
      const n = slug.slice(-1);
      return '/assets/images/roupa' + n + '.webp';
    }
    return '/assets/images/perfumes/' + slug + '.jpeg';
  };
  const allowedUrl = (url) => typeof url === 'string' && (
    /^https:\/\/(wa\.me|www\.instagram\.com|www\.google\.com\/maps)\//.test(url) ||
    /^https:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\//.test(url) ||
    /^\/(produto\/|#catalogo|assets\/)/.test(url) ||
    url === '/#catalogo'
  );

  const fab = el('button', 'chat-fab');
  fab.type = 'button';
  fab.setAttribute('aria-expanded', 'false');
  fab.setAttribute('aria-controls', 'chatp');
  fab.setAttribute('aria-label', 'Abrir atendimento');
  fab.append(icon('spark'), el('span', null, 'Atendimento'));

  const panel = el('section', 'chat-panel');
  panel.id = 'chatp';
  panel.hidden = true;
  panel.setAttribute('aria-label', 'Atendimento da Rosângela Corrêa Store');

  const header = el('header', 'chat-hd');
  const identity = el('div', 'chat-identity');
  const avatar = el('span', 'chat-avatar', 'RC');
  const title = el('div', 'chat-title');
  title.append(el('strong', null, 'Atendimento Rosângela'), el('span', null, 'Rosângela Corrêa Store'));
  identity.append(avatar, title);
  const actions = el('div', 'chat-head-actions');
  const menu = iconButton(el('button', 'chat-menu'), 'grid');
  menu.type = 'button';
  menu.setAttribute('aria-label', 'Voltar ao menu inicial');
  const close = iconButton(el('button', 'chat-x'), 'close');
  close.type = 'button';
  close.setAttribute('aria-label', 'Fechar atendimento');
  actions.append(menu, close);
  header.append(identity, actions);

  const log = el('div', 'chat-log');
  log.setAttribute('role', 'log');
  log.setAttribute('aria-live', 'polite');
  log.setAttribute('aria-relevant', 'additions');

  const suggestions = el('div', 'chat-sg');
  const form = el('form', 'chat-f');
  const input = el('input', 'chat-input');
  input.maxLength = 300;
  input.placeholder = 'Digite sua dúvida ou procure um produto...';
  input.setAttribute('aria-label', 'Digite sua mensagem');
  const send = iconButton(el('button', 'chat-send'), 'arrow');
  send.type = 'submit';
  send.setAttribute('aria-label', 'Enviar mensagem');
  form.append(input, send);
  panel.append(header, log, suggestions, form);
  document.body.append(fab, panel);

  const addMessage = (who, text, links, cards) => {
    const message = el('article', 'msg ' + who);
    message.append(el('p', 'msg-text', text));
    (links || []).filter((link) => allowedUrl(link.url)).forEach((link) => {
      const anchor = el('a', 'msg-l', link.label || 'Abrir');
      anchor.href = link.url;
      if (/^https:\/\//.test(link.url)) {
        anchor.target = '_blank';
        anchor.rel = 'noopener noreferrer';
      }
      message.append(anchor);
    });
    (cards || []).forEach((product) => {
      const card = el('article', 'chat-product');
      if (product.image && allowedUrl(product.image.url)) {
        const image = el('img', 'chat-product-image');
        image.src = product.image.url;
        image.alt = product.image.alt || product.name || 'Imagem do produto';
        image.loading = 'lazy';
        image.onerror = () => {
          const fallback = fallbackImage(product.slug);
          if (fallback && image.src !== new URL(fallback, location.origin).href) image.src = fallback;
          else image.remove();
        };
        card.append(image);
      }
      const info = el('div', 'chat-product-info');
      if (product.brand) info.append(el('span', 'chat-product-brand', product.brand));
      info.append(el('strong', 'chat-product-name', product.name || 'Produto'));
      info.append(el('span', 'chat-product-price', product.price || 'Consulte o preço'));
      info.append(el('span', 'chat-product-status', product.status || 'Consulte disponibilidade'));
      const actions = el('div', 'chat-product-actions');
      if (allowedUrl(product.url)) {
        const details = el('a', 'chat-product-detail', 'Ver detalhes');
        details.href = product.url;
        actions.append(details);
      }
      if (allowedUrl(product.whatsapp)) {
        const contact = el('a', 'chat-product-contact', 'Consultar');
        contact.href = product.whatsapp;
        contact.target = '_blank';
        contact.rel = 'noopener noreferrer';
        actions.append(contact);
      }
      info.append(actions);
      card.append(info);
      message.append(card);
    });
    log.append(message);
    log.scrollTop = log.scrollHeight;
  };

  const ask = async (text) => {
    const message = String(text || '').trim();
    if (!message || send.disabled) return;
    addMessage('me', message);
    input.value = '';
    suggestions.replaceChildren();
    send.disabled = true;
    send.classList.add('is-loading');
    try {
      const response = await fetch('/.netlify/functions/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Não foi possível enviar sua mensagem.');
      addMessage('bot', data.reply || 'Como posso ajudar?', data.links || [], data.productCards || []);
      showSuggestions(data.suggestions || []);
    } catch (error) {
      addMessage('bot', 'Não consegui responder agora. Você pode tentar novamente ou conversar diretamente com a loja.', [
        { label: 'Conversar pelo WhatsApp', url: 'https://wa.me/5511971752204' }
      ]);
    } finally {
      send.disabled = false;
      send.classList.remove('is-loading');
      input.focus();
    }
  };

  const showSuggestions = (items) => {
    suggestions.replaceChildren(...items.slice(0, 6).map((item, index) => {
      const button = el('button', 'chat-option' + (index === 0 ? ' is-primary' : ''));
      const key = /perfume/.test(item.toLowerCase()) ? 'perfume' : /roupa/.test(item.toLowerCase()) ? 'clothes' : /produto|encontrar|buscar/.test(item.toLowerCase()) ? 'search' : /loja|atendente|whats/.test(item.toLowerCase()) ? 'message' : /disponibilidade|estoque/.test(item.toLowerCase()) ? 'box' : 'arrow';
      button.append(icon(key), el('span', null, item));
      button.type = 'button';
      button.addEventListener('click', () => ask(item));
      return button;
    }));
  };

  const open = () => {
    panel.hidden = false;
    fab.setAttribute('aria-expanded', 'true');
    if (!log.children.length) {
      addMessage('bot', 'Olá! Seja bem-vinda à Rosângela Corrêa Store. O que você gostaria de encontrar hoje?');
      showSuggestions(['Ver perfumes', 'Ver roupas', 'Encontrar um produto', 'Consultar disponibilidade', 'Falar com a loja', 'Outras dúvidas']);
    }
    input.focus();
  };
  const closePanel = () => {
    panel.hidden = true;
    fab.setAttribute('aria-expanded', 'false');
    fab.focus();
  };
  const resetMenu = () => {
    log.replaceChildren();
    addMessage('bot', 'Vamos começar novamente. Como posso ajudar você?');
    showSuggestions(['Ver perfumes', 'Ver roupas', 'Encontrar um produto', 'Consultar disponibilidade', 'Falar com a loja', 'Outras dúvidas']);
  };

  fab.addEventListener('click', open);
  close.addEventListener('click', closePanel);
  menu.addEventListener('click', resetMenu);
  panel.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closePanel();
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    ask(input.value);
  });
})();
