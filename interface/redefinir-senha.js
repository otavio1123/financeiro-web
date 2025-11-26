// BASE_URL dinâmica — igual às outras telas
const isLocal =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

const BASE_URL = isLocal
  ? "http://localhost:3000"
  : window.location.origin;  // ✔ usa a URL real do Render em produção


// Pegar token da URL: redefinir-senha.html?token=...
function obterTokenDaUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("token");
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-redefinir");
  const novaSenhaInput = document.getElementById("novaSenha");
  const confirmarSenhaInput = document.getElementById("confirmarSenha");
  const mensagem = document.getElementById("mensagem");
  const btnRedefinir = document.getElementById("btn-redefinir");

  const token = obterTokenDaUrl();

  // Se não tiver token, não deixa redefinir
  if (!token) {
    mensagem.style.color = "red";
    mensagem.textContent =
      "Token ausente ou inválido. Use o link enviado por email.";
    form.querySelectorAll("input, button").forEach((el) => (el.disabled = true));
    return;
  }

  function mostrarMensagem(texto, cor = "red") {
    mensagem.style.color = cor;
    mensagem.textContent = texto;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const novaSenha = novaSenhaInput.value.trim();
    const confirmarSenha = confirmarSenhaInput.value.trim();

    mensagem.textContent = "";

    if (!novaSenha || !confirmarSenha) {
      mostrarMensagem("Preencha todos os campos.");
      return;
    }

    if (novaSenha.length < 6) {
      mostrarMensagem("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (novaSenha !== confirmarSenha) {
      mostrarMensagem("As senhas não conferem.");
      return;
    }

    btnRedefinir.disabled = true;
    btnRedefinir.textContent = "Redefinindo...";

    try {
      const resposta = await fetch(`${BASE_URL}/usuarios/redefinir-senha`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, novaSenha }),
      });

      const dados = await resposta.json().catch(() => ({}));

      if (resposta.ok) {
        mostrarMensagem(
          dados.mensagem || "Senha redefinida com sucesso!",
          "green"
        );

        setTimeout(() => {
          window.location.href = "telalogin.html";
        }, 2000);
      } else {
        mostrarMensagem(
          dados.mensagem || dados.erro || "Erro ao redefinir senha."
        );
      }
    } catch (erro) {
      console.error("Erro na redefinição de senha:", erro);
      mostrarMensagem("Erro de conexão com o servidor.");
    } finally {
      btnRedefinir.disabled = false;
      btnRedefinir.textContent = "Redefinir Senha";
    }
  });
});
