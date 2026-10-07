require('dotenv').config();
const bcrypt = require('bcrypt');
const conectar = require('./db');
const User = require('./models/User');
const Trainer = require('./models/Trainer');

(async () => {
  await conectar();

  const user = await User.create({
    email: 'teste@email.com',
    passwordHash: await bcrypt.hash('123456', 10),
    role: 'personal',
  });

  const trainer = await Trainer.create({ userId: user._id, name: 'Personal Teste' });

  user.profileId = trainer._id;
  await user.save();

  console.log('Criado com sucesso!');
  process.exit(0);
})();