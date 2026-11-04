// Botão Sair: coloque o atributo data-sair no elemento e inclua este arquivo.
document.addEventListener('click', async (e) => {
  const el = e.target.closest('[data-sair]');
  if (!el) return;
  e.preventDefault();
  try { await fetch('/api/logout', { method: 'POST' }); } catch (_) {}
  location.replace('/');
});
