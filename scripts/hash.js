// Uso: npm run hash -- "SenhaAqui"   -> imprime o hash bcrypt
const bcrypt = require('bcryptjs');
const senha = process.argv[2];
if (!senha) {
  console.error('Informe a senha: npm run hash -- "SenhaAqui"');
  process.exit(1);
}
console.log(bcrypt.hashSync(senha, 10));
