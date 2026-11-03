// GET /api/me  -> dados do usuário logado
const { buscarAtivoPorId } = require('../auth/credenciais');
const sessao = require('../auth/sessao');

module.exports = async (req, res) => {
  try {
    const s = sessao.ler(req);
    if (!s) return res.status(401).json({ erro: 'Não autenticado.' });
    const usuario = await buscarAtivoPorId(s.id);
    if (!usuario) {
      sessao.encerrar(res);
      return res.status(401).json({ erro: 'Sessão inválida.' });
    }
    return res.status(200).json({ usuario });
  } catch (e) {
    console.error('me:', e);
    return res.status(500).json({ erro: 'Erro no servidor.' });
  }
};
