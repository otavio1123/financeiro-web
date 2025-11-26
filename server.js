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

const Conta = require('./models/Conta'); 
const Usuario = require('./models/usuario');

const app = express();

/* ===================== CONFIGURAÇÃO DO UPLOAD DE FOTOS ===================== */

const storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, 'public/uploads/usuarios/'); // pasta onde a foto será salva
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

/* ===================== SERVIR ARQUIVOS DO FRONTEND ===================== */
app.use(express.static('interface'));
app.use('/public', express.static('public'));


app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:5500',
    'http://localhost:5500'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));


/* ===================== RATE LIMITING ===================== */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { sucesso: false, mensagem: 'Muitas requisições — tente novamente mais tarde.' }
});
app.use(globalLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { sucesso: false, mensagem: 'Muitas tentativas — tente novamente mais tarde.' }
});

/* ===================== CONEXÃO COM MONGODB ===================== */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log(' MongoDB conectado!'))
  .catch(err => console.error(' Erro ao conectar MongoDB:', err));

const db = mongoose.connection;
db.on('error', err => console.error(' Erro na conexão MongoDB:', err));
db.once('open', () => console.log(' MongoDB conexão aberta!'));

/* ===================== MIDDLEWARE JWT ===================== */
function autenticarToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ sucesso: false, mensagem: 'Token não fornecido' });

  jwt.verify(token, process.env.JWT_SECRET, (err, usuario) => {
    if (err) return res.status(403).json({ sucesso: false, mensagem: 'Token inválido ou expirado' });
    req.usuario = usuario;
    next();
  });
}

/* ===================== SCHEMAS JOI ===================== */
const contaSchema = Joi.object({
  tipo: Joi.string().min(3).max(50).required(),
  descricao: Joi.string().min(0).max(100).allow('').optional(),
  valor: Joi.number().positive().required(),
data: Joi.date().optional()
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
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/* ==============================================================  
                        ROTAS DE CONTAS
   ============================================================== */

/* CRIAR NOVA CONTA */
app.post('/contas', autenticarToken, async (req, res) => {
  const { error } = contaSchema.validate(req.body);
  if (error) return res.status(400).json({ sucesso: false, mensagem: error.details[0].message });

  try {
    const novaConta = new Conta({ ...req.body, usuario: req.usuario.id });
    const contaSalva = await novaConta.save();
    res.status(201).json({ sucesso: true, dados: contaSalva });
  } catch (err) {
    console.error('Erro ao salvar conta:', err);
    res.status(500).json({ sucesso: false, mensagem: 'Erro ao salvar conta' });
  }
});

/* LISTAR CONTAS POR MÊS E ANO */
app.get('/contas', autenticarToken, async (req, res) => {
  try {
    const { mes, ano } = req.query;

    if (!mes || !ano) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Mês e ano são obrigatórios."
      });
    }

    const inicio = new Date(ano, mes - 1, 1);
    const fim = new Date(ano, mes, 0, 23, 59, 59);

    const contas = await Conta.find({
      usuario: req.usuario.id,
      data: { $gte: inicio, $lte: fim }
    }).sort({ data: 1 });

    res.json({ sucesso: true, dados: contas });

  } catch (erro) {
    console.error("Erro ao buscar contas:", erro);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao buscar contas."
    });
  }
});

/* DELETE /contas/:id — REMOVER GASTO */
app.delete('/contas/:id', autenticarToken, async (req, res) => {
  try {
    const id = req.params.id;

    const resultado = await Conta.deleteOne({
      _id: id,
      usuario: req.usuario.id
    });

    if (resultado.deletedCount === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Gasto não encontrado ou não pertence ao usuário.'
      });
    }

    res.json({
      sucesso: true,
      mensagem: 'Gasto removido com sucesso.'
    });

  } catch (erro) {
    console.error("Erro ao excluir gasto:", erro);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao excluir gasto."
    });
  }
});

/* ==============================================================  
                      ROTAS DE USUÁRIOS
   ============================================================== */

/* CADASTRAR USUÁRIO */
app.post('/usuarios/cadastrar', async (req, res) => {
  const { error } = usuarioSchema.validate(req.body);
  if (error) return res.status(400).json({ sucesso: false, mensagem: error.details[0].message });

  try {
    const resultado = await Usuario.criarUsuario(req.body);
    if (!resultado.sucesso) return res.status(400).json({ sucesso: false, mensagem: resultado.erro });

    res.status(201).json({ sucesso: true, mensagem: 'Usuário cadastrado com sucesso!', dados: resultado.usuario });
  } catch (err) {
    console.error('Erro ao cadastrar usuário:', err);
    res.status(500).json({ sucesso: false, mensagem: 'Erro ao cadastrar usuário.' });
  }
});

/* LOGIN */
app.post('/usuarios/login', authLimiter, async (req, res) => {
  try {
    const { email, senha } = req.body;
    const usuario = await Usuario.findOne({ email: email.toLowerCase() });
    if (!usuario) return res.status(400).json({ sucesso: false, mensagem: 'Usuário não encontrado' });

    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) return res.status(401).json({ sucesso: false, mensagem: 'Senha incorreta' });

    const token = jwt.sign({ id: usuario._id, email: usuario.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ sucesso: true, mensagem: 'Login realizado com sucesso', dados: { token } });
  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).json({ sucesso: false, mensagem: 'Erro no login' });
  }
});

/* ===================== PERFIL DO USUÁRIO ===================== */

/* BUSCAR PERFIL */
app.get('/usuarios/:id', autenticarToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Só o dono da conta pode ver
    if (req.usuario.id !== id) {
      return res.status(403).json({ sucesso: false, mensagem: "Acesso negado." });
    }

    const usuario = await Usuario.findById(id).select('-senha -resetToken -resetTokenExpiracao');
    if (!usuario) {
      return res.status(404).json({ sucesso: false, mensagem: "Usuário não encontrado." });
    }

    res.json(usuario);
  } catch (erro) {
    console.error("Erro ao buscar perfil:", erro);
    res.status(500).json({ sucesso: false, mensagem: "Erro ao buscar perfil." });
  }
});

/* VERIFICAR SENHA ATUAL (usada no perfil.js) */
app.post('/usuarios/:id/verificar-senha', autenticarToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { senhaAtual } = req.body;

    if (!senhaAtual) {
      return res
        .status(400)
        .json({ sucesso: false, mensagem: 'Senha atual é obrigatória.' });
    }

    // Segurança: só o dono pode verificar a própria senha
    if (req.usuario.id !== id) {
      return res
        .status(403)
        .json({ sucesso: false, mensagem: 'Acesso negado.' });
    }

    const usuario = await Usuario.findById(id);
    if (!usuario) {
      return res
        .status(404)
        .json({ sucesso: false, mensagem: 'Usuário não encontrado.' });
    }

    const senhaConfere = await bcrypt.compare(senhaAtual, usuario.senha);
    if (!senhaConfere) {
      return res
        .status(401)
        .json({ sucesso: false, mensagem: 'Senha atual incorreta.' });
    }

    
    return res.json({
      sucesso: true,
      mensagem: 'Senha atual verificada com sucesso.'
    });
  } catch (erro) {
    console.error('Erro ao verificar senha atual:', erro);
    return res
      .status(500)
      .json({ sucesso: false, mensagem: 'Erro ao verificar senha.' });
  }
});


/* ATUALIZAR PERFIL */
app.put('/usuarios/:id', autenticarToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (req.usuario.id !== id) {
      return res.status(403).json({ sucesso: false, mensagem: "Acesso negado." });
    }

    const { nome, senha } = req.body;

    const dadosAtualizar = {};
    if (nome) dadosAtualizar.nome = nome;
    if (senha) {
      const senhaHash = await bcrypt.hash(senha, 10);
      dadosAtualizar.senha = senhaHash;
    }

    const usuarioAtualizado = await Usuario.findByIdAndUpdate(
      id,
      { $set: dadosAtualizar },
      { new: true, runValidators: true }
    ).select('-senha');

    res.json({ sucesso: true, mensagem: "Perfil atualizado com sucesso.", dados: usuarioAtualizado });
  } catch (erro) {
    console.error("Erro ao atualizar perfil:", erro);
    res.status(500).json({ sucesso: false, mensagem: "Erro ao atualizar perfil." });
  }
});

/* EXCLUIR CONTA */
app.delete('/usuarios/:id', autenticarToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (req.usuario.id !== id) {
      return res.status(403).json({ sucesso: false, mensagem: "Acesso negado." });
    }

    await Usuario.deleteOne({ _id: id });

    res.json({ sucesso: true, mensagem: "Conta excluída com sucesso." });
  } catch (erro) {
    console.error("Erro ao excluir conta:", erro);
    res.status(500).json({ sucesso: false, mensagem: "Erro ao excluir conta." });
  }
});

/* ===================== UPLOAD DE FOTO DE PERFIL ===================== */
app.post('/usuarios/:id/foto', autenticarToken, upload.single('foto'), async (req, res) => {
  try {
    const { id } = req.params;

    // Segurança: só o dono pode alterar a própria foto
    if (req.usuario.id !== id) {
      return res.status(403).json({ sucesso: false, mensagem: "Acesso negado." });
    }

    if (!req.file) {
      return res.status(400).json({ sucesso: false, mensagem: "Nenhuma imagem enviada." });
    }

    const caminhoFoto = `/public/uploads/usuarios/${req.file.filename}`;

    const usuario = await Usuario.findByIdAndUpdate(
      id,
      { foto: caminhoFoto },
      { new: true }
    ).select('-senha -resetToken -resetTokenExpiracao');

    res.json({
      sucesso: true,
      mensagem: "Foto atualizada com sucesso.",
      foto: usuario.foto
    });

  } catch (erro) {
    console.error("Erro ao salvar foto:", erro);
    res.status(500).json({ sucesso: false, mensagem: "Erro ao enviar foto." });
  }
});


/* ESQUECI SENHA (modo seguro) */
app.post('/usuarios/esqueci-senha', authLimiter, async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      sucesso: false,
      mensagem: 'O email é obrigatório.'
    });
  }

  try {
    const emailNormalizado = email.toLowerCase();
    const usuario = await Usuario.findOne({ email: emailNormalizado });

    //  Não revela se o email existe ou não
    if (!usuario) {
      console.log(`[ESQUECI-SENHA] Tentativa com email inexistente: ${emailNormalizado}`);

      return res.json({
        sucesso: true,
        mensagem: 'Se o email existir em nossa base, você receberá instruções em breve.'
      });
    }

    // 🔐 Gera token de redefinição
    const token = crypto.randomBytes(32).toString('hex');
    usuario.resetToken = token;
    usuario.resetTokenExpiracao = Date.now() + 3600000; // 1h
    await usuario.save();

    const link = `http://localhost:3000/redefinir-senha.html?token=${token}`;

    //  Envia email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: usuario.email,
      subject: 'Redefinição de senha',
      html: `<p>Clique no link para redefinir sua senha:</p>
             <p><a href="${link}">${link}</a></p>`
    });

    //  Retorno genérico mesmo quando existe
    res.json({
      sucesso: true,
      mensagem: 'Se o email existir em nossa base, você receberá instruções em breve.'
    });

  } catch (err) {
    console.error('Erro ao enviar email:', err);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao enviar email.'
    });
  }
});

/* REDEFINIR SENHA */
app.post('/usuarios/redefinir-senha', async (req, res) => {
  const { token, novaSenha } = req.body;
  if (!token) return res.status(400).json({ sucesso: false, mensagem: 'Token é obrigatório.' });

  const { error } = novaSenhaSchema.validate({ novaSenha });
  if (error) return res.status(400).json({ sucesso: false, mensagem: error.details[0].message });

  try {
    const usuario = await Usuario.findOne({
      resetToken: token,
      resetTokenExpiracao: { $gt: Date.now() }
    });

    if (!usuario) {
      return res.status(400).json({ sucesso: false, mensagem: 'Token inválido ou expirado.' });
    }

    const senhaHash = await bcrypt.hash(novaSenha, 10);
    usuario.senha = senhaHash;
    usuario.resetToken = undefined;
    usuario.resetTokenExpiracao = undefined;
    await usuario.save();

    res.json({ sucesso: true, mensagem: 'Senha redefinida com sucesso!' });
  } catch (err) {
    console.error('Erro ao redefinir senha:', err);
    res.status(500).json({ sucesso: false, mensagem: 'Erro ao redefinir senha.' });
  }
});

/* ===================== ERRO GLOBAL ===================== */
app.use((err, req, res, next) => {
  console.error('Erro interno:', err);
  res.status(500).json({ sucesso: false, mensagem: 'Erro interno no servidor' });
});

/* ===================== INICIALIZAÇÃO ===================== */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(` Servidor rodando na porta ${PORT}`));