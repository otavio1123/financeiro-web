// ===============================
// CONFIG DA API (igual cadastro.js)
// ===============================
const isLocal =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

const BASE_URL = isLocal
  ? "http://localhost:3000"
  : window.location.origin;  // ✔ usa a URL real do Render em produção


// ===============================
// LÓGICA DA PÁGINA DE PERFIL
// ===============================
document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  const mensagem = document.getElementById("mensagem");
  const nomeInput = document.getElementById("nome");
  const emailInput = document.getElementById("email");
  const imagemPerfil = document.getElementById("imagem-perfil");
  const uploadFoto = document.getElementById("upload-foto");
  const formPerfil = document.getElementById("form-perfil");

  // 🔐 elementos relacionados à senha
  const senhaAtualInput = document.getElementById("senhaAtual");
  const novaSenhaInput = document.getElementById("novaSenha");
  const confirmarNovaSenhaInput = document.getElementById("confirmarNovaSenha");
  const blocoNovaSenha = document.getElementById("bloco-nova-senha");
  const btnConfirmarSenha = document.getElementById("btn-confirmar-senha");
  const btnConfirmarNovaSenha = document.getElementById("btn-confirmar-nova-senha"); // 🔹 novo

  // flag para saber se a senha atual já foi validada
  let senhaAtualVerificada = false;

  function mostrarMensagem(texto, cor = "red") {
    mensagem.style.color = cor;
    mensagem.textContent = texto;
  }

  if (!token) {
    alert("Sessão expirada. Faça login novamente.");
    window.location.href = "telalogin.html";
    return;
  }

  let usuarioId = null;

  // ===========================
  // PEGAR ID DO USUÁRIO NO TOKEN
  // ===========================
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    usuarioId = payload.id || payload.userId || payload._id;

    if (!usuarioId) {
      mostrarMensagem("Erro ao identificar usuário. Faça login novamente.");
      return;
    }
  } catch (erro) {
    console.error("Erro ao decodificar token:", erro);
    mostrarMensagem("Token inválido. Faça login novamente.");
    return;
  }

  // ===========================
  // 1) CARREGAR PERFIL
  // ===========================
  try {
    const resposta = await fetch(`${BASE_URL}/usuarios/${usuarioId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const dados = await resposta.json().catch(() => ({}));

    if (resposta.ok) {
      nomeInput.value = dados.nome || "";
      emailInput.value = dados.email || "";

      // 👉 SE TIVER FOTO NO BANCO, MOSTRA
      if (dados.foto) {
        imagemPerfil.src = dados.foto;
      }

      mostrarMensagem("", "black");
    } else {
      console.error("Erro ao carregar perfil:", resposta.status, dados);
      mostrarMensagem(dados.mensagem || dados.erro || "Erro ao carregar perfil.");
    }
  } catch (erro) {
    console.error("Erro ao carregar perfil:", erro);
    mostrarMensagem("Erro ao carregar perfil.");
  }

  // ===========================
  // 1.1) CONFIRMAR SENHA ATUAL
  // ===========================
  btnConfirmarSenha.addEventListener("click", async () => {
    const senhaAtual = senhaAtualInput.value.trim();
    mostrarMensagem("");

    if (!senhaAtual) {
      mostrarMensagem("Digite sua senha atual.");
      return;
    }

    try {
      const resposta = await fetch(
        `${BASE_URL}/usuarios/${usuarioId}/verificar-senha`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ senhaAtual }),
        }
      );

      const dados = await resposta.json().catch(() => ({}));

      if (!resposta.ok) {
        senhaAtualVerificada = false;
        blocoNovaSenha.classList.add("hidden");
        mostrarMensagem(dados.mensagem || "Senha atual incorreta.");
        return;
      }

      // senha correta → libera campos de nova senha
      senhaAtualVerificada = true;
      blocoNovaSenha.classList.remove("hidden");
      mostrarMensagem("Senha atual confirmada. Defina a nova senha.", "green");
    } catch (erro) {
      console.error("Erro ao verificar senha atual:", erro);
      mostrarMensagem("Erro ao verificar senha. Tente novamente.");
    }
  });

  // ===========================
  // 1.2) CONFIRMAR NOVA SENHA (botão dentro do bloco)
  // ===========================
  btnConfirmarNovaSenha.addEventListener("click", () => {
    const novaSenha = novaSenhaInput.value.trim();
    const confirmarNovaSenha = confirmarNovaSenhaInput.value.trim();

    if (!novaSenha || !confirmarNovaSenha) {
      mostrarMensagem("Preencha os dois campos de nova senha.");
      return;
    }

    if (novaSenha !== confirmarNovaSenha) {
      mostrarMensagem("As senhas não conferem. Digite novamente.");
      return;
    }

    if (novaSenha.length < 6) {
      mostrarMensagem("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }

    mostrarMensagem("Nova senha validada! Agora clique em Salvar Alterações.", "green");
  });

  // ===========================
  // 2) ATUALIZAR PERFIL (PUT)
  // ===========================
  formPerfil.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nome = nomeInput.value.trim();

    if (!nome) {
      mostrarMensagem("O nome não pode ficar em branco.");
      return;
    }

    const corpo = { nome };

    // Se a senha atual já foi confirmada, permitimos alterar a senha
    if (senhaAtualVerificada) {
      const novaSenha = novaSenhaInput.value.trim();
      const confirmarNovaSenha = confirmarNovaSenhaInput.value.trim();

      if (novaSenha || confirmarNovaSenha) {
        // se mexeu nesses campos, valida tudo
        if (!novaSenha || !confirmarNovaSenha) {
          mostrarMensagem("Preencha e confirme a nova senha.");
          return;
        }

        if (novaSenha !== confirmarNovaSenha) {
          mostrarMensagem("As senhas não conferem. Digite novamente.");
          return;
        }

        if (novaSenha.length < 6) {
          mostrarMensagem("A nova senha deve ter pelo menos 6 caracteres.");
          return;
        }

        corpo.senha = novaSenha;
      }
    }

    try {
      const resposta = await fetch(`${BASE_URL}/usuarios/${usuarioId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(corpo),
      });

      const dados = await resposta.json().catch(() => ({}));

      if (resposta.ok) {
        mostrarMensagem("Perfil atualizado com sucesso.", "green");

        // limpa campos de senha e fecha bloco
        senhaAtualInput.value = "";
        novaSenhaInput.value = "";
        confirmarNovaSenhaInput.value = "";
        blocoNovaSenha.classList.add("hidden");
        senhaAtualVerificada = false;
      } else {
        console.error("Erro ao atualizar perfil:", resposta.status, dados);
        mostrarMensagem(dados.mensagem || dados.erro || "Erro ao atualizar perfil.");
      }
    } catch (erro) {
      console.error("Erro na requisição ao atualizar:", erro);
      mostrarMensagem("Erro na requisição ao atualizar.");
    }
  });

  // ===========================
  // 3) EXCLUIR CONTA
  // ===========================
  document.getElementById("btn-excluir").addEventListener("click", async () => {
    if (!confirm("Tem certeza que deseja excluir sua conta?")) return;

    try {
      const resposta = await fetch(`${BASE_URL}/usuarios/${usuarioId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const dados = await resposta.json().catch(() => ({}));

      if (resposta.ok) {
        alert("Conta excluída com sucesso.");
        localStorage.removeItem("token");
        window.location.href = "cadastro.html";
      } else {
        console.error("Erro ao excluir conta:", resposta.status, dados);
        mostrarMensagem(dados.mensagem || dados.erro || "Erro ao excluir conta.");
      }
    } catch (erro) {
      console.error("Erro na requisição ao excluir:", erro);
      mostrarMensagem("Erro na requisição ao excluir.");
    }
  });

  // ===========================
  // 4) VOLTAR / LOGOUT
  // ===========================
  document.getElementById("btn-voltar").addEventListener("click", () => {
    window.location.href = "telaprincipal.html";
  });

  document.getElementById("btn-logout").addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "telalogin.html";
  });

  // ===========================
  // 5) UPLOAD DA FOTO (ENVIA PRO BACKEND)
  // ===========================
  uploadFoto.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("foto", file);

    try {
      const resposta = await fetch(`${BASE_URL}/usuarios/${usuarioId}/foto`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const dados = await resposta.json().catch(() => ({}));

      if (resposta.ok) {
        if (dados.foto) {
          imagemPerfil.src = dados.foto;
        }
        mostrarMensagem("Foto atualizada com sucesso!", "green");
      } else {
        console.error("Erro ao enviar foto:", resposta.status, dados);
        mostrarMensagem(dados.mensagem || "Erro ao enviar foto.");
      }
    } catch (erro) {
      console.error("Erro ao enviar foto:", erro);
      mostrarMensagem("Erro ao enviar foto.");
    }
  });
});
