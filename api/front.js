// GET /front.html (via rewrite em vercel.json)
// Entrega o painel só com sessão válida. Sem sessão, volta ao login.
const fs = require('fs');
const path = require('path');
const sessao = require('../auth/sessao');
const { buscarAtivoPorId } = require('../auth/credenciais');

module.exports = async (req, res) => {
  try {
    const s = sessao.ler(req);
    const usuario = s ? await buscarAtivoPorId(s.id) : null;
    if (!usuario) {
      if (s) sessao.encerrar(res);
      res.statusCode = 302;
      res.setHeader('Location', '/');
      return res.end();
    }
    const html = fs.readFileSync(path.join(process.cwd(), 'private', 'front.html'), 'utf8');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'private, no-store');
    return res.status(200).send(html);
  } catch (e) {
    console.error('front:', e);
    res.statusCode = 500;
    return res.end('Erro no servidor.');
  }
};
