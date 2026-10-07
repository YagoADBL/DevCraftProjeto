require('dotenv').config();
const express = require('express');
const cors = require('cors');
const conectar = require('./db');
const errorHandler = require('./middleware/errorHandler');

if (!process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET não definido no .env');
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.json({ ok: true, app: 'Guia Norte API' }));

app.use('/auth', require('./routes/auth'));
app.use('/invite-keys', require('./routes/inviteKeys'));
app.use('/students', require('./routes/students'));

app.use(errorHandler); // sempre por último

const PORT = process.env.PORT || 3000;

conectar().then(() => {
  app.listen(PORT, () => console.log(`🚀 Servidor em http://localhost:${PORT}`));
});
