/* ===================== CONFIGURAÇÃO ===================== */
require('dotenv').config({ path: './.env' });
console.log('MONGO_URI:', process.env.MONGO_URI);

const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

// Logs de segurança (AGORA CORRETO)
const { registrarLog } = require('./models/LogSeguranca');

// MODELS
const Conta = require('./models/Conta');
const Usuario = require('./models/usuario');
const RefreshToken = require('./models/RefreshToken');

// MÓDULO JWT SEGURO
const {
  JWT_REFRESH_SECRET,
  gerarAccessToken,
  gerarRefreshToken,
  invalidarRefreshToken
} = require('./security/jwt');

const app = express();

/* ===================== UPLOAD DE FOTOS ===================== */
const storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, 'public/uploads/usuarios/');
  },
  filename: function (req, file, callback) {
    const ext = path.extname(file.originalname);
    const nomeArquivo = `${req.usuario.id}_${Date.now()}${ext}`;
    callback(null, nomeArquivo);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, callback) {
    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!tiposPermitidos.includes(file.mimetype)) {
      return callback(new Error('Formato inválido! Somente JPG, PNG e WEBP.'), false);
    }
    callback(null, true);
  }
});

/* ===================== SEGURANÇA ===================== */
app.use(express.json());
app.use(helmet());

/* ===================== STATIC FILES ===================== */
app.use(express.static('interface'));
app.use('/public', express.static('public'));

app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:5500', 'http://localhost:5500'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

/* ===================== RATE LIMIT ===================== */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  message: { sucesso: false, mensagem: 'Muitas requisições — tente novamente mais tarde.' }
});
app.use(globalLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  message: { sucesso: false, mensagem: 'Muitas tentativas — tente novamente.' }
});

/* ===================== CONEXÃO MONGODB ===================== */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log(' MongoDB conectado!'))
  .catch(err => console.error(' Erro ao conectar MongoDB:', err));


/* ===================== MIDDLEWARE - AUTENTICAR JWT ===================== */
function autenticarToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token)
    return res.status(401).json({ sucesso: false, mensagem: 'Token não fornecido.' });

  jwt.verify(token, process.env.JWT_SECRET, (err, usuario) => {
    if (err)
      return res.status(403).json({ sucesso: false, mensagem: 'Token inválido ou expirado.' });

    req.usuario = usuario;
    next();
  });
}

/* ===================== JOI SCHEMAS ===================== */
const contaSchema = Joi.object({
  tipo: Joi.string().min(3).max(50).required(),
  descricao: Joi.string().allow('').max(100),
  valor: Joi.number().positive().required(),
  data: Joi.date().required()
});

const usuarioSchema = Joi.object({
  nome: Joi.string().min(3).max(100).required(),
  email: Joi.string().email().required(),
  senha: Joi.string().min(6).required()
});

const novaSenhaSchema = Joi.object({
  novaSenha: Joi.string().min(6).required()
});

/* ===================== NODEMAILER ===================== */
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

/* ==============================================================  
                     ROTAS DE CONTAS
============================================================== */

/* CRIAR GASTO */
app.post('/contas', autenticarToken, async (req, res) => {
  const { error } = contaSchema.validate(req.body);
  if (error) return res.status(400).json({ sucesso: false, mensagem: error.details[0].message });

  try {
    const novaConta = new Conta({ ...req.body, usuario: req.usuario.id });
    const contaSalva = await novaConta.save();
    res.status(201).json({ sucesso: true, dados: contaSalva });
  } catch (err) {
    res.status(500).json({ sucesso: false, mensagem: 'Erro ao salvar conta.' });
  }
});

/* LISTAR GASTOS */
app.get('/contas', autenticarToken, async (req, res) => {
  try {
    const { mes, ano } = req.query;

    const inicio = new Date(ano, mes - 1, 1);
    const fim = new Date(ano, mes, 0, 23, 59, 59);

    const contas = await Conta.find({
      usuario: req.usuario.id,
      data: { $gte: inicio, $lte: fim }
    }).sort({ data: 1 });

    res.json({ sucesso: true, dados: contas });

  } catch (err) {
    res.status(500).json({ sucesso: false, mensagem: 'Erro ao buscar contas.' });
  }
});

/* REMOVER GASTO */
app.delete('/contas/:id', autenticarToken, async (req, res) => {
  try {
    const resultado = await Conta.deleteOne({
      _id: req.params.id,
      usuario: req.usuario.id
    });

    if (resultado.deletedCount === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Gasto não encontrado ou não pertence ao usuário.'
      });
    }

    res.json({ sucesso: true, mensagem: 'Gasto removido.' });
  } catch (err) {
    res.status(500).json({ sucesso: false, mensagem: 'Erro ao excluir gasto.' });
  }
});

/* ==============================================================  
                     ROTAS DE USUÁRIOS
============================================================== */

/* CADASTRAR */
app.post('/usuarios/cadastrar', async (req, res) => {
  const { error } = usuarioSchema.validate(req.body);
  if (error)
    return res.status(400).json({ sucesso: false, mensagem: error.details[0].message });

  try {
    const resultado = await Usuario.criarUsuario(req.body);
    if (!resultado.sucesso)
      return res.status(400).json({ sucesso: false, mensagem: resultado.erro });

    res.status(201).json({ sucesso: true, mensagem: 'Usuário cadastrado.', dados: resultado.usuario });
  } catch (err) {
    res.status(500).json({ sucesso: false, mensagem: 'Erro ao cadastrar usuário.' });
  }
});

/* LOGIN (com refresh + logs) */
app.post('/usuarios/login', authLimiter, async (req, res) => {
  try {
    const { email, senha } = req.body;

    const usuario = await Usuario.findOne({ email: email.toLowerCase() });

    if (!usuario) {
      registrarLog({ acao: 'LOGIN_FALHA_EMAIL', detalhes: `Email: ${email}`, ip: req.ip });
      return res.status(400).json({ sucesso: false, mensagem: 'Usuário não encontrado' });
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      registrarLog({ acao: 'LOGIN_FALHA_SENHA', userId: usuario._id, ip: req.ip });
      return res.status(401).json({ sucesso: false, mensagem: 'Senha incorreta' });
    }

    registrarLog({ acao: 'LOGIN_SUCESSO', userId: usuario._id, ip: req.ip });

    const token = gerarAccessToken(usuario);
    const refreshToken = await gerarRefreshToken(usuario);

    res.json({
      sucesso: true,
      mensagem: 'Login OK',
      dados: { token, refreshToken }
    });

  } catch (err) {
    registrarLog({ acao: 'LOGIN_ERRO_INTERNO', detalhes: err.message, ip: req.ip });
    res.status(500).json({ sucesso: false, mensagem: 'Erro no login' });
  }
});

/* REFRESH TOKEN */
app.post('/usuarios/refresh', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken)
    return res.status(400).json({ sucesso: false, mensagem: 'Refresh token obrigatório.' });

  try {
    const tokenDoc = await RefreshToken.findOne({ token: refreshToken, valid: true });
    if (!tokenDoc)
      return res.status(401).json({ sucesso: false, mensagem: 'Token inválido ou revogado.' });

    let payload;
    try {
      payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    } catch (err) {
      return res.status(401).json({ sucesso: false, mensagem: 'Refresh token expirado.' });
    }

    await invalidarRefreshToken(refreshToken);

    const usuarioPayload = { _id: payload.id, email: payload.email };
    const novoToken = gerarAccessToken(usuarioPayload);
    const novoRefresh = await gerarRefreshToken(usuarioPayload);

    res.json({
      sucesso: true,
      mensagem: 'Token renovado.',
      dados: { token: novoToken, refreshToken: novoRefresh }
    });

  } catch (err) {
    res.status(500).json({ sucesso: false, mensagem: 'Erro ao renovar token.' });
  }
});

/* LOGOUT */
app.post('/usuarios/logout', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken)
    return res.status(400).json({ sucesso: false, mensagem: 'Refresh token obrigatório.' });

  try {
    await invalidarRefreshToken(refreshToken);
    res.json({ sucesso: true, mensagem: 'Logout realizado.' });
  } catch (err) {
    res.status(500).json({ sucesso: false, mensagem: 'Erro no logout.' });
  }
});

/* BUSCAR PERFIL */
app.get('/usuarios/:id', autenticarToken, async (req, res) => {
  if (req.usuario.id !== req.params.id)
    return res.status(403).json({ sucesso: false, mensagem: 'Acesso negado.' });

  const usuario = await Usuario.findById(req.params.id).select('-senha');
  res.json(usuario);
});

/* VERIFICAR SENHA ATUAL */
app.post('/usuarios/:id/verificar-senha', autenticarToken, async (req, res) => {
  if (req.usuario.id !== req.params.id)
    return res.status(403).json({ sucesso: false, mensagem: 'Acesso negado.' });

  const usuario = await Usuario.findById(req.params.id);
  const confere = await bcrypt.compare(req.body.senhaAtual, usuario.senha);

  if (!confere)
    return res.status(401).json({ sucesso: false, mensagem: 'Senha incorreta.' });

  res.json({ sucesso: true, mensagem: 'Senha correta.' });
});

/* ATUALIZAR PERFIL */
app.put('/usuarios/:id', autenticarToken, async (req, res) => {
  if (req.usuario.id !== req.params.id)
    return res.status(403).json({ sucesso: false, mensagem: 'Acesso negado.' });

  const update = {};
  if (req.body.nome) update.nome = req.body.nome;
  if (req.body.senha) update.senha = await bcrypt.hash(req.body.senha, 10);

  const usuario = await Usuario.findByIdAndUpdate(req.params.id, update, { new: true });
  res.json({ sucesso: true, mensagem: 'Perfil atualizado.', dados: usuario });
});

/* EXCLUIR CONTA */
app.delete('/usuarios/:id', autenticarToken, async (req, res) => {
  if (req.usuario.id !== req.params.id)
    return res.status(403).json({ sucesso: false, mensagem: 'Acesso negado.' });

  await Usuario.deleteOne({ _id: req.params.id });
  res.json({ sucesso: true, mensagem: 'Conta excluída.' });
});

/* UPLOAD FOTO */
app.post('/usuarios/:id/foto', autenticarToken, upload.single('foto'), async (req, res) => {
  if (req.usuario.id !== req.params.id)
    return res.status(403).json({ sucesso: false, mensagem: 'Acesso negado.' });

  if (!req.file)
    return res.status(400).json({ sucesso: false, mensagem: 'Nenhuma imagem enviada.' });

  const caminho = `/public/uploads/usuarios/${req.file.filename}`;

  const usuario = await Usuario.findByIdAndUpdate(req.params.id, { foto: caminho }, { new: true });

  res.json({ sucesso: true, foto: usuario.foto });
});

/* ESQUECI SENHA */
app.post('/usuarios/esqueci-senha', authLimiter, async (req, res) => {
  const email = req.body.email.toLowerCase();
  const usuario = await Usuario.findOne({ email });

  if (!usuario) {
    return res.json({
      sucesso: true,
      mensagem: 'Se o email existir, enviaremos uma mensagem.'
    });
  }

  const token = crypto.randomBytes(32).toString('hex');
  usuario.resetToken = token;
  usuario.resetTokenExpiracao = Date.now() + 3600000;
  await usuario.save();

  const link = `http://localhost:3000/redefinir-senha.html?token=${token}`;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: usuario.email,
    subject: 'Redefinição de senha',
    html: `<p>Redefina sua senha:</p><a href="${link}">${link}</a>`
  });

  res.json({
    sucesso: true,
    mensagem: 'Se o email existir, enviaremos uma mensagem.'
  });
});

/* REDEFINIR SENHA */
app.post('/usuarios/redefinir-senha', async (req, res) => {
  const { token, novaSenha } = req.body;

  const usuario = await Usuario.findOne({
    resetToken: token,
    resetTokenExpiracao: { $gt: Date.now() }
  });

  if (!usuario)
    return res.status(400).json({ sucesso: false, mensagem: 'Token inválido.' });

  usuario.senha = await bcrypt.hash(novaSenha, 10);
  usuario.resetToken = undefined;
  usuario.resetTokenExpiracao = undefined;
  await usuario.save();

  res.json({ sucesso: true, mensagem: 'Senha redefinida!' });
});

/* ROTA RAIZ */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'interface', 'telalogin.html'));
});

/* ERRO GLOBAL */
app.use((err, req, res, next) => {
  console.error('Erro interno:', err);
  res.status(500).json({ sucesso: false, mensagem: 'Erro interno no servidor.' });
});

/* INICIALIZAÇÃO */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
