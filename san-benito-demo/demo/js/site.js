(() => {
  const PORTAL = {
    pruebas: {
      patient: '../portal/demo-paciente.html',
      doctor: '../portal/demo-doctor.html',
      admin: '../portal/demo-admin.html',
    },
    estable: {
      patient: '../portal/demo-paciente-old.html',
      doctor: '../portal/demo-doctor-old.html',
      admin: '../portal/demo-admin.html',
    },
  };

  function track() {
    return sessionStorage.getItem('sb-demo-track') || '';
  }

  if (track() === 'estable' || document.body.classList.contains('site-estable')) {
    document.documentElement.classList.add('track-estable');
  }

  function portalRole() {
    return sessionStorage.getItem('sb-demo-portal-role') || '';
  }

  function inSiteFolder() {
    return /\/site\//.test(location.pathname);
  }

  function homeHref() {
    const t = track() || 'estable';
    if (inSiteFolder()) {
      return t === 'pruebas' ? '../pruebas/home.html' : '../estable/home.html';
    }
    return 'home.html';
  }

  function go(href) {
    if (window.DemoRouteLoader) window.DemoRouteLoader.navigate(href);
    else location.href = href;
  }

  document.querySelectorAll('[data-home]').forEach((link) => {
    link.setAttribute('href', homeHref());
  });

  document.querySelectorAll('[data-portal]').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const t = track();
      const role = portalRole();
      const dest = PORTAL[t]?.[role];
      if (!dest) {
        go(window.DemoRouteLoader?.loginHref?.() || '../estable/index.html');
        return;
      }
      if (role === 'doctor' || role === 'admin') {
        sessionStorage.setItem('sb-demo-role', role);
      }
      const portalMsg = {
        patient: 'Abriste el portal de turnos.',
        doctor: 'Abriste el portal del doctor.',
        admin: 'Abriste el portal de admin.',
      };
      if (window.DemoToast) window.DemoToast.pending(portalMsg[role] || 'Abriste el portal.');
      else {
        try { sessionStorage.setItem('sb-demo-toast', portalMsg[role] || 'Abriste el portal.'); } catch (_) { /* ignore */ }
      }
      go(dest);
    });
  });

  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.site-menu-toggle');
  if (header && toggle) {
    toggle.addEventListener('click', () => {
      const open = header.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    header.querySelectorAll('.site-nav a').forEach((link) => {
      link.addEventListener('click', () => {
        header.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  const path = location.pathname.split('/').pop() || 'home.html';
  const homePaths = new Set(['home.html', '']);
  document.querySelectorAll('.site-nav a[data-nav]').forEach((link) => {
    const href = link.getAttribute('href');
    const isHomeNav = link.hasAttribute('data-home');
    const active = href === path || (isHomeNav && homePaths.has(path));
    if (active) {
      link.classList.add('is-active');
      link.setAttribute('aria-current', 'page');
    }
  });

  const ROLE_LABEL = {
    patient: 'paciente',
    doctor: 'doctor',
    admin: 'admin',
  };
  const roleLabel = document.getElementById('demo-role-label');
  if (roleLabel) {
    roleLabel.textContent = ROLE_LABEL[portalRole()] || 'sin rol';
  }

  const demoToggle = document.getElementById('demo-toggle');
  const demoPanel = document.getElementById('demo-panel');
  if (demoToggle && demoPanel) {
    demoToggle.addEventListener('click', () => {
      const open = demoPanel.classList.toggle('open');
      demoToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('pointerdown', (e) => {
      if (!e.target.closest('.demo-chip') && demoPanel.classList.contains('open')) {
        demoPanel.classList.remove('open');
        demoToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  const resetDemo = document.getElementById('reset-demo');
  if (resetDemo) {
    resetDemo.addEventListener('click', () => {
      sessionStorage.removeItem('sb-demo');
      sessionStorage.removeItem('sb-demo-old');
      sessionStorage.removeItem('sb-demo-role');
      sessionStorage.removeItem('sb-demo-track');
      sessionStorage.removeItem('sb-demo-portal-role');
      sessionStorage.removeItem('sb-demo-doctor');
      sessionStorage.removeItem('sb-demo-doctor-old');
      if (window.DemoToast) window.DemoToast.pending('Reiniciaste la demo.');
      go(window.DemoRouteLoader?.loginHref?.() || '../estable/index.html');
    });
  }
})();
