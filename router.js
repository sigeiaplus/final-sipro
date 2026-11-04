// Router do SIPRO+ (hash). Troca só o conteúdo de <main>, sem recarregar a página.
// Rota = #/nome. Sem rota válida, mostra o Início.
// Para criar uma página: private/paginas/<nome>.html + liberar em api/pagina.js
// + um link no menu com href="#/<nome>" e data-rota="<nome>".
(function () {
  'use strict';

  const main = document.querySelector('.main-content');
  if (!main) return;

  const inicioHtml = main.innerHTML; // conteúdo original do painel
  let sequencia = 0;

  function rotaAtual() {
    const m = location.hash.match(/^#\/([a-z0-9-]+)$/);
    return m ? m[1] : 'inicio';
  }

  function marcarMenu(rota) {
    document.querySelectorAll('.menu-item.is-active').forEach((el) => el.classList.remove('is-active'));
    const item = document.querySelector('.menu-item[data-rota="' + rota + '"]');
    if (!item) return;
    item.classList.add('is-active');
    const grupo = item.closest('.menu-group');
    document.querySelectorAll('.menu-group').forEach((g) => {
      const aberto = g === grupo;
      g.classList.toggle('is-open', aberto);
      const botao = g.querySelector('.menu-group__toggle');
      if (botao) botao.setAttribute('aria-expanded', String(aberto));
    });
  }

  function aviso(titulo, texto) {
    const t = document.createElement('h1');
    t.className = 'page-header__title';
    t.textContent = titulo;
    const p = document.createElement('p');
    p.textContent = texto;
    const cab = document.createElement('div');
    cab.className = 'page-header';
    cab.appendChild(t);
    main.replaceChildren(cab, p);
  }

  async function buscarPagina(rota) {
    const r = await fetch('/api/pagina?p=' + encodeURIComponent(rota), { credentials: 'same-origin' });
    if (r.status === 401) { location.replace('/'); return null; }
    if (r.status === 403) { aviso('Acesso negado', 'Você não tem acesso a esta área.'); return null; }
    if (r.status === 404) { aviso('Página não encontrada', 'Esta área ainda não está disponível.'); return null; }
    if (!r.ok) { aviso('Erro', 'Não foi possível carregar a página. Tente novamente.'); return null; }
    return r.text();
  }

  function carregarScript(caminho) {
    return new Promise((resolve) => {
      if (!/^\/?[a-z0-9\/_-]+\.js$/.test(caminho) || caminho.indexOf('..') !== -1) return resolve();
      if (document.querySelector('script[data-modulo="' + caminho + '"]')) return resolve();
      const s = document.createElement('script');
      s.src = caminho;
      s.dataset.modulo = caminho;
      s.onload = () => resolve();
      s.onerror = () => resolve();
      document.body.appendChild(s);
    });
  }

  async function ir() {
    const rota = rotaAtual();
    const minha = ++sequencia;
    marcarMenu(rota);

    if (rota === 'inicio') {
      main.innerHTML = inicioHtml;
      return;
    }

    const p = document.createElement('p');
    p.textContent = 'Carregando...';
    main.replaceChildren(p);

    let html;
    try { html = await buscarPagina(rota); } catch (e) { aviso('Sem conexão', 'Verifique sua internet e tente novamente.'); return; }
    if (minha !== sequencia || html === null) return;

    main.innerHTML = html;
    window.scrollTo(0, 0);

    // Página com lógica própria: <div data-script="modulos/x/x.js" data-iniciar="nomeDaFuncao">
    const raiz = main.querySelector('[data-script]');
    if (raiz) {
      await carregarScript(raiz.dataset.script);
      const fn = window.SIPRO_PAGINAS && window.SIPRO_PAGINAS[rota];
      if (minha === sequencia && typeof fn === 'function') fn(main);
    }
  }

  // Links href="#" (itens ainda sem página) não mudam a rota.
  document.addEventListener('click', (e) => {
    if (e.target.closest('a[href="#"]')) e.preventDefault();
  });

  window.addEventListener('hashchange', ir);
  ir();
})();
