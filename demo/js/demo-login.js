(() => {
  const HOME = {
    pruebas: 'home.html',
    estable: 'home.html',
  };

  const STORAGE_PATIENT = {
    pruebas: 'sb-demo',
    estable: 'sb-demo-old',
  };

  const track = document.body.getAttribute('data-track') || 'estable';

  document.querySelectorAll('[data-role]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const role = btn.getAttribute('data-role');
      const home = HOME[track];
      if (!role || !home) return;

      sessionStorage.setItem('sb-demo-track', track);
      sessionStorage.setItem('sb-demo-portal-role', role);

      if (role === 'patient') {
        const key = STORAGE_PATIENT[track] || 'sb-demo-old';
        let data = {};
        try {
          data = JSON.parse(sessionStorage.getItem(key) || '{}') || {};
        } catch (_) { /* ignore */ }
        sessionStorage.setItem(key, JSON.stringify({
          ...data,
          authed: true,
          role: 'patient',
          route: 'home',
        }));
      } else {
        sessionStorage.setItem('sb-demo-role', role);
      }

      const greet = {
        patient: 'Entraste como paciente.',
        doctor: 'Entraste como doctor.',
        admin: 'Entraste como admin.',
      };
      if (window.DemoToast) window.DemoToast.pending(greet[role] || 'Sesión iniciada.');
      else {
        try { sessionStorage.setItem('sb-demo-toast', greet[role] || 'Sesión iniciada.'); } catch (_) { /* ignore */ }
      }

      if (window.DemoRouteLoader) window.DemoRouteLoader.navigate(home);
      else location.href = home;
    });
  });
})();
