(() => {
  const KEY = 'sb-demo-toast';
  let host = null;

  function ensureHost() {
    if (host && document.body.contains(host)) return host;
    host = document.getElementById('toast-host');
    if (!host) {
      host = document.createElement('div');
      host.id = 'toast-host';
      host.className = 'toast-host';
      host.setAttribute('aria-live', 'polite');
      host.setAttribute('aria-relevant', 'additions');
      document.body.appendChild(host);
    }
    return host;
  }

  function show(msg, opts = {}) {
    if (!msg) return;
    const ms = opts.ms ?? 3400;
    const variant = opts.variant || 'info';
    const root = ensureHost();
    const el = document.createElement('div');
    el.className = `toast toast--${variant}`;
    el.setAttribute('role', 'status');
    el.textContent = msg;
    root.appendChild(el);
    requestAnimationFrame(() => el.classList.add('is-visible'));
    window.setTimeout(() => {
      el.classList.remove('is-visible');
      el.classList.add('is-hiding');
      window.setTimeout(() => el.remove(), 240);
    }, ms);
  }

  function pending(msg) {
    try {
      sessionStorage.setItem(KEY, msg);
    } catch (_) { /* ignore */ }
  }

  function consumePending() {
    let msg = '';
    try {
      msg = sessionStorage.getItem(KEY) || '';
      if (msg) sessionStorage.removeItem(KEY);
    } catch (_) { /* ignore */ }
    if (msg) show(msg);
  }

  window.DemoToast = { show, pending, consumePending };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', consumePending);
  } else {
    consumePending();
  }
})();
