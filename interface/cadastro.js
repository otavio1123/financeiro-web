// Detecta ambiente local corretamente
const isLocal =
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1';

const BASE_URL = isLocal
  ? 'http://localhost:3000'
  : window.location.origin;   // 👈 em produção usa a própria URL do Render


document.getElementById('form-cadastro').addEventListener('submit', async (e) => {
  e.preventDefault();

  const nome = document.getElementById('nome').value.trim();
  const email = document.getElementById('email').value.trim();
  const senha = document.getElementById('senha').value.trim();
  const confirmarSenha = document.getElementById('confirmarSenha').value.trim();
  const aceitarPolitica = document.getElementById('aceitarPolitica');
  const mensagemErro = document.getElementById('mensagem-erro');

  // limpa mensagem anterior
  mensagemErro.textContent = '';

  // Valida política de privacidade
  if (!aceitarPolitica.checked) {
    mensagemErro.textContent = 'Você precisa aceitar a Política de Privacidade para continuar.';
    return;
  }

  // Valida campos vazios
  if (!nome || !email || !senha || !confirmarSenha) {
    mensagemErro.textContent = 'Todos os campos são obrigatórios.';
    return;
  }

  // Valida se as senhas conferem
  if (senha !== confirmarSenha) {
    mensagemErro.textContent = 'As senhas não conferem. Digite novamente.';
    return;
  }

  // (Opcional) tamanho mínimo da senha
  if (senha.length < 6) {
    mensagemErro.textContent = 'A senha deve ter pelo menos 6 caracteres.';
    return;
  }

  try {
    const resposta = await fetch(`${BASE_URL}/usuarios/cadastrar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, email, senha }) // só a senha vai pro backend
    });

    const dados = await resposta.json();
    console.log('Resposta do backend:', dados);

    if (!resposta.ok) {
      mensagemErro.textContent = dados.mensagem || 'Erro ao cadastrar.';
      return;
    }

    alert('Cadastro realizado com sucesso!');
    window.location.href = 'telalogin.html';

  } catch (erro) {
    mensagemErro.textContent = 'Erro na requisição. Tente novamente.';
    console.error('Erro ao conectar com o backend:', erro);
  }
});
