# FEATURE — Bloque común para subagentes (Historial)

Incluí este archivo íntegro en cada Task junto con `Fn-*.md` y el handoff previo.

## Contexto

- Repo: `san-benito` (Laravel 12 + Inertia + React + TS + Sail + yarn Classic 1.22.x).
- Rama esperada: `feature/historial` (desde la rama que ya tenga portal cirugías, hoy `feature/professional-surgeries`, o trabajar ahí si el humano lo indica). **No** commit/PR salvo orden humana. **Nunca** push sin consentimiento explícito.
- Analysis SoT: `docs/historial/FEATURE-historial-analysis.md`
- Pack: `docs/historial/` (scratch; **no** commitear).
- SoT producto: `new-design.md` (F0 lo enmienda). Visual: `design.md`.
- Pack sibling a enmendar (F0): `docs/professional-surgeries/COMMON.md` + `F3-ui-portal-list.md` — parity nav **NUEVA**.
- Convenciones: `AGENTS.md` / `CLAUDE.md` — Sail obligatorio; yarn Classic; **prohibido** `"packageManager"` en `package.json`; no inventar decisiones.

## Decisiones CERRADAS (no reabrir)

1. Historial = **SOLO pasado**. Turnos: `Appointment::past()` (`starts_at <= now()`, `orderByDesc`). Cirugías: criterio existente `section=history` (no reinventar).
2. Rutas exactas:
   - `GET /admin/historial/turnos`
   - `GET /admin/historial/cirugias`
   - `GET /profesional/historial/mis-turnos`
   - `GET /profesional/historial/mis-cirugias`
3. `/admin/reservas` **no** es lista viva: solo redirect → `/admin/historial/turnos`.
4. `GET /admin` → `/admin/historial/turnos` (d14 actualizado).
5. Redirects: `GET /admin/cirugias?section=history` → `/admin/historial/cirugias`; `GET /profesional/cirugias?section=history` → `/profesional/historial/mis-cirugias`.
6. Named routes preferidos: `admin.historial.turnos`, `admin.historial.cirugias`, `professional.historial.mis-turnos`, `professional.historial.mis-cirugias`.
7. Futuros turnos professional: **solo** Mi agenda. No `/profesional/reservas` ni catálogo upcoming portal.
8. Futuros turnos admin: **no** reintroducir catálogo Reservas upcoming.
9. Cirugías futuras: workflow pending/requested/approved + calendario; **sin** hijo Historial en esos grupos.
10. Nav Historial = patrón **Administración** (grupo `permission: null`, sin href de grupo, hijos `RouteChild` con `href` + permission). **NO** `SurgeryChild (?section=)`.
11. `surgeryChildren`: solo pending / requested / approved (quitar history).
12. Permisos (no crear nuevos):
    - admin turnos historial → `appointments.catalog.view`
    - admin cirugías historial → `surgeries.catalog.view`
    - portal mis-turnos → `own.agenda.view`
    - portal mis-cirugías → `own.surgeries.view`
13. Privacidad portal: queries **siempre** scoped al Professional del actor; 403 sin ficha.
14. Sin Cancelar en historial turnos (D5).
15. Conservar filtros d36/d41 en admin historial turnos.
16. Parity professional-surgeries **NUEVA:** workflow 3 hijos + grupo Historial (Mis turnos / Mis cirugías). **NO** «4 hijos con Historial».

## Out de alcance

- `/paciente/mis-turnos/historial` (d33).
- Approve/request/reject/cancel cirugías en portal; solape; dar `catalog.*` a professional.
- Hub `?section=turnos|cirugias`.
- Paths `/profesional/historial/turnos` o `/profesional/historial/cirugias`.
- `packageManager` / npm / Yarn 4 / corepack enable.
- Push a remoto.

## Open (defaults temporales OK; no inventar política)

- Rama base si portal cirugías no está en `main`: default `feature/historial` desde WIP portal o continuar en esa rama.
- Título PageHeader: «Historial de turnos» / «Historial de cirugías» OK; labels nav «Turnos» / «Cirugías» / «Mis turnos» / «Mis cirugías».
- `admin.appointments.index`: puede quedar como redirect o alias; preferir named nuevos + redirect desde `/admin/reservas`.
- Limpiar `surgeryNavCounts.history` del shared props: opcional si no rompe tipos; no bloquear.

## Reglas del subagente

1. SOLO tu fase (`Fn-*.md`). No implementar fases siguientes “de yapa”.
2. Gates: `./vendor/bin/sail artisan test` (tests tocados), `composer pint` si PHP; `./vendor/bin/sail yarn build` + `yarn lint` si JS.
3. Sin commit/PR/push salvo orden explícita del humano.
4. STOP ante decisión de negocio no cerrada.
5. Devolvé HANDOFF al final (formato abajo).
6. No tocar `docs/historial/` salvo que el orquestador lo pida. F0 **sí** enmienda `docs/professional-surgeries/COMMON.md` + `F3` y `new-design.md`.
7. Leer paths reales antes de inventar nombres. Patrón nav: grupo `administracion` en `Sidebar.tsx`.
8. No reintroducir lista viva en `/admin/reservas`.

## Formato HANDOFF

```markdown
## HANDOFF F{n}
- Status: done | blocked
- Archivos tocados: …
- Contratos públicos: …
- Cómo verificar CA: …
- Stubs: …
- Blockers: …
- Notas para F{n+1}: …
```

## Handoff previo

{{HANDOFF_PREVIO}}
