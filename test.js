// test.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config(); // Carrega variáveis do .env

const mongoURI = process.env.MONGO_URI;

console.log(`Tentando conectar a: ${mongoURI}`);

async function conectarMongo() {
  try {
    await mongoose.connect(mongoURI, {
      // Opções modernas não são mais necessárias, Mongoose já cuida
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
    });
    console.log(' Conexão com MongoDB realizada com sucesso!');
  } catch (err) {
    console.error(' Erro ao conectar MongoDB:', err);
  } finally {
    mongoose.connection.close(); // Fecha a conexão após o teste
  }
}

conectarMongo();
