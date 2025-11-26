// ===============================
// CONFIGURAÇÃO DA API
// ===============================
const isLocalHost =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

const BASE_URL = isLocal
  ? "http://localhost:3000"
  : window.location.origin;  // ✔ usa a URL real do Render em produção


// ===============================
// ELEMENTOS DO DOM
// ===============================
const mesAtualSpan = document.getElementById("mes-atual");
const btnAnterior = document.getElementById("mes-anterior");
const btnSeguinte = document.getElementById("mes-seguinte");
const listaGastos = document.getElementById("lista-gastos");

const btnAdicionar = document.getElementById("btn-adicionar");
const btnRemover = document.getElementById("btn-remover");
const modalAdicionar = document.getElementById("modal-adicionar-gasto");
const formAdicionarGasto = document.getElementById("form-adicionar-gasto");
const btnCancelar = document.getElementById("btn-cancelar");

const modalRemover = document.getElementById("modal-remover-gasto");
const btnVoltarRemover = document.getElementById("btn-voltar-remover");
const listaRemoverGastos = document.getElementById("lista-remover-gastos");

const btnPerfil = document.getElementById("btn-perfil");

let graficoGastos = null;
let dataReferencia = new Date();

// ===============================
// NAVEGAÇÃO PERFIL
// ===============================
if (btnPerfil) {
  btnPerfil.addEventListener("click", () => {
    window.location.href = "perfil.html";
  });
}

// ===============================
// FUNÇÕES AUXILIARES
// ===============================
function formatarMesAno(data) {
  const texto = data.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric"
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function formatarData(dataString) {
  const data = new Date(dataString);
  const dia = String(data.getDate()).padStart(2, "0");
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const ano = data.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

// ===============================
// GRÁFICO
// ===============================
function desenharGrafico(contas) {
  const valoresPorTipo = {};

  contas.forEach(conta => {
    const tipo = conta.tipo || "Outros";
    valoresPorTipo[tipo] = (valoresPorTipo[tipo] || 0) + conta.valor;
  });

  const ctx = document.getElementById("graficoGastos").getContext("2d");

  if (graficoGastos) graficoGastos.destroy();

  graficoGastos = new Chart(ctx, {
    type: "pie",
    data: {
      labels: Object.keys(valoresPorTipo),
      datasets: [
        {
          data: Object.values(valoresPorTipo),
          backgroundColor: [
            "#FF6384",
            "#36A2EB",
            "#FFCE56",
            "#4BC0C0",
            "#9966FF",
            "#FF9F40"
          ]
        }
      ]
    },
    options: { responsive: true }
  });
}

// ===============================
// CARREGAR GASTOS
// ===============================
async function carregarGastos() {
  const mes = dataReferencia.getMonth() + 1;
  const ano = dataReferencia.getFullYear();
  mesAtualSpan.textContent = formatarMesAno(dataReferencia);

  try {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Sessão expirada. Faça login novamente.");
      window.location.href = "telalogin.html";
      return;
    }

    const resposta = await fetch(
      `${API_URL}/contas?mes=${mes}&ano=${ano}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    const dados = await resposta.json();

    if (!resposta.ok) {
      throw new Error(dados.mensagem || "Erro ao buscar dados");
    }

    const contas = dados.dados || dados;

    renderizarGastos(contas);
    desenharGrafico(contas);
  } catch (erro) {
    console.error("Erro ao carregar:", erro);
    listaGastos.innerHTML = `<p class="erro">Erro ao carregar gastos.</p>`;
  }
}

// ===============================
// RENDERIZAR GASTOS
// ===============================
function renderizarGastos(contas) {
  listaGastos.innerHTML = "";

  if (!contas || !contas.length) {
    listaGastos.innerHTML = `<p class="vazio">Nenhum gasto encontrado neste mês.</p>`;
    return;
  }

  contas.forEach(conta => {
    const item = document.createElement("div");
    item.className = "gasto-item";

    const descricaoHTML = conta.descricao
      ? `<p>${conta.descricao}</p>`
      : "";

    item.innerHTML = `
      <div>
        <small>${formatarData(conta.data)} • ${conta.tipo}</small>
        ${descricaoHTML}
      </div>
      <div>R$ ${conta.valor.toFixed(2)}</div>
    `;

    listaGastos.appendChild(item);
  });
}

// ===============================
// EXCLUIR GASTO
// ===============================
async function excluirGasto(id) {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Sessão expirada. Faça login novamente.");
      window.location.href = "telalogin.html";
      return;
    }

    const resposta = await fetch(`${API_URL}/contas/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!resposta.ok) {
      const erro = await resposta.json().catch(() => ({
        mensagem: "Erro desconhecido"
      }));
      throw new Error(erro.mensagem || "Erro ao excluir gasto");
    }

    await carregarGastos();
    await carregarListaRemoverGastos();
  } catch (erro) {
    alert(`Erro: ${erro.message}`);
  }
}

// ===============================
// NAVEGAÇÃO ENTRE MESES
// ===============================
btnAnterior.addEventListener("click", () => {
  dataReferencia.setMonth(dataReferencia.getMonth() - 1);
  carregarGastos();
});

btnSeguinte.addEventListener("click", () => {
  dataReferencia.setMonth(dataReferencia.getMonth() + 1);
  carregarGastos();
});

// ===============================
// MODAL ADICIONAR
// ===============================
btnAdicionar.addEventListener("click", () => {
  formAdicionarGasto.reset();
  modalAdicionar.classList.remove("modal-escondido");
});

btnCancelar.addEventListener("click", () => {
  modalAdicionar.classList.add("modal-escondido");
});

window.addEventListener("click", e => {
  if (e.target === modalAdicionar) {
    modalAdicionar.classList.add("modal-escondido");
  }
  if (e.target === modalRemover) {
    modalRemover.classList.add("modal-escondido");
  }
});

// ===============================
// ADICIONAR GASTO
// ===============================
formAdicionarGasto.addEventListener("submit", async e => {
  e.preventDefault();

  const tipo = formAdicionarGasto.tipo.value;
  const descricao = formAdicionarGasto.descricao.value.trim();
  const valor = parseFloat(formAdicionarGasto.valor.value);
  const data = formAdicionarGasto.data.value;

  if (!tipo || !valor || !data) {
    alert("Preencha todos os campos obrigatórios.");
    return;
  }

  try {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Sessão expirada. Faça login novamente.");
      window.location.href = "telalogin.html";
      return;
    }

    const resposta = await fetch(`${API_URL}/contas`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ tipo, descricao, valor, data })
    });

    if (!resposta.ok) {
      const erro = await resposta.json().catch(() => ({
        mensagem: "Erro desconhecido"
      }));
      throw new Error(erro.mensagem || "Erro ao adicionar gasto");
    }

    modalAdicionar.classList.add("modal-escondido");
    await carregarGastos();
  } catch (erro) {
    alert(`Erro: ${erro.message}`);
  }
});

// ===============================
// MODAL REMOVER
// ===============================
btnRemover.addEventListener("click", () => {
  modalRemover.classList.remove("modal-escondido");
  carregarListaRemoverGastos();
});

btnVoltarRemover.addEventListener("click", () => {
  modalRemover.classList.add("modal-escondido");
});

// ===============================
// LISTA DE REMOVER
// ===============================
async function carregarListaRemoverGastos() {
  try {
    const token = localStorage.getItem("token");
    const mes = dataReferencia.getMonth() + 1;
    const ano = dataReferencia.getFullYear();

    if (!token) {
      listaRemoverGastos.innerHTML = `<p>Sessão expirada. Faça login novamente.</p>`;
      return;
    }

    const resposta = await fetch(
      `${API_URL}/contas?mes=${mes}&ano=${ano}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    const dados = await resposta.json();

    if (!resposta.ok) {
      throw new Error(dados.mensagem || "Erro ao buscar gastos");
    }

    const contas = dados.dados || dados;

    if (!contas.length) {
      listaRemoverGastos.innerHTML = `<p>Nenhum gasto para remover neste mês.</p>`;
      return;
    }

    listaRemoverGastos.innerHTML = contas
      .map(
        c => `
      <div class="item-remover">
        <span>${formatarData(c.data)} - ${c.tipo} - ${
          c.descricao || ""
        } - R$ ${c.valor.toFixed(2)}</span>
        <button class="btn-excluir" data-id="${c._id}">Excluir</button>
      </div>
    `
      )
      .join("");

    listaRemoverGastos
      .querySelectorAll(".btn-excluir")
      .forEach(btn => {
        btn.addEventListener("click", async () => {
          if (confirm("Deseja realmente excluir este gasto?")) {
            await excluirGasto(btn.dataset.id);
          }
        });
      });
  } catch (erro) {
    console.error(erro);
    listaRemoverGastos.innerHTML = `<p>Erro ao carregar gastos para remoção.</p>`;
  }
}

// ===============================
// INICIALIZAÇÃO
// ===============================
window.addEventListener("DOMContentLoaded", carregarGastos);
