(() => {
  const OPEN_CLASS = 'is-open';
  let openPicker = null;

  function close(picker) {
    if (!picker) return;
    picker.classList.remove(OPEN_CLASS);
    const btn = picker.querySelector('.mock-picker-btn');
    if (btn) btn.setAttribute('aria-expanded', 'false');
    if (openPicker === picker) openPicker = null;
  }

  function closeAll() {
    document.querySelectorAll(`.mock-picker.${OPEN_CLASS}`).forEach(close);
  }

  function normalizeItems(items) {
    return (items || []).map((item) => {
      if (typeof item === 'string') return { value: item, label: item, meta: '' };
      return {
        value: String(item.value ?? ''),
        label: String(item.label ?? item.value ?? ''),
        meta: String(item.meta ?? ''),
      };
    }).filter((item) => item.value);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function applyValue(field, value) {
    if (field.tagName === 'SELECT') {
      const options = Array.from(field.options);
      const match = options.find((o) => o.value === value)
        || options.find((o) => o.textContent.trim() === value)
        || options.find((o) => o.textContent.trim().toLowerCase().includes(value.toLowerCase()));
      if (match) field.value = match.value;
      else field.value = value;
      field.dispatchEvent(new Event('change', { bubbles: true }));
      return;
    }
    field.value = value;
    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function filterItems(items, q) {
    const needle = q.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((item) =>
      item.label.toLowerCase().includes(needle)
      || item.value.toLowerCase().includes(needle)
      || item.meta.toLowerCase().includes(needle));
  }

  function renderList(listEl, items, field, picker) {
    if (!items.length) {
      listEl.innerHTML = '<li class="mock-picker-empty">Sin coincidencias</li>';
      return;
    }
    listEl.innerHTML = items.map((item, i) => `
      <li>
        <button type="button" class="mock-picker-option" data-idx="${i}">
          <span class="mock-picker-option-label">${escapeHtml(item.label)}</span>
          ${item.meta ? `<span class="mock-picker-option-meta">${escapeHtml(item.meta)}</span>` : ''}
        </button>
      </li>
    `).join('');
    listEl.querySelectorAll('.mock-picker-option').forEach((btn) => {
      btn.addEventListener('click', () => {
        const item = items[Number(btn.dataset.idx)];
        if (!item) return;
        applyValue(field, item.value);
        close(picker);
        field.focus();
      });
    });
  }

  function findPicker(field) {
    const host = field.closest('.field') || field.parentElement;
    return host ? host.querySelector('.mock-picker') : null;
  }

  function buildPicker(title) {
    const picker = document.createElement('div');
    picker.className = 'mock-picker';
    picker.innerHTML = `
      <button type="button" class="mock-picker-btn" aria-expanded="false" aria-haspopup="dialog" title="Datos de prueba">
        <span aria-hidden="true">?</span>
        <span class="sr-only">Ver datos de prueba</span>
      </button>
      <div class="mock-picker-pop" role="dialog" aria-label="${escapeHtml(title)}">
        <p class="mock-picker-title">${escapeHtml(title)}</p>
        <input type="search" class="mock-picker-search" placeholder="Buscar…" autocomplete="off" />
        <ul class="mock-picker-list"></ul>
      </div>
    `;
    return picker;
  }

  function bindPicker(picker, field) {
    if (picker.dataset.bound) return;
    picker.dataset.bound = '1';

    const btn = picker.querySelector('.mock-picker-btn');
    const search = picker.querySelector('.mock-picker-search');
    const list = picker.querySelector('.mock-picker-list');

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const willOpen = !picker.classList.contains(OPEN_CLASS);
      closeAll();
      if (!willOpen) return;
      picker.classList.add(OPEN_CLASS);
      btn.setAttribute('aria-expanded', 'true');
      openPicker = picker;
      search.value = '';
      renderList(list, picker._mockCatalog, field, picker);
      search.focus();
    });

    search.addEventListener('input', () => {
      renderList(list, filterItems(picker._mockCatalog, search.value), field, picker);
    });

    search.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        close(picker);
        btn.focus();
      }
    });
  }

  /**
   * Attach a searchable mock-data floater next to an input/select.
   * Idempotent: re-calling updates the catalog.
   */
  function attach(field, items, opts = {}) {
    if (!field || field.dataset.mockPicker === 'skip') return null;
    const catalog = normalizeItems(typeof items === 'function' ? items() : items);
    if (!catalog.length) return null;

    let picker = findPicker(field);
    if (!picker) {
      const title = opts.title || 'Datos de prueba';
      picker = buildPicker(title);
      const fieldEl = field.closest('.field');
      const label = fieldEl ? fieldEl.querySelector(':scope > label') : null;

      if (label) {
        let head = fieldEl.querySelector(':scope > .mock-picker-head');
        if (!head) {
          head = document.createElement('div');
          head.className = 'mock-picker-head';
          label.replaceWith(head);
          head.appendChild(label);
        }
        head.appendChild(picker);
      } else {
        const wrap = document.createElement('div');
        wrap.className = 'mock-picker-control';
        field.before(wrap);
        wrap.appendChild(field);
        wrap.appendChild(picker);
      }
      field.dataset.mockPicker = '1';
      bindPicker(picker, field);
    }

    picker._mockCatalog = catalog;
    const titleEl = picker.querySelector('.mock-picker-title');
    if (titleEl && opts.title) titleEl.textContent = opts.title;
    return picker;
  }

  function attachMany(pairs) {
    pairs.forEach((pair) => {
      let field = pair[0];
      const items = pair[1];
      const opts = pair[2];
      if (typeof field === 'string') field = document.getElementById(field);
      attach(field, items, opts);
    });
  }

  document.addEventListener('pointerdown', (e) => {
    if (!openPicker) return;
    if (e.target.closest('.mock-picker')) return;
    closeAll();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && openPicker) closeAll();
  });

  window.DemoMockPicker = { attach, attachMany, closeAll };
})();
