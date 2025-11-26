const mongoose = require('mongoose');

const contaSchema = new mongoose.Schema({
  tipo: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 50
  },
  descricao: {
    type: String,
    default: '',
    maxlength: 100 // limite opcional, mas seguro
  },
  valor: {
    type: Number,
    required: true,
    min: 0 // garante que não haja valores negativos por engano
  },
  data: {
    type: Date,
    default: Date.now,
    required: true
  },
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  }
}, { timestamps: true }); // útil para auditoria

// Remover informações sensíveis antes de enviar como JSON (opcional)
contaSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.__v; // opcional, remove versão do documento
  return obj;
};

module.exports = mongoose.model('Conta', contaSchema);
