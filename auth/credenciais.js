// Validação de CPF e senha. Não conhece cookies nem rotas.
const bcrypt = require('bcryptjs');
const { supabase } = require('./config');

// Hash falso: mantém o tempo de resposta igual quando o CPF não existe.
const HASH_FALSO = bcrypt.hashSync('sipro', 10);

function normalizarCpf(valor) {
  return String(valor || '').replace(/\D/g, '');
}

function validarCpf(cpf) {
  if (!/^\d{11}$/.test(cpf)) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  for (let t = 9; t < 11; t++) {
    let soma = 0;
    for (let i = 0; i < t; i++) soma += Number(cpf[i]) * (t + 1 - i);
    const digito = ((soma * 10) % 11) % 10;
    if (digito !== Number(cpf[t])) return false;
  }
  return true;
}

const COLUNAS = 'id, cpf, nome, perfil, ativo';

// Retorna { usuario } ou { status, erro }
async function autenticar(cpfBruto, senha) {
  const cpf = normalizarCpf(cpfBruto);
  if (!validarCpf(cpf)) return { status: 400, erro: 'CPF inválido.' };
  if (!senha) return { status: 400, erro: 'Informe a senha.' };

  const { data, error } = await supabase()
    .from('usuarios')
    .select(COLUNAS + ', senha_hash')
    .eq('cpf', cpf)
    .maybeSingle();
  if (error) throw error;

  const senhaOk = await bcrypt.compare(String(senha), data ? data.senha_hash : HASH_FALSO);
  if (!data || !senhaOk) return { status: 401, erro: 'CPF ou senha incorretos.' };
  if (!data.ativo) return { status: 403, erro: 'Conta inativa. Procure o administrador.' };

  const { id, nome, perfil } = data;
  return { usuario: { id, cpf: data.cpf, nome, perfil } };
}

// Usado para confirmar que a conta continua ativa.
async function buscarAtivoPorId(id) {
  const { data, error } = await supabase()
    .from('usuarios')
    .select(COLUNAS)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!data || !data.ativo) return null;
  return { id: data.id, cpf: data.cpf, nome: data.nome, perfil: data.perfil };
}

module.exports = { normalizarCpf, validarCpf, autenticar, buscarAtivoPorId };
