// ===============================
// CONFIG DA API (pode deixar aqui
// ou reaproveitar o mesmo padrão
// do config.js)
// ===============================
const isLocal =
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1';

const BASE_URL = isLocal
  ? 'http://localhost:3000'
  : window.location.origin;   // em produção usa a própria URL do Render

// ===============================
// LÓGICA DO FORMULÁRIO ESQUECI SENHA
// ===============================
const formRecuperar = document.getElementById('form-recuperar-senha');
const inputEmail = document.getElementById('email');
const mensagem = document.getElementById('mensagem');
const botao = formRecuperar.querySelector('button[type="submit"]');

formRecuperar.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = inputEmail.value.trim();
  mensagem.textContent = '';

  if (!email) {
    mensagem.style.color = 'red';
    mensagem.textContent = 'Por favor, insira seu email.';
    return;
  }

  // desabilita o botão pra evitar clique duplo
  botao.disabled = true;
  botao.textContent = 'Enviando...';

  try {
    const resposta = await fetch(`${BASE_URL}/usuarios/esqueci-senha`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    let dados = {};
    try {
      dados = await resposta.json();
    } catch {
      dados = {};
    }

    if (resposta.ok) {
      mensagem.style.color = 'green';
      mensagem.textContent =
        dados.mensagem || 'Instruções enviadas para seu email.';
      formRecuperar.reset();
    } else {
      mensagem.style.color = 'red';
      mensagem.textContent =
        dados.mensagem || 'Erro ao tentar recuperar a senha.';
    }

  } catch (erro) {
    console.error('Erro ao conectar com o backend:', erro);
    mensagem.style.color = 'red';
    mensagem.textContent = 'Erro de conexão com o servidor.';
  } finally {
    botao.disabled = false;
    botao.textContent = 'Recuperar senha';
  }
});
