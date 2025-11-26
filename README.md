Financeiro Web

Aplicativo web para gestão financeira pessoal, desenvolvido com Node.js, Express e MongoDB no backend e HTML, CSS e JavaScript no frontend.
O sistema oferece controle de gastos, autenticação segura e funcionalidades de recuperação de senha.

Objetivo do Sistema

O sistema permite que o usuário:

Cadastre uma conta

Realize login

Registre e visualize seus gastos

Analise despesas através de gráficos

Atualize dados de perfil

Recupere a senha por e-mail

Redefina a senha através de link enviado

Tecnologias Utilizadas
Frontend

HTML5

CSS3

JavaScript

Chart.js (gráficos)

Fetch API para comunicação com o backend

Backend

Node.js

Express.js

Mongoose (ODM)

JWT para autenticação

bcrypt para criptografia de senhas

Helmet, CORS e rate limiting para segurança

Nodemailer para envio de e-mails de recuperação

Dotenv para variáveis de ambiente

Banco de Dados

MongoDB (Atlas ou local)

Arquitetura do Sistema

Frontend localizado na pasta /interface contendo páginas HTML, CSS e scripts JS.

Backend em Node.js exposto via API REST.

Banco de dados MongoDB para todas as entidades.

Estrutura de Pastas (resumo)
financeiro-web/
├── server.js
├── package.json
├── .env
├── models/
│   └── (Modelos Mongoose)
├── interface/
│   ├── telalogin.html
│   ├── cadastro.html
│   ├── telaprincipal.html
│   ├── perfil.html
│   ├── esqueci-senha.html
│   ├── redefinir-senha.html
│   ├── *.css
│   ├── *.js
│   └── libs/
│       └── chart.js

Funcionalidades Principais
Usuário

Cadastro

Login com JWT

Atualização de perfil

Troca de senha autenticada

Esqueci a senha (envio de e-mail com token)

Redefinição de senha com token

Gastos

Registro de gastos

Listagem por período

Visualização por gráfico utilizando Chart.js

Segurança

Senhas criptografadas com bcrypt

Sessões com JWT

Proteção das rotas com verificação de token

Helmet e CORS para proteção adicional

Chart.js carregado localmente para evitar violação de Content Security Policy no Render

Variáveis de Ambiente

Exemplo de arquivo .env:

PORT=3000
MONGO_URI=sua_string_de_conexao
JWT_SECRET=seu_token_secreto
EMAIL_HOST=smtp.seuprovedor.com
EMAIL_PORT=587
EMAIL_USER=email
EMAIL_PASS=senha
EMAIL_FROM="Financeiro Web <email>"

Como Executar o Projeto Localmente

Clonar o repositório:

git clone https://github.com/SEU_USUARIO/financeiro-web.git
cd financeiro-web


Instalar dependências:

npm install


Criar o arquivo .env com suas credenciais.

Iniciar o servidor:

node server.js


Acessar a aplicação no navegador:

http://localhost:3000/telalogin.html

Deploy no Render

Projeto configurado para hospedagem no Render.

Em produção, a BASE_URL utiliza window.location.origin.

Todos os arquivos estáticos são servidos pela pasta /interface.

ETAPA 4 — Salvar o arquivo

Pressione:

Ctrl + S


O arquivo README.md agora está pronto no seu projeto.

ETAPA 5 — Verificar no Git

Abra o Git Bash dentro da pasta do projeto e digite:

git status