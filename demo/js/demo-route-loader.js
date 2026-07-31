(() => {
  const DELAY_MS = 900;

  function isEstable() {
    try {
      return sessionStorage.getItem('sb-demo-track') === 'estable'
        || document.body.classList.contains('demo-old')
        || document.body.classList.contains('site-estable');
    } catch (_) {
      return false;
    }
  }

  function ensure() {
    let root = document.getElementById('route-loader');
    if (root) return root;
    root = document.createElement('div');
    root.id = 'route-loader';
    root.className = 'route-loader';
    root.setAttribute('aria-hidden', 'true');
    root.innerHTML = `
      <div class="route-loader-track">
        <div class="route-loader-bar"></div>
      </div>
    `;
    document.body.appendChild(root);
    return root;
  }

  let pending = null;
  let token = 0;

  function startBar() {
    const root = ensure();
    const bar = root.querySelector('.route-loader-bar');
    root.classList.add('is-on');
    document.documentElement.classList.add('route-loading');
    root.setAttribute('aria-busy', 'true');
    bar.style.animation = 'none';
    void bar.offsetWidth;
    bar.style.animation = '';
    return root;
  }

  function stopBar(root) {
    root.classList.remove('is-on');
    document.documentElement.classList.remove('route-loading');
    root.removeAttribute('aria-busy');
  }

  function run(callback, { keep = false } = {}) {
    if (isEstable()) {
      callback();
      return;
    }

    const root = startBar();
    const my = ++token;
    if (pending) clearTimeout(pending);

    pending = setTimeout(() => {
      pending = null;
      if (my !== token) return;
      try {
        callback();
      } finally {
        if (!keep) stopBar(root);
      }
    }, DELAY_MS);
  }

  /** Full-page navigation: keep the bar until unload. */
  function navigate(href) {
    if (isEstable()) {
      location.href = href;
      return;
    }
    run(() => {
      location.href = href;
    }, { keep: true });
  }

  /** Login entry for the current demo channel (from site/ or portal/). */
  function loginHref() {
    try {
      if (sessionStorage.getItem('sb-demo-track') === 'pruebas') {
        return '../pruebas/index.html';
      }
    } catch (_) { /* ignore */ }
    return '../estable/index.html';
  }

  window.DemoRouteLoader = { run, navigate, loginHref, DELAY_MS };
})();
