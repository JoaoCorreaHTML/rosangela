const { out, rest, wrap, HttpError, env } = require('./_lib');
exports.handler = wrap(async (e, b) => {
  const refresh = typeof b.refresh_token === 'string' && b.refresh_token;
  const grant = refresh ? 'refresh_token' : 'password';
  if (!refresh && (typeof b.email !== 'string' || typeof b.password !== 'string' || b.email.length > 254 || b.password.length > 200)) throw new HttpError(400, 'Informe e-mail e senha');
  const r = await fetch(`${env.URL_}/auth/v1/token?grant_type=${grant}`, { method: 'POST', headers: { apikey: env.ANON, 'Content-Type': 'application/json' }, body: JSON.stringify(refresh ? { refresh_token: b.refresh_token } : { email: b.email, password: b.password }) });
  if (!r.ok) throw new HttpError(401, refresh ? 'Sessão expirada. Entre novamente' : 'E-mail ou senha incorretos');
  const s = await r.json();
  const ok = await rest(`admins?user_id=eq.${encodeURIComponent(s.user.id)}&select=user_id`);
  if (!ok.length) throw new HttpError(403, 'Esta conta não tem acesso administrativo');
  return out(200, { access_token: s.access_token, refresh_token: s.refresh_token, expires_in: s.expires_in });
}, { admin: false, methods: ['POST'] });
