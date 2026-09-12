/**
 * api.js
 * Camada de integração com a API REST do SIPRO+.
 *
 * Multi-tenancy:
 *   Toda requisição inclui automaticamente o `rede_id` da rede ativa,
 *   seja via header (X-Rede-Id) e/ou querystring, dependendo do endpoint.
 *   O backend deve validar o rede_id do token contra o recurso solicitado.
 *
 * Autenticação:
 *   Espera um Bearer token (Firebase Auth / SIGEA AUTH) salvo em
 *   localStorage/sessionStorage pela camada de login do ecossistema SIGEA.
 *
 * IMPORTANTE:
 *   Este arquivo hoje roda em modo MOCK (dados fake em memória) para permitir
 *   o desenvolvimento da interface sem depender do backend pronto.
 *   Basta trocar USE_MOCK para false e apontar API_BASE_URL para a API real.
 */

(function () {
  "use strict";

  const API_BASE_URL = "https://api.sipro.sigea.app/v1"; // ajustar para o endpoint real
  const USE_MOCK = true;

  /* ------------------------------------------------------------
     Contexto de tenant / sessão (viria do login / seletor de rede)
  ------------------------------------------------------------ */
  const Session = {
    getRedeId() {
      return localStorage.getItem("sipro_rede_id") || "1";
    },
    getToken() {
      return localStorage.getItem("sipro_token") || "";
    },
  };

  /* ------------------------------------------------------------
     Cliente HTTP genérico
  ------------------------------------------------------------ */
  async function request(path, { method = "GET", body = null, params = {} } = {}) {
    const url = new URL(API_BASE_URL + path);

    // Injeta rede_id como querystring por padrão (multi-tenant)
    url.searchParams.set("rede_id", Session.getRedeId());
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, value);
      }
    });

    const headers = {
      "Content-Type": "application/json",
      "X-Rede-Id": Session.getRedeId(),
    };

    const token = Session.getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url.toString(), {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.message || `Erro na requisição (${response.status})`);
    }

    if (response.status === 204) return null;
    return response.json();
  }

  /* ------------------------------------------------------------
     MOCK — dados em memória (usado enquanto USE_MOCK = true)
  ------------------------------------------------------------ */
  const mockDb = {
    usuarios: [
      { id: 1, rede_id: "1", nome: "Ana Paula da Silva", cpf: "111.222.333-44", email: "ana.silva@rede.edu.br", perfil: "gestor_rede", situacao: "ativo", endereco: { cep: "39400-000", logradouro: "Rua das Flores", numero: "120", bairro: "Centro", cidade: "Montes Claros", uf: "MG" } },
      { id: 2, rede_id: "1", nome: "Carlos Eduardo Souza", cpf: "222.333.444-55", email: "carlos.souza@rede.edu.br", perfil: "operador", situacao: "ativo", endereco: { cep: "39400-010", logradouro: "Av. Brasil", numero: "45", bairro: "São José", cidade: "Montes Claros", uf: "MG" } },
      { id: 3, rede_id: "1", nome: "Fernanda Lima Costa", cpf: "333.444.555-66", email: "fernanda.lima@rede.edu.br", perfil: "super_admin", situacao: "ativo", endereco: { cep: "39400-020", logradouro: "Rua Minas Gerais", numero: "78", bairro: "Ibituruna", cidade: "Montes Claros", uf: "MG" } },
      { id: 4, rede_id: "1", nome: "João Pedro Almeida", cpf: "444.555.666-77", email: "joao.almeida@rede.edu.br", perfil: "operador", situacao: "inativo", endereco: { cep: "39400-030", logradouro: "Rua Goiás", numero: "12", bairro: "Todos os Santos", cidade: "Montes Claros", uf: "MG" } },
      { id: 5, rede_id: "1", nome: "Mariana Rocha Oliveira", cpf: "555.666.777-88", email: "mariana.rocha@rede.edu.br", perfil: "gestor_rede", situacao: "ativo", endereco: { cep: "39400-040", logradouro: "Rua Bahia", numero: "301", bairro: "Vila Brasil", cidade: "Montes Claros", uf: "MG" } },
      { id: 6, rede_id: "1", nome: "Ricardo Nunes Ferreira", cpf: "666.777.888-99", email: "ricardo.nunes@rede.edu.br", perfil: "operador", situacao: "ativo", endereco: { cep: "39400-050", logradouro: "Rua Pernambuco", numero: "9", bairro: "Major Prates", cidade: "Montes Claros", uf: "MG" } },
      { id: 7, rede_id: "1", nome: "Juliana Martins Dias", cpf: "777.888.999-00", email: "juliana.martins@rede.edu.br", perfil: "operador", situacao: "inativo", endereco: { cep: "39400-060", logradouro: "Rua Ceará", numero: "56", bairro: "Delfino Magalhães", cidade: "Montes Claros", uf: "MG" } },
    ],
    nextId: 8,
  };

  function mockDelay(ms = 300) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  const MockApi = {
    async listUsuarios({ q = "", situacao = "", perfil = "" } = {}) {
      await mockDelay();
      const redeId = Session.getRedeId();
      let results = mockDb.usuarios.filter((u) => u.rede_id === redeId);

      if (q) {
        const term = q.toLowerCase();
        results = results.filter(
          (u) =>
            u.nome.toLowerCase().includes(term) ||
            u.cpf.replace(/\D/g, "").includes(term.replace(/\D/g, "")) ||
            u.email.toLowerCase().includes(term)
        );
      }

      if (situacao) {
        results = results.filter((u) => u.situacao === situacao);
      }

      if (perfil) {
        results = results.filter((u) => u.perfil === perfil);
      }

      return { data: results, total: results.length };
    },

    async createUsuario(payload) {
      await mockDelay();
      const novo = {
        id: mockDb.nextId++,
        rede_id: Session.getRedeId(),
        situacao: "ativo",
        ...payload,
      };
      mockDb.usuarios.push(novo);
      return novo;
    },

    async updateUsuario(id, payload) {
      await mockDelay();
      const idx = mockDb.usuarios.findIndex((u) => u.id === id);
      if (idx === -1) throw new Error("Usuário não encontrado.");
      mockDb.usuarios[idx] = { ...mockDb.usuarios[idx], ...payload };
      return mockDb.usuarios[idx];
    },

    async deleteUsuario(id) {
      await mockDelay();
      const idx = mockDb.usuarios.findIndex((u) => u.id === id);
      if (idx === -1) throw new Error("Usuário não encontrado.");
      mockDb.usuarios.splice(idx, 1);
      return true;
    },

    async toggleSituacao(id) {
      await mockDelay();
      const usuario = mockDb.usuarios.find((u) => u.id === id);
      if (!usuario) throw new Error("Usuário não encontrado.");
      usuario.situacao = usuario.situacao === "ativo" ? "inativo" : "ativo";
      return usuario;
    },
  };

  /* ------------------------------------------------------------
     API pública — alterna entre mock e chamadas reais
  ------------------------------------------------------------ */
  const Api = {
    Session,

    /** Lista usuários da rede ativa. Suporta busca e filtros. */
    listUsuarios(filters) {
      if (USE_MOCK) return MockApi.listUsuarios(filters);
      return request("/usuarios", { method: "GET", params: filters });
    },

    /** Cria um novo usuário vinculado à rede ativa (rede_id injetado automaticamente). */
    createUsuario(payload) {
      if (USE_MOCK) return MockApi.createUsuario(payload);
      return request("/usuarios", { method: "POST", body: payload });
    },

    /** Atualiza um usuário existente. */
    updateUsuario(id, payload) {
      if (USE_MOCK) return MockApi.updateUsuario(id, payload);
      return request(`/usuarios/${id}`, { method: "PUT", body: payload });
    },

    /** Remove um usuário. */
    deleteUsuario(id) {
      if (USE_MOCK) return MockApi.deleteUsuario(id);
      return request(`/usuarios/${id}`, { method: "DELETE" });
    },

    /** Ativa/inativa rapidamente (ação de linha na tabela). */
    toggleSituacao(id) {
      if (USE_MOCK) return MockApi.toggleSituacao(id);
      return request(`/usuarios/${id}/toggle-situacao`, { method: "PATCH" });
    },
  };

  window.SIPRO = window.SIPRO || {};
  window.SIPRO.Api = Api;
})();
