const form = document.getElementById('form-login');
const mensagemErro = document.getElementById('mensagem-erro');

// Detecta ambiente local e produção
const isLocalHost =
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1';

const BASE_URL = isLocalHost
  ? 'http://localhost:3000'
  : window.location.origin; // em produção usa a própria URL do Render

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value.trim().toLowerCase();
  const senha = document.getElementById('senha').value.trim();

  mensagemErro.textContent = '';
  mensagemErro.style.color = '';

  if (!email || !senha) {
    mensagemErro.style.color = 'red';
    mensagemErro.textContent = 'Preencha todos os campos.';
    return;
  }

  try {
    const resposta = await fetch(`${BASE_URL}/usuarios/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha })
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      mensagemErro.style.color = 'red';
      mensagemErro.textContent = dados.mensagem || 'Erro no login.';
      return;
    }

    const token = dados?.dados?.token;

    if (!token) {
      mensagemErro.style.color = 'red';
      mensagemErro.textContent = 'Erro inesperado: token não recebido.';
      return;
    }

    localStorage.setItem('token', token);

    mensagemErro.style.color = 'green';
    mensagemErro.textContent = dados.mensagem || 'Login realizado com sucesso!';

    setTimeout(() => {
      window.location.href = 'telaprincipal.html';
    }, 800);

  } catch (erro) {
    mensagemErro.style.color = 'red';
    mensagemErro.textContent = 'Erro de conexão. Verifique se o servidor está rodando.';
    console.error('Erro:', erro);
  }
});
