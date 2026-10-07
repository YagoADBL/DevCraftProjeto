require('dotenv').config();
const express = require('express');
const cors = require('cors');
const conectar = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.json({ ok: true, app: 'Guia Norte API' }));

const PORT = process.env.PORT || 3000;

conectar().then(() => {
  app.listen(PORT, () => console.log(`🚀 Servidor em http://localhost:${PORT}`));
});
