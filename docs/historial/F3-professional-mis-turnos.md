# FEATURE FASE F3 — Professional historial mis-turnos

**Depende de:** F0
**Prohibido en esta fase:** Sidebar grupo Historial (F5); mis-cirugías (F4); catálogo upcoming; inventar permiso nuevo.

## Objetivo

Listar appointments **past** del Professional del actor en `GET /profesional/historial/mis-turnos`.

## Entregar

1. `AppointmentService::pastForProfessional(Professional $professional)` espejo de `pastForPatient` (`forProfessional` + `past()` + eager loads razonables).
2. Ruta `GET /profesional/historial/mis-turnos` name `professional.historial.mis-turnos`, middleware `own.agenda.view`.
3. Controller (nuevo thin o método en Agenda/Appointment professional): resuelve Professional del actor; **403** si no hay ficha; Inertia page.
4. UI: reusar/parametrizar `Appointments/History` (o página portal equivalente). `backHref` agenda o sin back según chrome portal existente — no inventar chrome nuevo.
5. Queries siempre scoped; sin Cancelar.
6. Tests Feature: professional ve solo los suyos past; otro rol / sin ficha 403; patient 403.

## Archivos a crear/modificar (esperados)

- `app/Services/AppointmentService.php`
- `routes/web.php` (prefix profesional)
- Controller professional (p.ej. `Professional\AppointmentHistoryController` o similar — nombre real al gusto del repo)
- `resources/js/Pages/Appointments/History.tsx` y/o `Professional/…`
- `tests/Feature/…` (nuevo o extensión)

## Criterios de aceptación

- [ ] Path exacto `/profesional/historial/mis-turnos` (no `.../turnos`).
- [ ] Solo past del professional del actor.
- [ ] Permiso `own.agenda.view`; 403 sin Professional.
- [ ] Tests + pint (+ lint si JS).

## Fuera de alcance de esta fase

- Nav; cirugías; admin.

## Prompt corto para el subagente

Implementá SOLO F3 según este archivo + COMMON.md. Devolvé HANDOFF F3. Sin commit/PR.
