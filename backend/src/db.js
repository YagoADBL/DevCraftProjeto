const mongoose = require('mongoose');

async function conectar() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log(' MongoDB conectado');
  } catch (err) {
    console.error(' Erro ao conectar no MongoDB:', err.message);
    process.exit(1);
  }
}

module.exports = conectar;
