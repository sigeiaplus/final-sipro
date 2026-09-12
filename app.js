/**
 * SIPRO+ — app.js
 * JavaScript Vanilla (ES6+), sem frameworks e sem dependências externas.
 *
 * Responsabilidades deste arquivo (Etapa: Layout Base / Shell):
 *   1. Toggle de recolhimento da Sidebar (desktop) e abertura em overlay (mobile)
 *   2. Menu sanfona (accordion) — apenas um grupo aberto por vez
 *   3. Busca instantânea no menu lateral (filtra itens e expande grupos correspondentes)
 *   4. Dropdown do menu de usuário (Perfil / Alternar Rede / Sair)
 *   5. Atalho de teclado Ctrl+K / Cmd+K para a busca global
 */

document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  /* ------------------------------------------------------------------
     Referências de elementos
  ------------------------------------------------------------------- */
  const appShell = document.getElementById("appShell");
  const sidebar = document.getElementById("sidebar");
  const sidebarNav = document.getElementById("sidebarNav");
  const sidebarBackdrop = document.getElementById("sidebarBackdrop");
  const sidebarToggleBtn = document.getElementById("sidebarToggleBtn");

  const menuSearchInput = document.getElementById("menuSearchInput");
  const menuGroups = sidebarNav.querySelectorAll(".menu-group");
  const menuItems = sidebarNav.querySelectorAll(".menu-item");

  const userMenu = document.getElementById("userMenu");
  const userMenuTrigger = document.getElementById("userMenuTrigger");

  const globalSearchBtn = document.getElementById("globalSearchBtn");

  /* ------------------------------------------------------------------
     1. TOGGLE DA SIDEBAR
     - Em telas largas (> 960px): recolhe/expande a largura da sidebar.
     - Em telas estreitas (<= 960px): abre a sidebar como overlay sobre o conteúdo.
  ------------------------------------------------------------------- */
  function isMobileViewport() {
    return window.matchMedia("(max-width: 960px)").matches;
  }

  function toggleSidebar() {
    if (isMobileViewport()) {
      const isOpen = appShell.classList.toggle("mobile-nav-open");
      sidebarToggleBtn.setAttribute("aria-expanded", String(isOpen));
    } else {
      const isCollapsed = appShell.classList.toggle("sidebar-collapsed");
      sidebarToggleBtn.setAttribute("aria-expanded", String(!isCollapsed));
    }
  }

  function closeMobileSidebar() {
    appShell.classList.remove("mobile-nav-open");
    sidebarToggleBtn.setAttribute("aria-expanded", "false");
  }

  sidebarToggleBtn.addEventListener("click", toggleSidebar);

  // Fecha a sidebar mobile ao clicar no backdrop
  sidebarBackdrop.addEventListener("click", closeMobileSidebar);

  // Fecha a sidebar mobile automaticamente ao navegar por um item de menu
  sidebarNav.addEventListener("click", (event) => {
    if (event.target.closest(".menu-item") && isMobileViewport()) {
      closeMobileSidebar();
    }
  });

  /* ------------------------------------------------------------------
     2. MENU SANFONA (ACCORDION)
     Regra: apenas um grupo pode permanecer aberto por vez.
     Ao abrir um novo grupo, o anterior é fechado (a transição suave
     é feita via CSS em grid-template-rows, ver style.css).
  ------------------------------------------------------------------- */
  function closeAllGroups(exceptGroup = null) {
    menuGroups.forEach((group) => {
      if (group !== exceptGroup) {
        group.classList.remove("is-open");
        const toggleBtn = group.querySelector(".menu-group__toggle");
        toggleBtn.setAttribute("aria-expanded", "false");
      }
    });
  }

  function openGroup(group) {
    group.classList.add("is-open");
    const toggleBtn = group.querySelector(".menu-group__toggle");
    toggleBtn.setAttribute("aria-expanded", "true");
  }

  function toggleGroup(group) {
    const wasOpen = group.classList.contains("is-open");

    // Fecha todos os outros grupos (comportamento sanfona)
    closeAllGroups(group);

    if (wasOpen) {
      group.classList.remove("is-open");
      group.querySelector(".menu-group__toggle").setAttribute("aria-expanded", "false");
    } else {
      openGroup(group);
    }
  }

  menuGroups.forEach((group) => {
    const toggleBtn = group.querySelector(".menu-group__toggle");
    toggleBtn.addEventListener("click", () => toggleGroup(group));
  });

  /* ------------------------------------------------------------------
     3. BUSCA INSTANTÂNEA NO MENU LATERAL
     Conforme o usuário digita:
       - Itens cujo texto/keywords não batem com o termo são ocultados.
       - Grupos sem nenhum item visível também são ocultados.
       - Grupos que possuem itens correspondentes são expandidos
         automaticamente para exibir o resultado.
     Ao limpar a busca, o estado original do menu é restaurado
     (todos os grupos fechados, exceto os que já estavam abertos).
  ------------------------------------------------------------------- */
  function normalizeText(text) {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, ""); // remove acentos
  }

  function itemMatchesSearch(item, term) {
    const label = normalizeText(item.textContent || "");
    const keywords = normalizeText(item.dataset.keywords || "");
    return label.includes(term) || keywords.includes(term);
  }

  function handleMenuSearch() {
    const rawTerm = menuSearchInput.value.trim();
    const term = normalizeText(rawTerm);

    // Busca vazia: restaura o menu ao estado padrão (tudo visível, sanfona fechada)
    if (!term) {
      menuItems.forEach((item) => item.classList.remove("is-hidden-by-search"));
      menuGroups.forEach((group) => group.classList.remove("is-hidden-by-search"));
      closeAllGroups();
      return;
    }

    menuGroups.forEach((group) => {
      const itemsInGroup = group.querySelectorAll(".menu-item");
      let groupHasMatch = false;

      itemsInGroup.forEach((item) => {
        const matches = itemMatchesSearch(item, term);
        item.classList.toggle("is-hidden-by-search", !matches);
        if (matches) groupHasMatch = true;
      });

      group.classList.toggle("is-hidden-by-search", !groupHasMatch);

      // Expande automaticamente o grupo que contém resultados
      if (groupHasMatch) {
        group.classList.add("is-open");
        group.querySelector(".menu-group__toggle").setAttribute("aria-expanded", "true");
      } else {
        group.classList.remove("is-open");
        group.querySelector(".menu-group__toggle").setAttribute("aria-expanded", "false");
      }
    });

    // Itens de nível único (fora de grupos, ex: "Início")
    document.querySelectorAll(".menu-top-level > li > .menu-item").forEach((item) => {
      const matches = itemMatchesSearch(item, term);
      item.classList.toggle("is-hidden-by-search", !matches);
    });
  }

  menuSearchInput.addEventListener("input", handleMenuSearch);

  /* ------------------------------------------------------------------
     4. DROPDOWN DO MENU DE USUÁRIO
  ------------------------------------------------------------------- */
  function openUserMenu() {
    userMenu.classList.add("is-open");
    userMenuTrigger.setAttribute("aria-expanded", "true");
  }

  function closeUserMenu() {
    userMenu.classList.remove("is-open");
    userMenuTrigger.setAttribute("aria-expanded", "false");
  }

  function toggleUserMenu(event) {
    event.stopPropagation();
    if (userMenu.classList.contains("is-open")) {
      closeUserMenu();
    } else {
      openUserMenu();
    }
  }

  userMenuTrigger.addEventListener("click", toggleUserMenu);

  // Fecha o dropdown ao clicar fora dele
  document.addEventListener("click", (event) => {
    if (!userMenu.contains(event.target)) {
      closeUserMenu();
    }
  });

  // Fecha o dropdown ao pressionar Esc
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeUserMenu();
    }
  });

  /* ------------------------------------------------------------------
     5. ATALHO DE TECLADO Ctrl+K / Cmd+K PARA BUSCA GLOBAL
  ------------------------------------------------------------------- */
  document.addEventListener("keydown", (event) => {
    const isSearchShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k";

    if (isSearchShortcut) {
      event.preventDefault();
      globalSearchBtn.focus();
      globalSearchBtn.classList.add("is-focused");
    }
  });

  globalSearchBtn.addEventListener("click", () => {
    // Ponto de extensão: abrir aqui o modal/painel de busca global (Etapa futura).
    globalSearchBtn.focus();
  });

  /* ------------------------------------------------------------------
     Reajuste ao redimensionar a janela:
     Se o usuário passar de mobile para desktop (ou vice-versa) com o
     menu aberto, garante que os estados de overlay/recolhido não
     fiquem inconsistentes entre os dois modos.
  ------------------------------------------------------------------- */
  window.addEventListener("resize", () => {
    if (!isMobileViewport()) {
      appShell.classList.remove("mobile-nav-open");
    }
  });
});
