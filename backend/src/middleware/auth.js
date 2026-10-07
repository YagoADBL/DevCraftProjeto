const jwt = require('jsonwebtoken');
const { HttpError } = require('../utils/errors');

// Lê o token do header "Authorization: Bearer <token>" e coloca os dados em req.auth
function autenticar(req, res, next) {
  const [tipo, token] = (req.headers.authorization || '').split(' ');
  if (tipo !== 'Bearer' || !token) {
    return next(new HttpError(401, 'Token não informado.'));
  }
  try {
    req.auth = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    next(new HttpError(401, 'Token inválido ou expirado.'));
  }
}

// Restringe a rota a certos perfis: exigirRole('personal')
function exigirRole(...roles) {
  return (req, res, next) =>
    roles.includes(req.auth.role)
      ? next()
      : next(new HttpError(403, 'Acesso negado para este perfil.'));
}

module.exports = { autenticar, exigirRole };
