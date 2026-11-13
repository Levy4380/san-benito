# FEATURE FASE F1 — Admin historial turnos + redirects landing/reservas

**Depende de:** F0
**Prohibido en esta fase:** Sidebar nav completo (F5); historial cirugías (F2); portal mis-turnos/mis-cirugías (F3–F4); reintroducir lista upcoming en `/admin/reservas`.

## Objetivo

Mover el catálogo admin de reservas a `/admin/historial/turnos` con dataset **solo** `past()`, y dejar `/admin/reservas` + `GET /admin` como redirects.

## Entregar

1. **Rutas** (`routes/web.php`):
   - `GET /admin/historial/turnos` → `Admin\AppointmentController@index` (o acción dedicada), name `admin.historial.turnos`, middleware `appointments.catalog.view`.
   - `GET /admin/reservas` → **redirect** a `admin.historial.turnos` (compat). Si se conserva name `admin.appointments.index`, que sea el redirect o alias — no Inertia.
   - `GET /admin` (`admin.home`) → redirect a `admin.historial.turnos`.
2. **`AdminAppointmentService::paginate`**: aplicar `Appointment::past()` (reemplazar orderBy mixed). Conservar filtros professional/patient/specialty/date (d36/d41).
3. **UI** `Admin/Appointments.tsx`: copy Historial (ya no «Reservas» como catálogo vivo); sin Cancelar (D5). Filtros intactos.
4. Tests mínimos tocados que asertaban `/admin/reservas` como OK Inertia / landing → nuevo path o redirect (dejar suite verde en lo tocado).

## Archivos a crear/modificar (esperados)

- `routes/web.php`
- `app/Http/Controllers/Admin/AppointmentController.php`
- `app/Services/AdminAppointmentService.php`
- `resources/js/Pages/Admin/Appointments.tsx`
- Tests Feature que hit `/admin`, `/admin/reservas`, Auth redirect (p.ej. `AdminSurgeriesTest`, ProductRequirements, Auth)

## Criterios de aceptación

- [ ] `Route::get('/reservas')` **no** renderiza Inertia (solo redirect).
- [ ] `GET /admin/historial/turnos` lista solo past; filtros d36/d41 siguen.
- [ ] `GET /admin` y `GET /admin/reservas` → `/admin/historial/turnos`.
- [ ] Named `admin.historial.turnos` existe.
- [ ] `sail artisan test` (archivos tocados) + `composer pint` OK.

## Fuera de alcance de esta fase

- Nav Sidebar; historial cirugías; portal.

## Prompt corto para el subagente

Implementá SOLO F1 según este archivo + COMMON.md. Devolvé HANDOFF F1. Sin commit/PR.
