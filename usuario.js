// Mostra no topo (menu do usuário) o nome, as iniciais e o perfil de quem está logado.
(function () {
  'use strict';

  const PERFIS = {
    super_admin: 'Super Admin',
    admin: 'Administrador',
    usuario: 'Usuário',
  };

  const elNome = document.getElementById('userName');
  const elAvatar = document.getElementById('userAvatar');
  const elPerfil = document.getElementById('userRole');
  if (!elNome || !elAvatar || !elPerfil) return;

  function iniciais(nome) {
    const partes = String(nome || '').trim().split(/\s+/).filter(Boolean);
    if (!partes.length) return '?';
    const primeira = partes[0][0];
    const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
    return (primeira + ultima).toUpperCase();
  }

  function mostrar(usuario) {
    elNome.textContent = usuario.nome || 'Usuário';
    elAvatar.textContent = iniciais(usuario.nome);
    elPerfil.textContent = PERFIS[usuario.perfil] || usuario.perfil || '';
  }

  fetch('/api/me', { credentials: 'same-origin' })
    .then((r) => {
      if (r.status === 401) { location.replace('/'); return null; }
      return r.ok ? r.json() : null;
    })
    .then((dados) => {
      if (dados && dados.usuario) mostrar(dados.usuario);
      else if (dados !== null) elNome.textContent = 'Usuário';
    })
    .catch(() => { elNome.textContent = 'Usuário'; });
})();
