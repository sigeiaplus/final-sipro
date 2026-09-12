/**
 * menu.js
 * Responsável por:
 *  - Busca instantânea no menu lateral (filtra categorias e itens)
 *  - Comportamento sanfona (accordion) das categorias
 *  - Colapso/expansão da sidebar (desktop)
 *  - Abertura/fechamento da sidebar em modo mobile
 */

(function () {
  "use strict";

  const appShell = document.getElementById("appShell");
  const sidebar = document.getElementById("sidebar");
  const sidebarNav = document.getElementById("sidebarNav");
  const menuSearchInput = document.getElementById("menuSearchInput");
  const sidebarToggleBtn = document.getElementById("sidebarToggleBtn");
  const mobileMenuBtn = document.getElementById("mobileMenuBtn");
  const sidebarBackdrop = document.getElementById("sidebarBackdrop");

  /* ------------------------------------------------------------
     Sanfona (accordion) das categorias
  ------------------------------------------------------------ */
  function initAccordion() {
    const labels = sidebarNav.querySelectorAll(".menu-category__label");

    labels.forEach((label) => {
      label.addEventListener("click", () => {
        const category = label.closest(".menu-category");
        const wasOpen = category.classList.contains("is-open");

        // Comportamento sanfona: fecha as outras ao abrir uma nova
        sidebarNav.querySelectorAll(".menu-category").forEach((cat) => {
          cat.classList.remove("is-open");
        });

        if (!wasOpen) {
          category.classList.add("is-open");
        }
      });
    });
  }

  /* ------------------------------------------------------------
     Busca instantânea no menu
  ------------------------------------------------------------ */
  function initMenuSearch() {
    menuSearchInput.addEventListener("input", () => {
      const term = normalize(menuSearchInput.value.trim());
      const categories = sidebarNav.querySelectorAll(".menu-category");

      if (!term) {
        // Restaura estado padrão
        categories.forEach((cat) => {
          cat.classList.remove("is-hidden");
          cat.querySelectorAll(".menu-item").forEach((item) => item.classList.remove("is-hidden"));
        });
        return;
      }

      categories.forEach((category) => {
        const items = category.querySelectorAll(".menu-item");
        let anyVisible = false;

        items.forEach((item) => {
          const keywords = normalize(item.dataset.keywords || "");
          const label = normalize(item.textContent || "");
          const matches = keywords.includes(term) || label.includes(term);

          item.classList.toggle("is-hidden", !matches);
          if (matches) anyVisible = true;
        });

        category.classList.toggle("is-hidden", !anyVisible);

        // Expande automaticamente categorias com resultado durante a busca
        if (anyVisible) {
          category.classList.add("is-open");
        }
      });
    });
  }

  function normalize(str) {
    return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  /* ------------------------------------------------------------
     Colapso da sidebar (desktop)
  ------------------------------------------------------------ */
  function initSidebarCollapse() {
    sidebarToggleBtn.addEventListener("click", () => {
      appShell.classList.toggle("sidebar-collapsed");
    });
  }

  /* ------------------------------------------------------------
     Sidebar em modo mobile (overlay)
  ------------------------------------------------------------ */
  function initMobileNav() {
    mobileMenuBtn.addEventListener("click", () => {
      appShell.classList.add("mobile-nav-open");
    });

    sidebarBackdrop.addEventListener("click", () => {
      appShell.classList.remove("mobile-nav-open");
    });

    // Fecha o menu mobile ao navegar para uma página
    sidebarNav.addEventListener("click", (e) => {
      if (e.target.closest(".menu-item")) {
        appShell.classList.remove("mobile-nav-open");
      }
    });
  }

  /* ------------------------------------------------------------
     Navegação entre páginas via data-page
  ------------------------------------------------------------ */
  function initMenuNavigation() {
    document.addEventListener("click", (e) => {
      const trigger = e.target.closest("[data-page]");
      if (!trigger) return;

      e.preventDefault();
      const pageId = trigger.dataset.page;
      window.SIPRO.navigateTo(pageId);

      // Atualiza item ativo no menu
      document.querySelectorAll(".menu-item").forEach((item) => item.classList.remove("is-active"));
      document.querySelectorAll(`.menu-item[data-page="${pageId}"]`).forEach((item) => item.classList.add("is-active"));
    });
  }

  function init() {
    initAccordion();
    initMenuSearch();
    initSidebarCollapse();
    initMobileNav();
    initMenuNavigation();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
