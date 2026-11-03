// POST /api/logout
const sessao = require('../auth/sessao');

module.exports = (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido.' });
  sessao.encerrar(res);
  return res.status(200).json({ ok: true });
};
