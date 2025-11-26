const botaoVoltar = document.getElementById("btn-voltar");

if (botaoVoltar) {
  botaoVoltar.addEventListener("click", () => {
    const referrer = document.referrer;

    if (referrer) {
      try {
        const urlReferrer = new URL(referrer);

        // Garante que veio do mesmo site
        if (urlReferrer.hostname === window.location.hostname) {
          window.location.href = referrer;
          return;
        }
      } catch (e) {
        // Se der erro ao interpretar o referrer, ignora e cai no fallback
      }
    }

    // Fallback: se não tiver referrer ou for de outro site
    window.location.href = "telalogin.html";
  });
}
