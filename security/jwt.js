// security/jwt.js
const jwt = require('jsonwebtoken');
const RefreshToken = require('../models/RefreshToken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh';

// 🔹 Gera o MESMO tipo de token que você já usa hoje
function gerarAccessToken(usuario) {
  return jwt.sign(
    { id: usuario._id, email: usuario.email },
    JWT_SECRET,
    { expiresIn: '7d' } // mantém 7 dias para não mudar comportamento
  );
}

// 🔹 Gera e salva um Refresh Token na coleção RefreshToken
async function gerarRefreshToken(usuario) {
  const token = jwt.sign(
    { id: usuario._id, email: usuario.email },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await RefreshToken.create({
    userId: usuario._id,
    token,
    expiresAt,
    valid: true
  });

  return token;
}

// 🔹 Marca um refresh token como inválido (logout / rotação)
async function invalidarRefreshToken(token) {
  await RefreshToken.updateOne(
    { token },
    { $set: { valid: false } }
  );
}

module.exports = {
  JWT_REFRESH_SECRET,
  gerarAccessToken,
  gerarRefreshToken,
  invalidarRefreshToken
};
