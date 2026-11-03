// Sessão por cookie assinado (HMAC). Sem dependências extras.
const crypto = require('crypto');

const NOME = 'sipro_sessao';
const DURACAO = 8 * 60 * 60; // 8 horas, em segundos

function segredo() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error('SESSION_SECRET ausente ou curto (mínimo 32).');
  return s;
}

function assinar(texto) {
  return crypto.createHmac('sha256', segredo()).update(texto).digest('base64url');
}

function criarToken(usuario) {
  const payload = {
    id: usuario.id,
    perfil: usuario.perfil,
    exp: Math.floor(Date.now() / 1000) + DURACAO,
  };
  const corpo = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return corpo + '.' + assinar(corpo);
}

function lerToken(token) {
  if (!token) return null;
  const [corpo, assinatura] = token.split('.');
  if (!corpo || !assinatura) return null;
  const a = Buffer.from(assinatura);
  const b = Buffer.from(assinar(corpo));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(corpo, 'base64url').toString());
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

function cookie(valor, maxAge) {
  return `${NOME}=${valor}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
}

function iniciar(res, usuario) {
  res.setHeader('Set-Cookie', cookie(criarToken(usuario), DURACAO));
}

function encerrar(res) {
  res.setHeader('Set-Cookie', cookie('', 0));
}

function ler(req) {
  const item = (req.headers.cookie || '')
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(NOME + '='));
  return item ? lerToken(item.slice(NOME.length + 1)) : null;
}

module.exports = { criarToken, lerToken, iniciar, encerrar, ler };
