(() => {
  const MQ = '(max-width: 767px)';
  /** Snap fractions: collapsed | full */
  const SNAPS = [0.18, 0.82];
  const DEFAULT_SNAP = SNAPS[0];

  let draggingPanel = null;

  function isMobile() {
    return window.matchMedia(MQ).matches;
  }

  function agendaOf(panel) {
    return panel.closest('.agenda');
  }

  function ensureHandle(panel) {
    let handle = panel.querySelector(':scope > .sheet-handle');
    if (!handle) {
      handle = document.createElement('button');
      handle.type = 'button';
      handle.className = 'sheet-handle';
      handle.setAttribute('aria-label', 'Expandir panel');
      panel.insertBefore(handle, panel.firstChild);
    }
    if (!handle.querySelector('.sheet-handle-caret')) {
      handle.innerHTML = '<span class="sheet-handle-caret" aria-hidden="true"></span>';
    }
    return handle;
  }

  function syncSheetLevel(panel, fraction) {
    const snap = nearestSnap(fraction);
    panel.dataset.sheetSnap = String(snap);
    const collapsed = Math.abs(snap - SNAPS[0]) < 0.02;
    const expanded = Math.abs(snap - SNAPS[1]) < 0.02;
    panel.classList.toggle('is-sheet-collapsed', collapsed);
    panel.classList.toggle('is-sheet-expanded', expanded);
    const handle = panel.querySelector(':scope > .sheet-handle');
    if (handle) {
      handle.setAttribute('aria-label', collapsed ? 'Expandir panel' : 'Comprimir panel');
    }
  }

  function applyHeight(panel, fraction, { animate = true } = {}) {
    const agenda = agendaOf(panel);
    if (!agenda || !isMobile()) return;
    if (draggingPanel === panel) return;

    const snap = nearestSnap(fraction);
    const max = Math.max(agenda.clientHeight, 1);
    const px = Math.round(max * snap);
    syncSheetLevel(panel, snap);
    panel.style.setProperty('--sheet-h', `${px}px`);

    if (animate) {
      panel.classList.remove('is-sheet-dragging');
    } else {
      panel.classList.add('is-sheet-dragging');
      requestAnimationFrame(() => {
        if (draggingPanel !== panel) panel.classList.remove('is-sheet-dragging');
      });
    }
  }

  function nearestSnap(fraction) {
    return SNAPS.reduce((best, snap) => (
      Math.abs(snap - fraction) < Math.abs(best - fraction) ? snap : best
    ));
  }

  function nextSnap(current) {
    const idx = SNAPS.findIndex((s) => Math.abs(s - current) < 0.02);
    if (idx < 0) return DEFAULT_SNAP;
    return SNAPS[(idx + 1) % SNAPS.length];
  }

  function clearSheet(panel) {
    panel.style.removeProperty('--sheet-h');
    panel.classList.remove('is-sheet-dragging', 'is-sheet-collapsed', 'is-sheet-expanded');
  }

  function currentSnap(panel) {
    return Number(panel.dataset.sheetSnap) || DEFAULT_SNAP;
  }

  function restore(panel) {
    if (!isMobile()) {
      clearSheet(panel);
      return;
    }
    applyHeight(panel, currentSnap(panel), { animate: false });
  }

  function bind(panel) {
    panel.classList.add('is-sheet');
    ensureHandle(panel);

    if (panel.dataset.sheetBound === '1') {
      restore(panel);
      return;
    }
    panel.dataset.sheetBound = '1';

    let moved = false;
    let startY = 0;
    let startH = 0;

    panel.addEventListener('pointerdown', (e) => {
      if (!isMobile() || (e.button != null && e.button !== 0)) return;
      const handle = e.target.closest('.sheet-handle');
      if (!handle || !panel.contains(handle)) return;

      draggingPanel = panel;
      moved = false;
      startY = e.clientY;
      startH = panel.getBoundingClientRect().height;
      panel.classList.add('is-sheet-dragging');
      handle.setPointerCapture?.(e.pointerId);
      e.preventDefault();
    });

    panel.addEventListener('pointermove', (e) => {
      if (draggingPanel !== panel) return;
      const agenda = agendaOf(panel);
      if (!agenda) return;
      const dy = startY - e.clientY;
      if (Math.abs(dy) > 6) moved = true;
      const max = agenda.clientHeight;
      const next = Math.min(max * 0.88, Math.max(max * 0.11, startH + dy));
      panel.style.setProperty('--sheet-h', `${Math.round(next)}px`);
    });

    const endDrag = () => {
      if (draggingPanel !== panel) return;
      draggingPanel = null;
      panel.classList.remove('is-sheet-dragging');
      const agenda = agendaOf(panel);
      if (!agenda || !isMobile()) return;
      const fraction = panel.getBoundingClientRect().height / Math.max(agenda.clientHeight, 1);
      applyHeight(panel, fraction, { animate: true });
    };

    panel.addEventListener('pointerup', endDrag);
    panel.addEventListener('pointercancel', endDrag);

    panel.addEventListener('click', (e) => {
      const handle = e.target.closest('.sheet-handle');
      if (!handle || !panel.contains(handle) || !isMobile()) return;
      if (moved) {
        moved = false;
        e.preventDefault();
        return;
      }
      applyHeight(panel, nextSnap(currentSnap(panel)), { animate: true });
    });

    const mo = new MutationObserver(() => {
      ensureHandle(panel);
      restore(panel);
    });
    mo.observe(panel, { childList: true });

    restore(panel);
  }

  function scan() {
    document.querySelectorAll('.agenda > .panel').forEach(bind);
  }

  function onViewportChange() {
    document.querySelectorAll('.agenda > .panel.is-sheet').forEach(restore);
  }

  const boot = () => {
    scan();
    new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
  };

  if (document.body) boot();
  else document.addEventListener('DOMContentLoaded', boot);

  window.matchMedia(MQ).addEventListener('change', onViewportChange);
  window.addEventListener('resize', onViewportChange);
})();
