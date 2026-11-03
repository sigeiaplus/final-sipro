// POST /api/login  { cpf, senha }
const { autenticar } = require('../auth/credenciais');
const sessao = require('../auth/sessao');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido.' });
  try {
    const { cpf, senha } = req.body || {};
    const r = await autenticar(cpf, senha);
    if (r.erro) return res.status(r.status).json({ erro: r.erro });
    sessao.iniciar(res, r.usuario);
    return res.status(200).json({ usuario: r.usuario, redirecionar: '/front.html' });
  } catch (e) {
    console.error('login:', e);
    return res.status(500).json({ erro: 'Erro no servidor. Tente novamente.' });
  }
};
