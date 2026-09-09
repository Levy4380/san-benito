(() => {
  const STORAGE_KEY = 'sb-demo-theme';
  const THEMES = [
    {
      id: 'clinico',
      label: 'Clínico',
      hint: 'Blanco clínico y azul. Línea actual del sistema.',
    },
    {
      id: 'salud',
      label: 'Salud verde',
      hint: 'Verde suave, bordes redondeados, sensación amable.',
    },
    {
      id: 'lector',
      label: 'Lector fácil',
      hint: 'Más contraste, tipografía legible y botones grandes.',
    },
    {
      id: 'sereno',
      label: 'Sereno',
      hint: 'Arena clara y acento océano, sombras suaves.',
    },
    {
      id: 'pizarra',
      label: 'Pizarra',
      hint: 'Gris azulado quieto, sin sombras, ultra minimal.',
    },
  ];

  const VALID = new Set(THEMES.map((t) => t.id));

  function readTheme() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && VALID.has(saved)) return saved;
    } catch (_) { /* ignore */ }
    return 'clinico';
  }

  function applyTheme(id) {
    const theme = VALID.has(id) ? id : 'clinico';
    const root = document.documentElement;
    THEMES.forEach((t) => root.classList.remove(`theme-${t.id}`));
    root.classList.add(`theme-${theme}`);
    root.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (_) { /* ignore */ }
    const select = document.getElementById('theme-picker-select');
    const meta = THEMES.find((t) => t.id === theme);
    if (select) {
      if (select.value !== theme) select.value = theme;
      if (meta) select.title = meta.hint;
    }
    const hint = document.getElementById('theme-picker-hint');
    if (hint) hint.textContent = meta ? meta.hint : '';
    return theme;
  }

  function isPruebasContext() {
    try {
      const track = sessionStorage.getItem('sb-demo-track');
      if (track === 'pruebas') return true;
      if (track === 'estable') return false;
    } catch (_) { /* ignore */ }
    if (document.body?.classList.contains('demo-old') || document.body?.classList.contains('site-estable')) {
      return false;
    }
    return /\/pruebas\//.test(location.pathname)
      || /demo-(paciente|doctor|admin)\.html$/.test(location.pathname);
  }

  function ensureChipHost() {
    let chip = document.querySelector('.demo-chip');
    if (!chip) {
      chip = document.createElement('div');
      chip.className = 'demo-chip demo-chip--theme-only';
      document.body.prepend(chip);
    }
    let bar = chip.querySelector('.demo-chip-bar');
    if (!bar) {
      bar = document.createElement('div');
      bar.className = 'demo-chip-bar';
      const toggle = chip.querySelector('.demo-chip-btn');
      if (toggle) {
        chip.insertBefore(bar, toggle);
        bar.appendChild(toggle);
      } else {
        chip.insertBefore(bar, chip.firstChild);
      }
    }
    return { chip, bar };
  }

  function ensurePicker() {
    if (!isPruebasContext()) return;
    if (document.getElementById('theme-picker')) return;
    const { bar } = ensureChipHost();
    const wrap = document.createElement('div');
    wrap.id = 'theme-picker';
    wrap.className = 'theme-picker';
    wrap.setAttribute('role', 'region');
    wrap.setAttribute('aria-label', 'Selector de diseño visual');
    wrap.innerHTML = `
      <label class="theme-picker-label" for="theme-picker-select">Diseño</label>
      <select id="theme-picker-select" title="">
        ${THEMES.map((t) => `<option value="${t.id}">${t.label}</option>`).join('')}
      </select>
      <p class="theme-picker-hint" id="theme-picker-hint" hidden></p>
    `;
    const toggle = bar.querySelector('.demo-chip-btn');
    if (toggle) bar.insertBefore(wrap, toggle);
    else bar.appendChild(wrap);
    const select = wrap.querySelector('#theme-picker-select');
    select.value = readTheme();
    select.addEventListener('change', () => applyTheme(select.value));
    applyTheme(select.value);
  }

  function boot() {
    if (!isPruebasContext()) {
      THEMES.forEach((t) => document.documentElement.classList.remove(`theme-${t.id}`));
      document.documentElement.removeAttribute('data-theme');
      return;
    }
    applyTheme(readTheme());
    ensurePicker();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  window.DemoTheme = { apply: applyTheme, read: readTheme, themes: THEMES };
})();
