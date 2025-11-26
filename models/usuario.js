const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const usuarioSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  senha: { type: String, required: true },
  foto: { type: String },                          
  resetToken: { type: String },
  resetTokenExpiracao: { type: Date }
}, { timestamps: true });


//Sempre criptografa a senha ao modificar
usuarioSchema.pre('save', async function(next) {
  try {
    if (this.isModified('email')) {
      this.email = this.email.toLowerCase();
    }

    if (this.isModified('senha')) {
      const salt = await bcrypt.genSalt(10);
      this.senha = await bcrypt.hash(this.senha, salt);
    }

    next();
  } catch (err) {
    next(err);
  }
});


// Remove a senha do JSON retornado
usuarioSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.senha;
  return obj;
};


// 📌 Método helper para criar usuário com tratamento de duplicidade
usuarioSchema.statics.criarUsuario = async function(dados) {
  try {
    const usuario = new this(dados);
    await usuario.save();
    return { sucesso: true, usuario };
  } catch (err) {
    if (err.code === 11000) {
      return { sucesso: false, erro: 'Email já cadastrado.' };
    }
    throw err;
  }
};

module.exports = mongoose.model('Usuario', usuarioSchema);
