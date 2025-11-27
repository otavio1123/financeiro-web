// models/LogSeguranca.js
const mongoose = require('mongoose');

const logSegurancaSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', default: null },
    acao: { type: String, required: true },      // Ex: "LOGIN_SUCESSO", "LOGIN_FALHA"
    ip: { type: String, default: null },
    detalhes: { type: String, default: '' }
  },
  {
    timestamps: true // cria createdAt e updatedAt
  }
);

const LogSeguranca = mongoose.model('LogSeguranca', logSegurancaSchema);

async function registrarLog({ userId = null, acao, ip = null, detalhes = '' }) {
  try {
    await LogSeguranca.create({
      userId,
      acao,
      ip,
      detalhes
    });
  } catch (err) {
    console.error('Erro ao registrar log de segurança:', err);
  }
}

// Exporta o model e a função utilitária
module.exports = {
  LogSeguranca,
  registrarLog
};
