const jwt = require('jsonwebtoken');

function gerarToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
}

module.exports = { gerarToken };
