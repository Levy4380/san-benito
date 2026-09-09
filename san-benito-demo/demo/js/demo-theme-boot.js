/* Synchronous boot: apply saved theme class before paint (include in <head>). */
(() => {
  if (/\/estable\//.test(location.pathname)) return;
  if (document.documentElement.classList.contains('track-estable')) return;
  try {
    if (sessionStorage.getItem('sb-demo-track') === 'estable') return;
  } catch (_) { /* ignore */ }

  const KEY = 'sb-demo-theme';
  const VALID = ['clinico', 'salud', 'lector', 'sereno', 'pizarra'];
  let id = 'clinico';
  try {
    const saved = localStorage.getItem(KEY);
    if (saved && VALID.includes(saved)) id = saved;
  } catch (_) { /* ignore */ }
  document.documentElement.classList.add(`theme-${id}`);
  document.documentElement.setAttribute('data-theme', id);
})();
