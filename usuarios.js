/**
 * usuarios.js
 * Tela de listagem e cadastro de Usuários da Rede.
 *  - Tabela com busca, filtro por situação e por perfil
 *  - Ordenação por coluna
 *  - Paginação client-side
 *  - Modal de cadastro/edição com validação de campos
 *  - Ações de linha: editar, ativar/inativar, excluir
 */

(function () {
  "use strict";

  const Api = () => window.SIPRO.Api;
  const Toast = () => window.SIPRO.Toast;

  const PAGE_SIZE = 5;

  const state = {
    all: [],
    filtered: [],
    page: 1,
    sortKey: "nome",
    sortDir: "asc",
    editingId: null,
  };

  /* ------------------------------------------------------------
     Elementos DOM
  ------------------------------------------------------------ */
  const els = {};

  function cacheDom() {
    els.tableBody = document.getElementById("userTableBody");
    els.emptyState = document.getElementById("userEmptyState");
    els.resultsCount = document.getElementById("userResultsCount");
    els.searchInput = document.getElementById("userSearchInput");
    els.statusFilter = document.getElementById("userStatusFilter");
    els.roleFilter = document.getElementById("userRoleFilter");
    els.paginationInfo = document.getElementById("paginationInfo");
    els.paginationPages = document.getElementById("paginationPages");
    els.btnNovo = document.getElementById("btnNovoUsuario");

    els.modalOverlay = document.getElementById("userModalOverlay");
    els.modalTitle = document.getElementById("userModalTitle");
    els.modalCloseBtn = document.getElementById("userModalCloseBtn");
    els.modalCancelBtn = document.getElementById("userModalCancelBtn");
    els.form = document.getElementById("userForm");
    els.togglePasswordBtn = document.getElementById("togglePasswordBtn");

    els.fieldNome = document.getElementById("fieldNome");
    els.fieldCpf = document.getElementById("fieldCpf");
    els.fieldEmail = document.getElementById("fieldEmail");
    els.fieldSenha = document.getElementById("fieldSenha");
    els.fieldPerfil = document.getElementById("fieldPerfil");
    els.fieldSituacao = document.getElementById("fieldSituacao");
    els.fieldCep = document.getElementById("fieldCep");
    els.fieldLogradouro = document.getElementById("fieldLogradouro");
    els.fieldNumero = document.getElementById("fieldNumero");
    els.fieldBairro = document.getElementById("fieldBairro");
    els.fieldCidade = document.getElementById("fieldCidade");
    els.fieldUf = document.getElementById("fieldUf");
  }

  /* ------------------------------------------------------------
     Labels auxiliares
  ------------------------------------------------------------ */
  const PERFIL_LABELS = {
    super_admin: "Super Admin",
    gestor_rede: "Gestor da Rede",
    operador: "Operador",
  };

  function initials(nome) {
    return nome
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0])
      .join("")
      .toUpperCase();
  }

  /* ------------------------------------------------------------
     Carregamento e renderização da listagem
  ------------------------------------------------------------ */
  async function loadUsuarios() {
    const { data } = await Api().listUsuarios({
      q: els.searchInput.value.trim(),
      situacao: els.statusFilter.value,
      perfil: els.roleFilter.value,
    });

    state.all = data;
    state.filtered = data;
    state.page = 1;
    applySort();
    render();
  }

  function applySort() {
    const { sortKey, sortDir } = state;
    state.filtered = [...state.filtered].sort((a, b) => {
      const va = (a[sortKey] || "").toString().toLowerCase();
      const vb = (b[sortKey] || "").toString().toLowerCase();
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }

  function render() {
    renderTable();
    renderPagination();
    els.resultsCount.textContent = `${state.filtered.length} usuário${state.filtered.length === 1 ? "" : "s"} encontrado${state.filtered.length === 1 ? "" : "s"}`;
  }

  function renderTable() {
    const start = (state.page - 1) * PAGE_SIZE;
    const pageItems = state.filtered.slice(start, start + PAGE_SIZE);

    els.tableBody.innerHTML = "";
    els.emptyState.classList.toggle("hidden", pageItems.length > 0);

    pageItems.forEach((usuario) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>
          <div class="user-cell">
            <div class="avatar" style="width:32px;height:32px;font-size:11px;">${initials(usuario.nome)}</div>
            <div>
              <div class="user-cell__name">${escapeHtml(usuario.nome)}</div>
              <div class="user-cell__email">${escapeHtml(usuario.email)}</div>
            </div>
          </div>
        </td>
        <td>${escapeHtml(usuario.cpf)}</td>
        <td><span class="badge badge-role">${PERFIL_LABELS[usuario.perfil] || usuario.perfil}</span></td>
        <td>
          <span class="badge ${usuario.situacao === "ativo" ? "badge-success" : "badge-danger"}">
            ${usuario.situacao === "ativo" ? "Ativo" : "Inativo"}
          </span>
        </td>
        <td>
          <div class="row-actions">
            <button class="icon-btn" title="Editar" data-action="edit" data-id="${usuario.id}">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M13.5 3.5a1.7 1.7 0 0 1 2.4 2.4L7 14.8l-3 .7.7-3 8.8-9Z"/></svg>
            </button>
            <button class="icon-btn" title="${usuario.situacao === "ativo" ? "Inativar" : "Ativar"}" data-action="toggle" data-id="${usuario.id}">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="10" cy="10" r="7"/><path d="M10 6v4l2.5 2.5"/></svg>
            </button>
            <button class="icon-btn" title="Excluir" data-action="delete" data-id="${usuario.id}">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M5 6h10M8 6V4.5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1V6M6 6l.6 9a1 1 0 0 0 1 .9h4.8a1 1 0 0 0 1-.9L14 6"/></svg>
            </button>
          </div>
        </td>
      `;
      els.tableBody.appendChild(tr);
    });
  }

  function renderPagination() {
    const totalPages = Math.max(1, Math.ceil(state.filtered.length / PAGE_SIZE));
    const start = state.filtered.length === 0 ? 0 : (state.page - 1) * PAGE_SIZE + 1;
    const end = Math.min(state.page * PAGE_SIZE, state.filtered.length);

    els.paginationInfo.textContent = `Mostrando ${start}–${end} de ${state.filtered.length}`;
    els.paginationPages.innerHTML = "";

    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement("button");
      btn.textContent = i;
      btn.type = "button";
      btn.className = i === state.page ? "is-active" : "";
      btn.addEventListener("click", () => {
        state.page = i;
        render();
      });
      els.paginationPages.appendChild(btn);
    }
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str ?? "";
    return div.innerHTML;
  }

  /* ------------------------------------------------------------
     Filtros e ordenação — listeners
  ------------------------------------------------------------ */
  function initFilters() {
    let debounceTimer;
    els.searchInput.addEventListener("input", () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(loadUsuarios, 250);
    });

    els.statusFilter.addEventListener("change", loadUsuarios);
    els.roleFilter.addEventListener("change", loadUsuarios);

    document.querySelectorAll("th.sortable").forEach((th) => {
      th.addEventListener("click", () => {
        const key = th.dataset.sort;
        if (state.sortKey === key) {
          state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
        } else {
          state.sortKey = key;
          state.sortDir = "asc";
        }
        applySort();
        render();
      });
    });
  }

  /* ------------------------------------------------------------
     Ações de linha (editar / ativar-inativar / excluir)
  ------------------------------------------------------------ */
  function initRowActions() {
    els.tableBody.addEventListener("click", async (e) => {
      const btn = e.target.closest("[data-action]");
      if (!btn) return;

      const id = Number(btn.dataset.id);
      const action = btn.dataset.action;
      const usuario = state.all.find((u) => u.id === id);
      if (!usuario) return;

      if (action === "edit") {
        openModal(usuario);
      }

      if (action === "toggle") {
        await Api().toggleSituacao(id);
        Toast().show(
          `${usuario.nome.split(" ")[0]} foi ${usuario.situacao === "ativo" ? "inativado" : "ativado"}.`,
          "success"
        );
        loadUsuarios();
      }

      if (action === "delete") {
        if (confirm(`Excluir o usuário "${usuario.nome}"? Esta ação não pode ser desfeita.`)) {
          await Api().deleteUsuario(id);
          Toast().show("Usuário excluído com sucesso.", "success");
          loadUsuarios();
        }
      }
    });
  }

  /* ------------------------------------------------------------
     Modal de cadastro / edição
  ------------------------------------------------------------ */
  function openModal(usuario = null) {
    state.editingId = usuario ? usuario.id : null;
    els.modalTitle.textContent = usuario ? "Editar Usuário da Rede" : "Novo Usuário da Rede";
    els.form.reset();
    clearErrors();

    // Senha só é obrigatória no cadastro
    els.fieldSenha.required = !usuario;
    els.fieldSenha.placeholder = usuario ? "Deixe em branco para manter a atual" : "Mínimo de 8 caracteres";

    if (usuario) {
      els.fieldNome.value = usuario.nome;
      els.fieldCpf.value = usuario.cpf;
      els.fieldEmail.value = usuario.email;
      els.fieldPerfil.value = usuario.perfil;
      els.fieldSituacao.value = usuario.situacao;

      const end = usuario.endereco || {};
      els.fieldCep.value = end.cep || "";
      els.fieldLogradouro.value = end.logradouro || "";
      els.fieldNumero.value = end.numero || "";
      els.fieldBairro.value = end.bairro || "";
      els.fieldCidade.value = end.cidade || "";
      els.fieldUf.value = end.uf || "";
    } else {
      els.fieldSituacao.value = "ativo";
    }

    els.modalOverlay.classList.add("is-open");
    document.body.style.overflow = "hidden";
    setTimeout(() => els.fieldNome.focus(), 50);
  }

  function closeModal() {
    els.modalOverlay.classList.remove("is-open");
    document.body.style.overflow = "";
    state.editingId = null;
  }

  function initModalControls() {
    els.btnNovo.addEventListener("click", () => openModal());
    els.modalCloseBtn.addEventListener("click", closeModal);
    els.modalCancelBtn.addEventListener("click", closeModal);

    els.modalOverlay.addEventListener("click", (e) => {
      if (e.target === els.modalOverlay) closeModal();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && els.modalOverlay.classList.contains("is-open")) {
        closeModal();
      }
    });

    els.togglePasswordBtn.addEventListener("click", () => {
      const isPassword = els.fieldSenha.type === "password";
      els.fieldSenha.type = isPassword ? "text" : "password";
    });

    // Máscaras simples
    els.fieldCpf.addEventListener("input", () => {
      els.fieldCpf.value = maskCpf(els.fieldCpf.value);
    });

    els.fieldCep.addEventListener("input", () => {
      els.fieldCep.value = maskCep(els.fieldCep.value);
    });
  }

  function maskCpf(value) {
    return value
      .replace(/\D/g, "")
      .slice(0, 11)
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }

  function maskCep(value) {
    return value
      .replace(/\D/g, "")
      .slice(0, 8)
      .replace(/(\d{5})(\d)/, "$1-$2");
  }

  /* ------------------------------------------------------------
     Validação e submissão do formulário
  ------------------------------------------------------------ */
  function clearErrors() {
    document.querySelectorAll(".form-field.has-error").forEach((el) => el.classList.remove("has-error"));
    document.querySelectorAll(".form-field input, .form-field select").forEach((el) => el.classList.remove("is-invalid"));
  }

  function setFieldError(input, hasError) {
    const wrap = input.closest(".form-field");
    wrap.classList.toggle("has-error", hasError);
    input.classList.toggle("is-invalid", hasError);
  }

  function isValidCpf(cpf) {
    const digits = cpf.replace(/\D/g, "");
    return digits.length === 11;
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function validateForm() {
    clearErrors();
    let valid = true;

    if (!els.fieldNome.value.trim()) {
      setFieldError(els.fieldNome, true);
      valid = false;
    }

    if (!isValidCpf(els.fieldCpf.value)) {
      setFieldError(els.fieldCpf, true);
      valid = false;
    }

    if (!els.fieldPerfil.value) {
      setFieldError(els.fieldPerfil, true);
      valid = false;
    }

    if (!isValidEmail(els.fieldEmail.value)) {
      setFieldError(els.fieldEmail, true);
      valid = false;
    }

    const isEditing = Boolean(state.editingId);
    const senha = els.fieldSenha.value;
    if (!isEditing && senha.length < 8) {
      setFieldError(els.fieldSenha, true);
      valid = false;
    } else if (isEditing && senha.length > 0 && senha.length < 8) {
      setFieldError(els.fieldSenha, true);
      valid = false;
    }

    return valid;
  }

  function buildPayload() {
    const payload = {
      nome: els.fieldNome.value.trim(),
      cpf: els.fieldCpf.value.trim(),
      email: els.fieldEmail.value.trim(),
      perfil: els.fieldPerfil.value,
      situacao: els.fieldSituacao.value || "ativo",
      endereco: {
        cep: els.fieldCep.value.trim(),
        logradouro: els.fieldLogradouro.value.trim(),
        numero: els.fieldNumero.value.trim(),
        bairro: els.fieldBairro.value.trim(),
        cidade: els.fieldCidade.value.trim(),
        uf: els.fieldUf.value,
      },
    };

    // Senha só é enviada se preenchida (evita sobrescrever no update)
    if (els.fieldSenha.value) {
      payload.senha = els.fieldSenha.value;
    }

    return payload;
  }

  function initFormSubmit() {
    els.form.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (!validateForm()) {
        Toast().show("Verifique os campos destacados no formulário.", "error");
        return;
      }

      const payload = buildPayload();
      const saveBtn = document.getElementById("userModalSaveBtn");
      saveBtn.disabled = true;
      saveBtn.textContent = "Salvando...";

      try {
        if (state.editingId) {
          await Api().updateUsuario(state.editingId, payload);
          Toast().show("Usuário atualizado com sucesso.", "success");
        } else {
          await Api().createUsuario(payload);
          Toast().show("Usuário cadastrado com sucesso.", "success");
        }
        closeModal();
        loadUsuarios();
      } catch (err) {
        Toast().show(err.message || "Erro ao salvar usuário.", "error");
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = "Salvar Usuário";
      }
    });
  }

  /* ------------------------------------------------------------
     Inicialização do módulo
  ------------------------------------------------------------ */
  function init() {
    cacheDom();
    initFilters();
    initRowActions();
    initModalControls();
    initFormSubmit();
  }

  window.SIPRO = window.SIPRO || {};
  window.SIPRO.UsuariosModule = {
    init,
    load: loadUsuarios,
  };
})();
