(() => {
  const el = (t, c, x) => { const n = document.createElement(t); if (c) n.className = c; if (x != null) n.textContent = x; return n; };
  const okUrl = (u) => /^(https:\/\/(wa\.me|www\.instagram\.com|www\.google\.com\/maps)\/|\/produto\/|\/#catalogo)/.test(u);
  const btn = el('button', 'chat-fab', 'Atendimento'); btn.type = 'button'; btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', 'chatp');
  const p = el('section', 'chat-panel'); p.id = 'chatp'; p.hidden = true; p.setAttribute('aria-label', 'Atendimento da loja');
  const hd = el('div', 'chat-hd'); const x = el('button', 'chat-x', 'Fechar'); x.type = 'button'; hd.append(el('strong', null, 'Atendimento'), x);
  const log = el('div', 'chat-log'); log.setAttribute('role', 'log'); log.setAttribute('aria-live', 'polite');
  const sg = el('div', 'chat-sg'); const f = el('form', 'chat-f'); const inp = el('input'); inp.maxLength = 300; inp.placeholder = 'Escreva sua dúvida'; inp.setAttribute('aria-label', 'Sua mensagem'); const send = el('button', 'btn', 'Enviar'); send.type = 'submit'; f.append(inp, send);
  p.append(hd, log, sg, f); document.body.append(btn, p);

  const add = (who, text, links = []) => {
    const m = el('div', 'msg ' + who); m.append(el('p', null, text));
    links.filter((l) => okUrl(l.url)).forEach((l) => { const a = el('a', 'msg-l', l.label); a.href = l.url; if (/^https/.test(l.url)) { a.target = '_blank'; a.rel = 'noopener noreferrer'; } m.append(a); });
    log.append(m); log.scrollTop = log.scrollHeight;
  };
  const sugg = (l) => sg.replaceChildren(...l.slice(0, 3).map((s) => { const b = el('button', 'chip', s); b.type = 'button'; b.onclick = () => ask(s); return b; }));
  async function ask(text) {
    text = text.trim(); if (!text) return; add('me', text); inp.value = ''; sugg([]); send.disabled = true;
    try {
      const r = await fetch('/.netlify/functions/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: text }) });
      const d = await r.json(); if (!r.ok) throw new Error(d.error);
      add('bot', d.reply, d.links || []); sugg(d.suggestions || []);
    } catch (e) { add('bot', e.message && e.message.length < 90 ? e.message : 'Não consegui responder agora. Tente novamente ou fale com a loja pelo WhatsApp.', [{ label: 'Falar no WhatsApp', url: 'https://wa.me/5511971752204' }]); }
    finally { send.disabled = false; inp.focus(); }
  }
  const toggle = (o) => { p.hidden = !o; btn.setAttribute('aria-expanded', String(o)); if (o) { if (!log.children.length) { add('bot', 'Olá! Posso ajudar com produtos, categorias, disponibilidade e contato.'); sugg(['Quais categorias vocês têm?', 'Falar com a loja']); } inp.focus(); } else btn.focus(); };
  btn.onclick = () => toggle(p.hidden); x.onclick = () => toggle(false);
  p.addEventListener('keydown', (e) => { if (e.key === 'Escape') toggle(false); });
  f.addEventListener('submit', (e) => { e.preventDefault(); ask(inp.value); });
})();
