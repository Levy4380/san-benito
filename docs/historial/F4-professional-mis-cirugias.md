# FEATURE FASE F4 — Professional historial mis-cirugías + redirect history

**Depende de:** F0 (patrón F2); requiere controllers portal cirugías existentes
**Prohibido en esta fase:** Approve/request portal; catalog.view a professional; Sidebar (F5); paths sin prefijo `mis-`.

## Objetivo

History scoped del portal en ruta dedicada; bookmarks `?section=history` redirigen.

## Entregar

1. Ruta `GET /profesional/historial/mis-cirugias` name `professional.historial.mis-cirugias`, middleware `own.surgeries.view`.
2. Acción que fuerce `paginate('history', …, $professional->id)` (scoped). Si `Professional/Surgeries.tsx` es stub parcial, mínimo usable RO para history.
3. En `Professional\SurgeryController@index`: `section=history` → redirect a `professional.historial.mis-cirugias`.
4. Privacidad: nunca listar cirugías de otros professionals.
5. Actualizar tests `ProfessionalSurgeriesTest` que usan `?section=history`.

## Archivos a crear/modificar (esperados)

- `routes/web.php`
- `app/Http/Controllers/Professional/SurgeryController.php` (+ posible History action)
- `resources/js/Pages/Professional/Surgeries.tsx` (o página dedicada)
- `tests/Feature/ProfessionalSurgeriesTest.php`

## Criterios de aceptación

- [ ] Path exacto `/profesional/historial/mis-cirugias`.
- [ ] Dataset ≡ ex `?section=history` scoped.
- [ ] Redirect desde `/profesional/cirugias?section=history`.
- [ ] Permiso `own.surgeries.view`; sin permisos nuevos.
- [ ] Tests + pint (+ lint si JS).

## Fuera de alcance de esta fase

- Nav; mis-turnos; admin turnos.

## Prompt corto para el subagente

Implementá SOLO F4 según este archivo + COMMON.md. Devolvé HANDOFF F4. Sin commit/PR.
