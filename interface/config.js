// interface/config.js

const isLocalHost =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

const API_URL = isLocalHost
  ? "http://localhost:3000"                      // quando você está rodando tudo local
  : "https://financeiro-web-ajoi.onrender.com";  // backend no Render
