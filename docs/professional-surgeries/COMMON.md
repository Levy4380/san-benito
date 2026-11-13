# FEATURE — Bloque común (professional-surgeries) — enmendado F0 Historial

Scratch pack sibling. **No** commitear salvo orden. Este archivo se **enmendó** en Historial F0 (2026-11-12): la parity de nav portal ya **no** es «mismos 4 hijos con Historial» bajo Mis Cirugías.

## Decisión 13 — Parity nav portal (forma NUEVA)

**Supersede** la forma vieja «Mis Cirugías = mismos 4 hijos que staff Cirugías (pending / requested / approved / **Historial**)».

**Forma NUEVA (cerrada):**

1. Grupo **Mis Cirugías** (portal) y **Cirugías** (staff): solo workflow **3 hijos** — `pending` / `requested` / `approved` — más el calendario del grupo. **Sin** hijo Historial (`section=history`) en `surgeryChildren`.
2. Grupo nav dedicado **Historial** (`permission: null`, sin href de grupo, hijos `RouteChild` con `href` + permission):
   - Portal: **Mis turnos** → `GET /profesional/historial/mis-turnos` (`own.agenda.view`); **Mis cirugías** → `GET /profesional/historial/mis-cirugias` (`own.surgeries.view`).
   - Staff: **Turnos** → `GET /admin/historial/turnos` (`appointments.catalog.view`); **Cirugías** → `GET /admin/historial/cirugias` (`surgeries.catalog.view`).
3. Redirects compat: `GET /admin/cirugias?section=history` → `/admin/historial/cirugias`; `GET /profesional/cirugias?section=history` → `/profesional/historial/mis-cirugias`.
4. SoT producto: `new-design.md` (d14, d36, d47, tablas permisos/rutas). Pack Historial: `docs/historial/`.

**NO** reintroducir «4 hijos con Historial» bajo Mis Cirugías / Cirugías.
