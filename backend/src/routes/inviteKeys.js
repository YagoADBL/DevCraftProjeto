const router = require('express').Router();
const mongoose = require('mongoose');

const InviteKey = require('../models/InviteKey');
const asyncHandler = require('../utils/asyncHandler');
const { HttpError } = require('../utils/errors');
const { gerarCodigo } = require('../utils/inviteCode');
const { autenticar, exigirRole } = require('../middleware/auth');

// Todas as rotas daqui são só para personal logado
router.use(autenticar, exigirRole('personal'));

// POST /invite-keys  -> cria uma chave
// body: { type?: "single_use" | "multi_use", maxUses?, expiresInDays?, note? }
router.post('/', asyncHandler(async (req, res) => {
  const { type = 'single_use', maxUses, expiresInDays = 7, note } = req.body;

  if (!['single_use', 'multi_use'].includes(type)) {
    throw new HttpError(400, 'type deve ser "single_use" ou "multi_use".');
  }
  const usos = type === 'single_use' ? 1 : Number(maxUses);
  if (!Number.isInteger(usos) || usos < 1 || usos > 500) {
    throw new HttpError(400, 'maxUses deve ser um inteiro entre 1 e 500.');
  }
  const dias = Number(expiresInDays);
  if (!(dias > 0 && dias <= 365)) {
    throw new HttpError(400, 'expiresInDays deve estar entre 1 e 365.');
  }

  const expiresAt = new Date(Date.now() + dias * 24 * 60 * 60 * 1000);

  // Tenta de novo no caso (raríssimo) de o código gerado já existir
  let chave;
  for (let i = 0; i < 5 && !chave; i++) {
    try {
      chave = await InviteKey.create({
        trainerId: req.auth.trainerId,
        code: gerarCodigo(),
        type,
        maxUses: usos,
        expiresAt,
        note: typeof note === 'string' ? note.slice(0, 100) : undefined,
      });
    } catch (err) {
      if (err.code !== 11000) throw err;
    }
  }
  if (!chave) throw new HttpError(500, 'Não foi possível gerar a chave. Tente novamente.');

  res.status(201).json(chave);
}));

// GET /invite-keys  -> lista as chaves do personal logado
router.get('/', asyncHandler(async (req, res) => {
  const chaves = await InviteKey.find({ trainerId: req.auth.trainerId }).sort({ createdAt: -1 });
  res.json(chaves);
}));

// PATCH /invite-keys/:id/revoke  -> cancela uma chave ativa
router.patch('/:id/revoke', asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new HttpError(400, 'ID inválido.');

  const chave = await InviteKey.findOneAndUpdate(
    { _id: req.params.id, trainerId: req.auth.trainerId, status: 'active' },
    { status: 'revoked' },
    { new: true }
  );
  if (!chave) throw new HttpError(404, 'Chave não encontrada ou não está ativa.');

  res.json(chave);
}));

module.exports = router;
