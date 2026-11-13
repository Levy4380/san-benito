# FEATURE FASE F2 — Admin historial cirugías + redirect `?section=history`

**Depende de:** F0 (idealmente F1 ya movió landing; no bloqueante estricto)
**Prohibido en esta fase:** Quitar history de Sidebar (F5); portal mis-cirugías (F4); cambiar criterio SQL de `history`.

## Objetivo

Exponer el listado global `section=history` en `GET /admin/historial/cirugias` y redirigir el query string legacy.

## Entregar

1. Ruta `GET /admin/historial/cirugias` name `admin.historial.cirugias`, middleware `surgeries.catalog.view`.
2. Controller: reusar `AdminSurgeryService::paginate('history', …)` / render `Admin/Surgeries` con SECTIONS.history (acción dedicada que **fuerce** `section=history`, o index que ignore query y fije history en esta ruta).
3. En `Admin\SurgeryController@index` (ruta `/admin/cirugias`): si `section=history` → redirect a `admin.historial.cirugias` (preservar otros query params de filtros si aplica / razonable).
4. Default sections del index workflow siguen pending/requested/approved (history ya no es destino nav; redirect cubre bookmarks).
5. Actualizar tests que hacían `get('/admin/cirugias?section=history')` → assert redirect o nuevo path.

## Archivos a crear/modificar (esperados)

- `routes/web.php`
- `app/Http/Controllers/Admin/SurgeryController.php`
- Posible ajuste menor `Admin/Surgeries.tsx` si la ruta dedicada necesita props/basePath
- `tests/Feature/AdminSurgeriesTest.php` (y similares)

## Criterios de aceptación

- [ ] `GET /admin/historial/cirugias` ≡ ex history (mismo dataset/criterio service).
- [ ] `GET /admin/cirugias?section=history` → `/admin/historial/cirugias`.
- [ ] Permiso `surgeries.catalog.view`; sin permisos nuevos.
- [ ] Tests tocados + pint OK.

## Fuera de alcance de esta fase

- Sidebar; portal; turnos.

## Prompt corto para el subagente

Implementá SOLO F2 según este archivo + COMMON.md. Devolvé HANDOFF F2. Sin commit/PR.
