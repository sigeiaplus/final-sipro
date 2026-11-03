// Configuração do banco. Só o servidor usa a chave secreta.
const { createClient } = require('@supabase/supabase-js');

let cliente;

function supabase() {
  if (!cliente) {
    cliente = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );
  }
  return cliente;
}

module.exports = { supabase };
