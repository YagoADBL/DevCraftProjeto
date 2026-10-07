const router = require('express').Router();
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

const User = require('../models/User');
const Trainer = require('../models/Trainer');
const Student = require('../models/Student');
const InviteKey = require('../models/InviteKey');

const asyncHandler = require('../utils/asyncHandler');
const { HttpError } = require('../utils/errors');
const { gerarToken } = require('../utils/token');
const { autenticar } = require('../middleware/auth');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validarCadastro({ email, password, name }) {
  if (typeof name !== 'string' || !name.trim()) throw new HttpError(400, 'Nome é obrigatório.');
  if (typeof email !== 'string' || !EMAIL_RE.test(email.trim())) throw new HttpError(400, 'E-mail inválido.');
  if (typeof password !== 'string' || password.length < 8) {
    throw new HttpError(400, 'A senha deve ter pelo menos 8 caracteres.');
  }
}

// ---------------------------------------------------------------
// POST /auth/register-personal
// ---------------------------------------------------------------
router.post('/register-personal', asyncHandler(async (req, res) => {
  validarCadastro(req.body);
  const { password, name, phone, cref } = req.body;
  const email = req.body.email.trim().toLowerCase();

  const session = await mongoose.startSession();
  let user, trainer;
  try {
    await session.withTransaction(async () => {
      if (await User.exists({ email }).session(session)) {
        throw new HttpError(409, 'E-mail já cadastrado.');
      }
      const passwordHash = await bcrypt.hash(password, 10);

      [user] = await User.create([{ email, passwordHash, role: 'personal' }], { session });
      [trainer] = await Trainer.create(
        [{ userId: user._id, name: name.trim(), phone, cref }],
        { session }
      );

      user.profileId = trainer._id;
      await user.save({ session });
    });
  } finally {
    await session.endSession();
  }

  const token = gerarToken({
    sub: user.id,
    role: 'personal',
    profileId: trainer.id,
    trainerId: trainer.id,
  });

  res.status(201).json({
    token,
    user: { id: user.id, email: user.email, role: user.role },
    profile: { id: trainer.id, name: trainer.name },
  });
}));

// ---------------------------------------------------------------
// POST /auth/register-student  (exige a chave criada pelo personal)
// ---------------------------------------------------------------
router.post('/register-student', asyncHandler(async (req, res) => {
  validarCadastro(req.body);
  const { password, name, phone, inviteCode } = req.body;
  if (typeof inviteCode !== 'string' || !inviteCode.trim()) {
    throw new HttpError(400, 'A chave de convite é obrigatória.');
  }
  const email = req.body.email.trim().toLowerCase();
  const code = inviteCode.trim().toUpperCase();

  const session = await mongoose.startSession();
  let user, student;
  try {
    await session.withTransaction(async () => {
      if (await User.exists({ email }).session(session)) {
        throw new HttpError(409, 'E-mail já cadastrado.');
      }

      // Consome 1 uso da chave de forma atômica: só funciona se ela ainda for válida.
      const agora = new Date();
      const chave = await InviteKey.findOneAndUpdate(
        {
          code,
          status: 'active',
          $or: [{ expiresAt: null }, { expiresAt: { $gt: agora } }],
          $expr: { $lt: ['$usedCount', '$maxUses'] },
        },
        { $inc: { usedCount: 1 } },
        { new: true, session }
      );
      if (!chave) {
        throw new HttpError(400, 'Chave de convite inválida, expirada ou já utilizada.');
      }

      const passwordHash = await bcrypt.hash(password, 10);
      [user] = await User.create([{ email, passwordHash, role: 'aluno' }], { session });
      [student] = await Student.create(
        [{
          userId: user._id,
          trainerId: chave.trainerId,   // o vínculo com o personal vem da chave
          name: name.trim(),
          phone,
          inviteKeyId: chave._id,
        }],
        { session }
      );

      user.profileId = student._id;
      await user.save({ session });

      chave.usedBy.push(student._id);
      if (chave.usedCount >= chave.maxUses) chave.status = 'used';
      await chave.save({ session });
    });
  } finally {
    await session.endSession();
  }

  const token = gerarToken({
    sub: user.id,
    role: 'aluno',
    profileId: student.id,
    trainerId: student.trainerId.toString(),
  });

  res.status(201).json({
    token,
    user: { id: user.id, email: user.email, role: user.role },
    profile: { id: student.id, name: student.name, trainerId: student.trainerId },
  });
}));

// ---------------------------------------------------------------
// POST /auth/login  (serve para personal e aluno)
// ---------------------------------------------------------------
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (typeof email !== 'string' || typeof password !== 'string') {
    throw new HttpError(400, 'Informe e-mail e senha.');
  }

  const user = await User.findOne({ email: email.trim().toLowerCase() });
  const senhaOk = user && (await bcrypt.compare(password, user.passwordHash));
  if (!senhaOk) throw new HttpError(401, 'E-mail ou senha incorretos.');
  if (!user.isActive) throw new HttpError(403, 'Conta desativada.');

  const Perfil = user.role === 'personal' ? Trainer : Student;
  const profile = await Perfil.findById(user.profileId);
  if (!profile) throw new HttpError(500, 'Perfil do usuário não encontrado.');

  const trainerId = user.role === 'personal' ? profile.id : profile.trainerId.toString();

  user.lastLoginAt = new Date();
  await user.save();

  const token = gerarToken({
    sub: user.id,
    role: user.role,
    profileId: profile.id,
    trainerId,
  });

  res.json({
    token,
    user: { id: user.id, email: user.email, role: user.role },
    profile,
  });
}));

// ---------------------------------------------------------------
// GET /auth/me  (dados de quem está logado)
// ---------------------------------------------------------------
router.get('/me', autenticar, asyncHandler(async (req, res) => {
  const user = await User.findById(req.auth.sub).select('-passwordHash');
  if (!user) throw new HttpError(404, 'Usuário não encontrado.');

  const Perfil = user.role === 'personal' ? Trainer : Student;
  const profile = await Perfil.findById(user.profileId);

  res.json({ user, profile });
}));

module.exports = router;
