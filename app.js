/**
 * app.js
 * Bootstrap da aplicação SIPRO+:
 *  - Roteamento simples entre "páginas" (seções .main-content)
 *  - Sistema de notificações (toasts)
 *  - Inicialização dos módulos de tela
 */

(function () {
  "use strict";

  /* ------------------------------------------------------------
     Roteamento entre páginas (SPA simples, sem hash router)
  ------------------------------------------------------------ */
  function navigateTo(pageId) {
    document.querySelectorAll("main.main-content").forEach((page) => {
      page.classList.add("hidden");
    });

    const target = document.getElementById(`page-${pageId}`);
    if (target) {
      target.classList.remove("hidden");
    }

    // Carrega dados da página ao entrar nela
    if (pageId === "usuarios") {
      window.SIPRO.UsuariosModule.load();
    }
  }

  /* ------------------------------------------------------------
     Toasts
  ------------------------------------------------------------ */
  const toastContainer = document.getElementById("toastContainer");

  const Toast = {
    show(message, type = "info", duration = 3500) {
      const toast = document.createElement("div");
      toast.className = `toast toast-${type}`;
      toast.textContent = message;
      toastContainer.appendChild(toast);

      setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transition = "opacity 200ms ease";
        setTimeout(() => toast.remove(), 200);
      }, duration);
    },
  };

  window.SIPRO = window.SIPRO || {};
  window.SIPRO.navigateTo = navigateTo;
  window.SIPRO.Toast = Toast;

  /* ------------------------------------------------------------
     Init geral
  ------------------------------------------------------------ */
  document.addEventListener("DOMContentLoaded", () => {
    window.SIPRO.UsuariosModule.init();
    // A tela inicial é o dashboard; a tela de usuários carrega ao ser acessada.
  });
})();
