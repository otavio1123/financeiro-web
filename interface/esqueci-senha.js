const isLocal =
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1';

const BASE_URL = isLocal
  ? 'http://localhost:3000'
  : window.location.origin;   // 👈 usa a própria URL do Render em produção



document.getElementById('form-recuperar-senha').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const mensagem = document.getElementById('mensagem');

  mensagem.textContent = '';

  if (!email) {
    mensagem.style.color = 'red';
    mensagem.textContent = 'Por favor, insira seu email.';
    return;
  }

  try {
    const resposta = await fetch(`${BASE_URL}/usuarios/esqueci-senha`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const dados = await resposta.json();

    if (resposta.ok) {
      mensagem.style.color = 'green';
      mensagem.textContent = dados.mensagem || 'Instruções enviadas para seu email.';
    } else {
      mensagem.style.color = 'red';
      mensagem.textContent = dados.mensagem || 'Erro ao tentar recuperar a senha.';
    }

  } catch (erro) {
    mensagem.style.color = 'red';
    mensagem.textContent = 'Erro de conexão com o servidor.';
    console.error('Erro ao conectar com o backend:', erro);
  }
});
