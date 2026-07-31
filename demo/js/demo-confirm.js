(() => {
  let root = null;
  let titleEl = null;
  let msgEl = null;
  let confirmBtn = null;
  let cancelBtn = null;
  let resolveAsk = null;
  let lastFocus = null;

  function ensure() {
    if (root && document.body.contains(root)) return root;
    root = document.createElement('div');
    root.className = 'confirm-modal';
    root.hidden = true;
    root.setAttribute('role', 'presentation');
    root.innerHTML = `
      <div class="confirm-modal__backdrop" data-confirm-dismiss></div>
      <div class="confirm-modal__dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-modal-title" aria-describedby="confirm-modal-msg">
        <h2 class="confirm-modal__title" id="confirm-modal-title"></h2>
        <p class="confirm-modal__msg" id="confirm-modal-msg"></p>
        <div class="confirm-modal__actions">
          <button type="button" class="btn btn-outline" data-confirm-cancel>Volver</button>
          <button type="button" class="btn" data-confirm-ok>Confirmar</button>
        </div>
      </div>
    `;
    document.body.appendChild(root);
    titleEl = root.querySelector('#confirm-modal-title');
    msgEl = root.querySelector('#confirm-modal-msg');
    confirmBtn = root.querySelector('[data-confirm-ok]');
    cancelBtn = root.querySelector('[data-confirm-cancel]');

    root.addEventListener('click', (e) => {
      if (e.target.closest('[data-confirm-dismiss]') || e.target.closest('[data-confirm-cancel]')) {
        close(false);
      } else if (e.target.closest('[data-confirm-ok]')) {
        close(true);
      }
    });

    document.addEventListener('keydown', (e) => {
      if (!root || root.hidden) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        close(false);
      } else if (e.key === 'Tab') {
        const focusables = [cancelBtn, confirmBtn];
        const i = focusables.indexOf(document.activeElement);
        if (e.shiftKey) {
          if (i <= 0) {
            e.preventDefault();
            confirmBtn.focus();
          }
        } else if (i === focusables.length - 1 || i < 0) {
          e.preventDefault();
          cancelBtn.focus();
        }
      }
    });

    return root;
  }

  function close(result) {
    if (!root || root.hidden) return;
    root.hidden = true;
    root.classList.remove('is-open', 'confirm-modal--danger');
    document.documentElement.classList.remove('confirm-open');
    const fn = resolveAsk;
    resolveAsk = null;
    if (lastFocus && typeof lastFocus.focus === 'function') {
      try { lastFocus.focus(); } catch (_) { /* ignore */ }
    }
    lastFocus = null;
    if (fn) fn(Boolean(result));
  }

  function ask(opts = {}) {
    ensure();
    if (resolveAsk) close(false);

    const title = opts.title || 'Confirmar';
    const message = opts.message || '¿Continuar?';
    const confirmLabel = opts.confirmLabel || 'Confirmar';
    const cancelLabel = opts.cancelLabel || 'Volver';
    const danger = Boolean(opts.danger);

    titleEl.textContent = title;
    msgEl.textContent = message;
    confirmBtn.textContent = confirmLabel;
    cancelBtn.textContent = cancelLabel;
    confirmBtn.classList.toggle('btn-danger', danger);
    confirmBtn.classList.toggle('btn', true);
    root.classList.toggle('confirm-modal--danger', danger);

    lastFocus = document.activeElement;
    root.hidden = false;
    document.documentElement.classList.add('confirm-open');
    requestAnimationFrame(() => root.classList.add('is-open'));
    (danger ? cancelBtn : confirmBtn).focus();

    return new Promise((resolve) => {
      resolveAsk = resolve;
    });
  }

  window.DemoConfirm = { ask };
})();
