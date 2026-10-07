// Express 4 não captura erros de funções async sozinho; este wrapper resolve isso.
module.exports = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
