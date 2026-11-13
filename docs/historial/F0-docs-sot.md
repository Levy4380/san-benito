# FEATURE FASE F0 — Docs SoT (new-design + parity professional-surgeries)

**Depende de:** —
**Prohibido en esta fase:** Rutas, controllers, UI producto, Sidebar runtime, tests Feature (salvo que un test de docs lea strings — preferir no tocar tests aquí).

## Objetivo

Alinear la fuente de verdad escrita con el brief Historial **antes** de mover código, y enmendar el pack sibling que aún documenta «4 hijos con Historial».

## Entregar

1. **`new-design.md`**
   - d14: post-login/`GET /admin` → `/admin/historial/turnos` (ya no `/admin/reservas`).
   - d36 (y menciones): catálogo admin turnos = `/admin/historial/turnos` (ex reservas); documentar `/admin/historial/cirugias`.
   - Tabla permisos: `appointments.catalog.view` → path historial turnos (y paths agenda staff que ya tenga); `surgeries.catalog.view` incluye historial cirugías.
   - Tabla rutas admin/professional: paths nuevos; `/admin/reservas` solo como redirect compat si se documenta.
   - Documentar `/profesional/historial/mis-turnos` y `/profesional/historial/mis-cirugias`.
   - Cirugías / Mis Cirugías: **sin** hijo Historial (workflow 3 + calendario).
   - Checklist / menciones residuales a `/admin/reservas` como lista viva → actualizar.
2. **`docs/professional-surgeries/COMMON.md`**
   - Decisión 13 (parity): forma **NUEVA** = workflow 3 hijos (pending/requested/approved) + grupo **Historial** portal (Mis turnos / Mis cirugías). **NO** «mismos 4 hijos con Historial» bajo Mis Cirugías.
3. **`docs/professional-surgeries/F3-ui-portal-list.md`**
   - CA/entregables: quitar «4 hijos + Historial» del grupo Mis Cirugías; referir Historial al grupo dedicado (paths `.../historial/mis-*`). Nota: F3 original puede marcarse enmendado / superseded en nav history child.

## Archivos a crear/modificar (esperados)

- `new-design.md`
- `docs/professional-surgeries/COMMON.md`
- `docs/professional-surgeries/F3-ui-portal-list.md`

## Criterios de aceptación

- [ ] Grep `new-design.md`: no presenta `/admin/reservas` como página de catálogo viva; sí `/admin/historial/turnos` (+ cirugías historial y paths professional).
- [ ] d14 apunta a `/admin/historial/turnos`.
- [ ] COMMON + F3 professional-surgeries: parity = 3 hijos workflow + grupo Historial; sin «4 hijos con Historial».
- [ ] Sin cambios de runtime PHP/JS de producto en esta fase.

## Fuera de alcance de esta fase

- Implementación de rutas/UI/nav runtime (F1+).

## Prompt corto para el subagente

Implementá SOLO F0 según este archivo + COMMON.md. Devolvé HANDOFF F0. Sin commit/PR.
