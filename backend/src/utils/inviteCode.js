const crypto = require('crypto');

// Sem caracteres que se confundem (0/O, 1/I)
const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function gerarCodigo() {
  let sufixo = '';
  for (let i = 0; i < 6; i++) {
    sufixo += ALFABETO[crypto.randomInt(ALFABETO.length)];
  }
  return `NORTE-${sufixo}`;
}

module.exports = { gerarCodigo };
