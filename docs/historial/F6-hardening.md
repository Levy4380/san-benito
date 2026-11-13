# FEATURE FASE F6 — Hardening

**Depende de:** F0–F5
**Prohibido en esta fase:** Scope creep (upcoming catálogo, permisos nuevos, patient historial, push).

## Objetivo

Cerrar calidad: matriz CA del brief, tests, pint, lint/build JS, grep de criterios de hecho.

## Matriz CA

- [ ] Grep rutas vivas: no hay `Route::get('/reservas')` que renderice Inertia (solo redirect).
- [ ] Sidebar staff: no label «Reservas»; sí grupo Historial → Turnos/Cirugías.
- [ ] `/admin/historial/turnos`: solo past; `/admin/historial/cirugias` ≡ ex history.
- [ ] `/profesional/historial/mis-turnos` y `.../mis-cirugias` existen, scoped, solo pasado.
- [ ] `/admin` y post-login admin → `/admin/historial/turnos`.
- [ ] Redirects compat `/admin/reservas` y `?section=history` (ambos prefijos).
- [ ] Docs (`new-design` + professional-surgeries COMMON/F3) alineados.
- [ ] Sin paths `/profesional/historial/turnos` ni `.../cirugias` (deben ser mis-*).
- [ ] Sin Historial duplicado bajo Cirugías/Mis Cirugías.
- [ ] Sin `packageManager` en `package.json`.

## Gates

```bash
./vendor/bin/sail artisan test   # mínimo: Auth redirect, ProductRequirements, AdminSurgeries, ProfessionalSurgeries, tests nuevos historial
composer pint
./vendor/bin/sail yarn build
./vendor/bin/sail yarn lint
```

## Entregar

1. Tests Feature actualizados/nuevos cubriendo rutas, redirects, scopes, 403, nav-sensitive asserts si existen.
2. Pint + lint/build verdes en lo tocado.
3. Handoff final con residuales (si `surgeryNavCounts.history` quedó huérfano, documentarlo).

## Handoff final

Checklist DoD + residuales abiertos. **No** push. **No** commit salvo orden humana.

## Prompt corto para el subagente

Implementá SOLO F6 según este archivo + COMMON.md. Devolvé HANDOFF F6. Sin commit/PR.
