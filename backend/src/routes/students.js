const router = require('express').Router();

const Student = require('../models/Student');
const asyncHandler = require('../utils/asyncHandler');
const { autenticar, exigirRole } = require('../middleware/auth');

router.use(autenticar, exigirRole('personal'));

// GET /students -> alunos do personal logado (nunca de outro personal)
router.get('/', asyncHandler(async (req, res) => {
  const alunos = await Student.find({ trainerId: req.auth.trainerId })
    .sort({ name: 1 })
    .populate('userId', 'email isActive lastLoginAt');
  res.json(alunos);
}));

module.exports = router;
