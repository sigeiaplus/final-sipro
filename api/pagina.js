// GET /api/pagina?p=nome  -> entrega o conteúdo de private/paginas/nome.html
// Só com sessão válida e perfil permitido.
const fs = require('fs');
const path = require('path');
const sessao = require('../auth/sessao');
const { buscarAtivoPorId } = require('../auth/credenciais');

// Páginas liberadas e quem pode abrir cada uma.
const PAGINAS = {
  'dados-da-rede': ['super_admin', 'admin'],
};

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ erro: 'Método não permitido.' });
  try {
    const s = sessao.ler(req);
    const usuario = s ? await buscarAtivoPorId(s.id) : null;
    if (!usuario) {
      if (s) sessao.encerrar(res);
      return res.status(401).json({ erro: 'Não autenticado.' });
    }

    const nome = String((req.query && req.query.p) || '');
    if (!/^[a-z0-9-]+$/.test(nome) || !Object.prototype.hasOwnProperty.call(PAGINAS, nome)) {
      return res.status(404).json({ erro: 'Página não encontrada.' });
    }
    if (!PAGINAS[nome].includes(usuario.perfil)) {
      return res.status(403).json({ erro: 'Sem permissão.' });
    }

    const html = fs.readFileSync(path.join(process.cwd(), 'private', 'paginas', nome + '.html'), 'utf8');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'private, no-store');
    return res.status(200).send(html);
  } catch (e) {
    console.error('pagina:', e);
    return res.status(500).json({ erro: 'Erro no servidor.' });
  }
};
