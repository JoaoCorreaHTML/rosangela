const { SUPABASE_URL: URL_, SUPABASE_ANON_KEY: ANON, SUPABASE_SERVICE_ROLE_KEY: SVC } = process.env;
const H = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };
class HttpError extends Error { constructor(status, msg) { super(msg); this.status = status; } }
const out = (s, b) => ({ statusCode: s, headers: H, body: JSON.stringify(b) });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const uuid = (v) => { if (!UUID.test(String(v || ''))) throw new HttpError(400, 'Identificador inválido'); return v; };

let serviceRoleDiagnosticLogged = false;

function logSupabaseConfig(key) {
  if (serviceRoleDiagnosticLogged || key !== SVC) return;
  serviceRoleDiagnosticLogged = true;

  let keyRole = 'não identificado';
  let keyRef = null;
  try {
    const payloadPart = String(SVC).split('.')[1];
    if (!payloadPart) throw new Error('JWT sem payload');
    const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(Buffer.from(normalized, 'base64').toString('utf8'));
    keyRole = payload.role || 'ausente';
    keyRef = payload.ref || null;
  } catch {
    keyRole = 'chave sem payload JWT legível';
  }

  let host = 'URL inválida ou ausente';
  try { host = new URL(URL_).host; } catch {}

  // Registra somente metadados não secretos; nunca imprimir a chave ou o token.
  console.log('[SUPABASE CONFIG CHECK]', {
    host,
    keyRole,
    keyRef,
    serviceRoleKeyConfigured: Boolean(SVC)
  });
}

async function sb(path, opt = {}, key = SVC) {
  logSupabaseConfig(key);
  const resource = String(path).split('?')[0];
  let r;
  try {
    const isLegacyJwtKey = String(key || '').split('.').length === 3;
    const authHeaders = isLegacyJwtKey ? { Authorization: `Bearer ${key}` } : {};
    r = await fetch(URL_ + path, {
      ...opt,
      headers: {
        apikey: key,
        'Content-Type': 'application/json',
        ...authHeaders,
        ...(opt.headers || {})
      }
    });
  } catch (e) {
    console.error('[SUPABASE REST NETWORK ERROR]', {
      resource,
      error_name: e?.name || 'Error',
      error_message: e?.message || 'Falha de conexão'
    });
    throw new HttpError(502, 'Falha na operação');
  }
  const t = await r.text(); let d = null; try { d = t ? JSON.parse(t) : null; } catch { d = t; }
  if (!r.ok) {
    // Diagnóstico interno: nunca registrar tokens, chaves, senhas ou parâmetros da consulta.
    console.error('[SUPABASE REST ERROR]', {
      resource,
      status: r.status,
      code: d && typeof d === 'object' ? d.code : undefined,
      message: d && typeof d === 'object' ? d.message : undefined,
      details: d && typeof d === 'object' ? d.details : undefined,
      hint: d && typeof d === 'object' ? d.hint : undefined
    });
    throw new HttpError(r.status === 409 ? 409 : r.status === 400 ? 400 : 502, r.status === 409 ? 'Registro duplicado ou em uso' : 'Falha na operação');
  }
  return d;
}
const rest = (p, o) => sb('/rest/v1/' + p, o);

async function requireAdmin(event) {
  const token = (event.headers.authorization || event.headers.Authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) throw new HttpError(401, 'Faça login para continuar');
  let user;
  try {
    const r = await fetch(URL_ + '/auth/v1/user', { headers: { apikey: ANON, Authorization: 'Bearer ' + token } });
    if (!r.ok) throw 0; user = await r.json();
  } catch { throw new HttpError(401, 'Sessão expirada. Entre novamente'); }
  const rows = await rest(`admins?user_id=eq.${uuid(user.id)}&select=user_id`);
  if (!rows.length) throw new HttpError(403, 'Acesso restrito a administradores');
  return user;
}

const wrap = (fn, { admin = true, methods } = {}) => async (event) => {
  try {
    if (!URL_ || !ANON || !SVC) throw new HttpError(500, 'Servidor sem configuração do Supabase');
    if (methods && !methods.includes(event.httpMethod)) throw new HttpError(405, 'Método não permitido');
    if (admin) await requireAdmin(event);
    let body = {};
    if (event.body) { if (event.body.length > 6e6) throw new HttpError(413, 'Requisição muito grande'); try { body = JSON.parse(event.body); } catch { throw new HttpError(400, 'JSON inválido'); } }
    return await fn(event, body);
  } catch (e) {
    if (e instanceof HttpError) return out(e.status, { error: e.message });
    console.error('[FUNCTION UNEXPECTED ERROR]', { name: e?.name || 'Error', message: e?.message || 'Erro interno' });
    return out(500, { error: 'Erro interno' });
  }
};

const slugify = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'item';
const str = (v, max, label, req) => { const s = typeof v === 'string' ? v.trim() : ''; if (req && !s) throw new HttpError(400, `${label} é obrigatório`); if (s.length > max) throw new HttpError(400, `${label} excede ${max} caracteres`); return s || null; };

function cleanProduct(b) {
  const o = { name: str(b.name, 120, 'Nome', true), brand: str(b.brand, 60, 'Marca'), description: str(b.description, 2000, 'Descrição') };
  if (b.price === null || b.price === '' || b.price === undefined) o.price = null;
  else { const p = Number(b.price); if (!Number.isFinite(p) || p < 0 || p > 1e7) throw new HttpError(400, 'Preço inválido'); o.price = Math.round(p * 100) / 100; }
  if (!['disponivel', 'indisponivel'].includes(b.status)) throw new HttpError(400, 'Status inválido');
  o.status = b.status;
  o.category_id = b.category_id ? uuid(b.category_id) : null;
  if (!Array.isArray(b.badges) || b.badges.length > 3) throw new HttpError(400, 'Use até 3 selos');
  o.badges = b.badges.map((x) => str(x, 30, 'Selo', true));
  return o;
}
module.exports = { HttpError, out, uuid, sb, rest, wrap, slugify, str, cleanProduct, env: { URL_, ANON, SVC } };
