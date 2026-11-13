# FEATURE FASE F5 — Sidebar: grupo Historial + surgeryChildren sin history

**Depende de:** F1–F4 (rutas nuevas deben existir)
**Prohibido en esta fase:** Reintroducir NavLink «Reservas»; poner Historial como `SurgeryChild`; hub `?section=turnos|cirugias`; permisos nuevos.

## Objetivo

Nav staff/portal alineada al brief; active state en prefijos historial y cirugías.

## Entregar

1. **`surgeryChildren`**: quitar `{ section: 'history', label: 'Historial' }` — quedan pending / requested / approved.
2. **`staffNav`**:
   - Borrar NavLink «Reservas» (`/admin/reservas`).
   - Grupo `id: 'historial'`, label «Historial», `permission: null`, **sin** `href` de grupo, icono razonable (p.ej. ClipboardList u otro ya importado):
     - Turnos → `/admin/historial/turnos` (`AppointmentsCatalogView`)
     - Cirugías → `/admin/historial/cirugias` (`SurgeriesCatalogView`)
   - Grupo Cirugías: `surgeryChildren` sin history (workflow 3 + calendario href intacto).
3. **`portalNav`**:
   - Grupo Historial (`id` p.ej. `historial-portal`), `permission: null`, sin href grupo:
     - Mis turnos → `/profesional/historial/mis-turnos` (`OwnAgendaView`)
     - Mis cirugías → `/profesional/historial/mis-cirugias` (`OwnSurgeriesView`)
   - Mis Cirugías: label «Mis Cirugías», href calendario portal, hijos SIN Historial.
4. **`groupForPath` / `groupIsCurrent` / active**: reconocer `/admin/historial*`, `/profesional/historial*`, `/admin/cirugias*`, `/profesional/cirugias*`.
5. `navFor` ya filtra RouteChild por permission — hijos Historial **deben** llevar `permission` (como Administración).
6. `surgerySection`: deja de tratar `history` como section activa de lista workflow (history ya no vive en `?section=` nav). Redirects F2/F4 cubren URLs viejas.
7. Lint JS.

## Archivos a crear/modificar (esperados)

- `resources/js/Components/Layout/Sidebar.tsx`
- Posible ajuste tipos `SurgerySection` si `history` sigue en pages dedicadas (mantener en types si las páginas historial cirugías aún lo usan como section prop)

## Criterios de aceptación

- [ ] Staff: no label «Reservas»; sí grupo Historial → Turnos/Cirugías (hrefs correctos).
- [ ] Portal: grupo Historial → Mis turnos / Mis cirugías; Mis Cirugías sin hijo Historial.
- [ ] Cirugías staff sin hijo Historial.
- [ ] Active/open group en paths historial y cirugías.
- [ ] `yarn lint` / build OK.

## Fuera de alcance de esta fase

- Backend; docs (ya F0); suite Feature completa (F6).

## Prompt corto para el subagente

Implementá SOLO F5 según este archivo + COMMON.md. Devolvé HANDOFF F5. Sin commit/PR.
