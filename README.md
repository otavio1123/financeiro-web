Financeiro Web

Aplicativo web para gestão financeira pessoal, desenvolvido com Node.js, Express e MongoDB no backend, e HTML/CSS/JavaScript no frontend.
O sistema oferece controle de gastos, gráficos dinâmicos, gerenciamento de perfil, autenticação avançada, recuperação de senha e um módulo completo de segurança com auditoria por logs.

Objetivo do Sistema

O Financeiro Web permite que o usuário:

Cadastre uma conta.

Realize login com autenticação segura.

Mantenha sessão ativa através de Access Token e Refresh Token.

Registre gastos financeiros.

Visualize gastos por mês e ano.

Analise despesas através de gráficos.

Atualize nome, senha e foto de perfil.

Recupere senha via e-mail.

Redefina a senha por meio de link seguro.

Tenha ações registradas em logs de segurança para auditoria.

Tecnologias Utilizadas
Frontend

HTML5

CSS3

JavaScript

Chart.js (versão local para compatibilidade com CSP)

Fetch API

Backend

Node.js

Express

Mongoose

JWT (Access Token + Refresh Token)

bcryptjs

Helmet

Rate Limiting (express-rate-limit)

CORS configurado

Crypto (tokens e criptografia AES quando necessário)

Nodemailer

Dotenv

Banco de Dados

MongoDB Atlas

Modelos Mongoose

Usuario

Conta

RefreshToken

LogSeguranca

Arquitetura do Sistema
financeiro-web/
├── server.js                     → Servidor Express principal
├── package.json
├── .env                          → Variáveis de ambiente
│
├── interface/                    → Frontend (HTML, CSS, JS)
│   ├── telalogin.html
│   ├── cadastro.html
│   ├── telaprincipal.html
│   ├── perfil.html
│   ├── esqueci-senha.html
│   ├── redefinir-senha.html
│   ├── *.css
│   └── *.js
│
├── models/                       → Modelos do banco
│   ├── Usuario.js
│   ├── Conta.js
│   ├── RefreshToken.js
│   └── LogSeguranca.js
│
├── security/
│   └── jwt.js                   → Geração e validação de tokens
│
└── public/
    └── uploads/
        └── usuarios/            → Fotos de perfil

Funcionalidades Principais
Usuário

Cadastro de usuário.

Login com validação de e-mail e senha.

Autenticação com JWT (Access Token de curta duração).

Renovação da sessão por Refresh Token.

Logout com revogação do Refresh Token.

Atualização de nome, senha e foto de perfil.

Exclusão de conta.

Recuperação de Senha

Envio de e-mail com link de redefinição.

Token criptográfico de 64 caracteres.

Expiração automática do token após 1 hora.

Gastos

Registro de gastos com valor, categoria, descrição e data.

Consulta de gastos por mês e ano.

Remoção de gastos.

Gráfico em Pizza com total por categoria.

Segurança

Senhas criptografadas com bcrypt.

JWT com expiração curta e renovação por Refresh Token.

Refresh Token armazenado no banco com controle de validade.

Rate limiting em rotas sensíveis.

Helmet para proteção de cabeçalhos HTTP.

CORS configurado.

Logs detalhados registrados no MongoDB.

Logs de Segurança

Todas as ações críticas são registradas na coleção logsegurancas.

Ações registradas

LOGIN_SUCESSO

LOGIN_FALHA_EMAIL_INEXISTENTE

LOGIN_FALHA_SENHA_INCORRETA

LOGIN_ERRO_INTERNO

ESQUECI_SENHA

TOKEN_EXPIROU

LOGOUT

Todas as tentativas incorretas de login

Ações administrativas do usuário

Dados armazenados em cada log

userId (quando aplicável)

Ação executada

Endereço IP

Detalhes adicionais

Data e hora (timestamps automáticos)

Esse módulo fornece auditoria, rastreamento e segurança avançada contra acessos indevidos.

Variáveis de Ambiente (.env)

Exemplo:

PORT=3000

# Banco de Dados
MONGO_URI=sua_string_mongodb

# JWT
JWT_SECRET=chave_access_token
JWT_REFRESH_SECRET=chave_refresh_token

# AES (caso utilizado)
AES_SECRET=chave_AES_32_bytes

# Email
EMAIL_USER=seu_email@gmail.com
EMAIL_PASS=senha_de_aplicativo_google

Como Executar o Projeto Localmente

Clonar o repositório:

git clone https://github.com/otavio1123/financeiro-web.git
cd financeiro-web


Instalar dependências:

npm install


Criar o arquivo .env

Iniciar o servidor:

node server.js


Abrir no navegador:

http://localhost:3000/telalogin.html

Deploy no Render

Todos os arquivos estáticos são servidos de /interface/.

A base de URLs no frontend usa window.location.origin, permitindo funcionamento em produção.

Chart.js local evita bloqueios por Content Security Policy.

Conclusão

O sistema atende completamente aos requisitos de segurança da disciplina:

Cadastro seguro

Autenticação baseada em JWT

Gestão de sessões com Refresh Token

Proteção de dados com bcrypt e boas práticas técnicas

Recuperação de credenciais via e-mail

Logs detalhados e auditoria de eventos

Documentação técnica completa

Arquitetura organizada e modular