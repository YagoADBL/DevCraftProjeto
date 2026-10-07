const { HttpError } = require('../utils/errors');

// Deve ser registrado DEPOIS de todas as rotas
function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ erro: err.message });
  }
  if (err.code === 11000) {
    return res.status(409).json({ erro: 'Registro duplicado.' });
  }
  if (err.name === 'ValidationError' || err.name === 'CastError') {
    return res.status(400).json({ erro: 'Dados inválidos.', detalhe: err.message });
  }
  console.error(err);
  res.status(500).json({ erro: 'Erro interno do servidor.' });
}

module.exports = errorHandler;
