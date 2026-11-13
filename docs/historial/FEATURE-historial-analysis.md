# Informe de análisis — FEATURE Historial (admin + professional)

**Modo:** solo análisis (sin implementación de producto), salvo orden contraria.
**Ticket:** brief pegado 2026-11-12 (sin ID de tracker).
**Fecha:** 2026-11-12
**Rama actual al analizar:** `feature/professional-surgeries` (WIP portal cirugías).

## 1. Resumen de requisitos

### Must

1. Eliminar el catálogo vivo `GET /admin/reservas` (Inertia list). Sustituir por grupo nav **Historial** (solo pasado) en staff y portal.
2. **ADMIN**
   - `GET /admin/historial/turnos` — mueve UI/controller de ex-`/admin/reservas`; dataset **solo** `Appointment::past()`.
   - `GET /admin/historial/cirugias` — mueve UI de ex-`/admin/cirugias?section=history` (global).
   - `GET /admin/reservas` — **solo** redirect compat → `/admin/historial/turnos` (no lista).
   - `GET /admin` → redirect a `/admin/historial/turnos` (actualizar d14).
3. **PROFESSIONAL**
   - `GET /profesional/historial/mis-turnos` — NUEVO: appointments past del Professional del actor (`pastForProfessional`).
   - `GET /profesional/historial/mis-cirugias` — history scoped (ex `?section=history` portal).
4. **Regla temporal:** Historial = SOLO pasado. Futuros turnos professional solo en Mi agenda; futuros admin sin catálogo «Reservas» upcoming. Cirugías futuras siguen en workflow + calendario (sin hijo Historial bajo Cirugías/Mis Cirugías).
5. **NAV**
   - staff: borrar NavLink «Reservas»; grupo `historial` (permission null, sin href grupo) con RouteChild hrefs Turnos/Cirugías; `surgeryChildren` SIN history.
   - portal: grupo Historial (Mis turnos / Mis cirugías); Mis Cirugías workflow SIN Historial; `groupForPath` reconoce `/admin/historial*`, `/profesional/historial*`, cirugías*.
6. Redirects `?section=history` (admin + portal) → paths historial cirugías.
7. Named routes preferidos: `admin.historial.turnos`, `admin.historial.cirugias`, `professional.historial.mis-turnos`, `professional.historial.mis-cirugias`.
8. Permisos existentes (no crear): catalog appointments/surgeries; portal `own.agenda.view` / `own.surgeries.view`.
9. Docs: `new-design.md` + enmendar `docs/professional-surgeries/COMMON.md` + `F3` (parity = workflow 3 hijos + grupo Historial; **NO** «4 hijos con Historial»).
10. Tests + pint (+ lint JS). Sin push. Sin `packageManager`/npm/yarn4.

### Out

- `/paciente/mis-turnos/historial` (d33 intacto).
- Approve/request en portal; solape cirugías; `catalog.*` a professional.
- Reintroducir `/admin/reservas` como lista upcoming/mixed.
- Paths `/profesional/historial/turnos` o `.../cirugias` (deben ser `mis-turnos` / `mis-cirugias`).
- Hub único `?section=turnos|cirugias` mezclando dominios.
- Duplicar Historial bajo grupos Cirugías / Mis Cirugías.

### Open

- Rama base: el WIP de portal cirugías vive en `feature/professional-surgeries`. **Default:** `feature/historial` desde esa rama (o continuar sobre ella) porque mis-cirugías depende de controllers/UI portal ya existentes. No inventar merge a `main` si portal cirugías no está mergeado.
- Copy exacto de títulos PageHeader («Historial de turnos» vs «Turnos»): brief dice label nav «Turnos» / «Cirugías»; título de página puede ser «Historial de turnos» / «Historial de cirugías» alineado a d33 paciente — default OK.
- `admin.appointments.index`: alias al nuevo path **o** solo redirect; default preferido brief = named `admin.historial.turnos` + `/admin/reservas` redirect; `admin.home` apunta al nuevo named.

## 2. Estado actual del código (path:símbolo)

| Área | Evidencia |
|------|-----------|
| Landing admin | `routes/web.php` `admin.home` → `redirect()->route('admin.appointments.index')` (`/admin/reservas`) |
| Catálogo reservas vivo | `Route::get('/reservas', AdminAppointmentController@index)` + `Admin/Appointments.tsx` title «Reservas»; `AdminAppointmentService::paginate` **sin** `past()` (orderBy starts_at, mixed) |
| Scope past | `Appointment::scopePast` / `scopeUpcoming` ya existen |
| Patient historial | `AppointmentService::pastForPatient` + `GET /paciente/mis-turnos/historial` + `Appointments/History.tsx` |
| pastForProfessional | **no existe** |
| Admin surgeries history | `AdminSurgeryService::paginate('history')` + `Admin/Surgeries` SECTIONS.history + nav `surgeryChildren` incluye `{ section: 'history' }` |
| Portal surgeries | `Professional/SurgeryController` index con section incl. history; `Professional/Surgeries.tsx` tiene SECCIÓN Historial; tests hit `?section=history` |
| Sidebar staff | NavLink `/admin/reservas` «Reservas»; grupo cirugias con 4 hijos incl. Historial |
| Sidebar portal | grupo `mis-cirugias` con mismos `surgeryChildren` (4); **sin** grupo Historial turnos/cirugías |
| Patrón RouteChild | grupo `administracion` (permission null + children con `href` + permission) — **modelo a copiar** para Historial |
| Docs SoT | `new-design.md` d14/d36/tabla permisos/rutas/checklist aún dicen `/admin/reservas` |
| Pack sibling | `docs/professional-surgeries/COMMON.md` decisión 13 + F3 CA: «4 hijos con Historial» — **debe enmendarse** a forma NUEVA |

## 3. Trazabilidad ticket → código

| Requisito | Capas / módulos |
|-----------|-----------------|
| Admin historial turnos | `routes/web.php`; `Admin\AppointmentController`; `AdminAppointmentService` (+ `past()`); `Admin/Appointments.tsx` (copy Historial); middleware `appointments.catalog.view` |
| Admin historial cirugías | ruta nueva; `Admin\SurgeryController` acción o index forzado `history`; reuso `AdminSurgeryService::paginate('history')` / página Surgeries; `surgeries.catalog.view` |
| Redirects admin | `admin.home`; `GET /admin/reservas`; `GET /admin/cirugias?section=history` |
| Portal mis-turnos | ruta; controller (nuevo o Agenda/Appointment); `AppointmentService::pastForProfessional`; UI reuso/param `Appointments/History`; `own.agenda.view`; 403 sin ficha Professional |
| Portal mis-cirugías | ruta; `Professional\SurgeryController` history; UI OwnSurgeries; redirect `?section=history`; `own.surgeries.view`; queries scoped |
| Nav | `Sidebar.tsx` staffNav/portalNav/`surgeryChildren`/`groupForPath`/`groupIsCurrent`/`navFor` |
| Docs | `new-design.md`; `docs/professional-surgeries/COMMON.md` + `F3-ui-portal-list.md` |
| Tests | Auth redirect; ProductRequirements; AdminSurgeries history; ProfessionalSurgeries history; nuevos Feature historial |

## 4. Artefactos (Figma / OpenAPI / schemas)

| Artefacto | URL | Qué define (SoT) |
|-----------|-----|------------------|
| Brief usuario 2026-11-12 | (chat) | Rutas exactas, nav, permisos, out-of-scope |
| `new-design.md` | repo | d14, d33 (paciente), d36/d41 filtros, d47 cirugías, tablas permisos/rutas — **enmendar** paths reservas→historial |
| `design.md` | repo | Visual chrome; no inventar |
| `docs/professional-surgeries/*` | scratch | Parity nav portal; **enmendar** 4→3 hijos + grupo Historial |
| Ante contradicción | — | Brief de este pack + `new-design.md` enmendado ganan sobre COMMON viejo de professional-surgeries |

## 5. Decisiones cerradas

1. Historial = solo pasado (`Appointment::past()`; surgeries section `history` criterio existente).
2. `/admin/reservas` no es lista viva (solo redirect).
3. No catálogo upcoming admin ni `/profesional/reservas`.
4. Nav Historial = RouteChild con `href` (como Administración); **no** `SurgeryChild (?section=)`.
5. Cirugías / Mis Cirugías: 3 hijos workflow (pending/requested/approved) + calendario; sin Historial.
6. Sin permisos nuevos.
7. Pack orquestación en `docs/historial/` (scratch; no commitear).
8. No push.

## 6. Riesgos residuales

- Tests/docs aún anclan `/admin/reservas` y `?section=history` — hay que actualizar asserts y conservar redirects de compat.
- `navFor` filtra RouteChild por `child.permission`: hijos Historial deben llevar permission correcta o el grupo desaparece.
- Tras quitar `history` de `surgeryChildren`, counts `surgeryNavCounts.history` pueden quedar huérfanos en shared props — OK residual (no obligatorio limpiar en v1 de esta feature salvo que rompa tipos).
- Dependencia de WIP portal cirugías: sin `Professional\SurgeryController`, mis-cirugías no cierra.
- AdminAppointments hoy lista mixed; aplicar `past()` cambia dataset (tests de filtros/orden).

## 7. Fases propuestas

| Fase | Entrega | Depende |
|------|---------|---------|
| F0 | Docs SoT (`new-design` + enmendar professional-surgeries COMMON/F3) | — |
| F1 | Admin historial turnos + redirects `/admin`, `/admin/reservas` | F0 |
| F2 | Admin historial cirugías + redirect `?section=history` | F0 |
| F3 | Professional mis-turnos (`pastForProfessional` + UI) | F0 |
| F4 | Professional mis-cirugías + redirect portal history | F0 (ideal F2 patrón) |
| F5 | Sidebar nav + `groupForPath` (staff + portal) | F1–F4 rutas |
| F6 | Hardening: tests CA, pint, lint, grep criterios de hecho | F1–F5 |
