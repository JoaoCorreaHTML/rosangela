(() => {
  const el = (tag, cls, text) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  };
  const allowedUrl = (url) => typeof url === 'string' && (
    /^https:\/\/(wa\.me|www\.instagram\.com|www\.google\.com\/maps)\//.test(url) ||
    /^\/(produto\/|#catalogo|assets\/)/.test(url) ||
    url === '/#catalogo'
  );

  const fab = el('button', 'chat-fab');
  fab.type = 'button';
  fab.setAttribute('aria-expanded', 'false');
  fab.setAttribute('aria-controls', 'chatp');
  fab.setAttribute('aria-label', 'Abrir atendimento');
  fab.innerHTML = '<span class="chat-fab-icon" aria-hidden="true">✦</span><span>Atendimento</span>';

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
  const menu = el('button', 'chat-menu', '⌘');
  menu.type = 'button';
  menu.setAttribute('aria-label', 'Voltar ao menu inicial');
  const close = el('button', 'chat-x', '×');
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
  const send = el('button', 'chat-send', '➤');
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
      const button = el('button', 'chat-option' + (index === 0 ? ' is-primary' : ''), item);
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
