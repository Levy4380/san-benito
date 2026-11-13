# Cirugías

Gestor de staff (`/admin/cirugias`) y portal del professional (`/profesional/cirugias`), aparte de Reservas. La demo `demo/cirugias/cirugias-diseno-v1.html` manda la UI staff, con dos deltas: el estado **Solicitada** y **Particular** que no pasa por pendiente. El portal espeja chrome/nav/headers de staff (parity); no reutiliza la demo HTML.

La entidad es `Professional` (tabla `professionals`, rol `professional`, FK `professional_id`). No existe Doctor ni el rol `doctor`.

## Cobertura (se decide en el alta)

El CTA **Solicitar cirugía** abre un modal sobre la lista. No navega. `GET /admin/cirugias/crear` responde JSON (`professionals`, `healthInsurances`), sin página Inertia. Éxito redirige a la sección que corresponda y cierra el modal. Volver / Escape / click afuera cierran. Error de validación deja el modal abierto.

Formulario: paciente, obra social, profesional, nota. Sin horario.

- Obra social = `health_insurance_id` de `health_insurances`. El select arranca en la obra actual del paciente (`patient_health_insurance`, 0..1) y se puede cambiar a otra obra o a Particular. Guardar la cirugía no escribe `patient_health_insurance`.
- Particular = `health_insurance_id` null. No es fila del catálogo.
- Particular → `to_schedule`. Redirect a `section=approved`.
- Obra social → `pending`. Redirect a `section=pending`.

## Estados (solo hacia adelante)

| UI | Código | Label |
|---|---|---|
| Pendiente | `pending` | Pendiente de aprobación |
| Solicitada | `requested` | Solicitada |
| A programar | `to_schedule` | A programar |
| Programada | `scheduled` | Programada |

- `pending` → `requested`. Solo con `health_insurance_id` no null. Botón «Marcar como solicitada». No hay llamada a la obra social.
- `requested` → `to_schedule`. Botón «Aprobar». El confirm dice que pasa a «A programar» y sigue sin horario. `starts_at` y `ends_at` siguen null.
- `to_schedule` → `scheduled`. Botón «Programar». Exige `starts_at` y `ends_at`.
- Prohibido aprobar desde `pending`. Prohibido programar desde `pending` o `requested`.
- No hay rechazo, cancelación, baja, edición de nota ni reprogramación.

## Actores

Dos brazos en `Permission::forRole`. No hay `surgeries.manage`. No hay `own.surgeries.request` ni `own.surgeries.approve`. Patient no tiene permisos de cirugías. No hay páginas bajo `/paciente`.

**Staff** (`$staff`: admin y super_admin) — catálogo institucional:

- `surgeries.catalog.view`
- `surgeries.create`
- `surgeries.request`
- `surgeries.approve`
- `surgeries.schedule`

En alta staff: `professional_id` obligatorio (el admin lo elige; es quien «solicita»); `requested_by_user_id` = user que crea la fila. No se escribe `professional_patient` ni `patient_health_insurance`.

**Professional** (portal propio) — solo `own.surgeries.*`:

- `own.surgeries.view`
- `own.surgeries.create`
- `own.surgeries.schedule`

Sin `surgeries.catalog.view` ni `surgeries.create|request|approve|schedule` en el rol professional. El professional **nunca** marca solicitada, aprueba, rechaza, cancela, edita nota ni reprograma.

En alta portal («Solicitar cirugía» = `SurgeryService::request`, no `markRequested`): `professional_id` = Professional del actor (ignorar body); `requested_by_user_id` = actor; 403 sin ficha professional. Pacientes solo del pivote `professional_patient`; sin vínculo → 422; el alta **no** escribe pivote ni `patient_health_insurance`. Pending y requested son solo lectura; approved permite Programar; historial RO.

## Calendario

Un solo recurso. Solape si `a.starts_at < b.ends_at` y `b.starts_at < a.ends_at`, en toda la institución, sin mirar el profesional. Tocar el extremo no es solape. No consulta `availability_windows`, `appointments` ni `slot_duration_minutes`. No hay `surgery_windows`.

Ayuda visual 07:00–21:00; si una programada cae afuera, la línea se estira. Duración mínima 30 minutos. Time24, step 5. Fin posterior al inicio, mismo día. Inicio futuro en hora de pared (`APP_TIMEZONE=America/Argentina/Buenos_Aires`, sin sufijo Z).

Programar abre el calendario (no un modal), día = mañana, primer hueco o 09:00–10:00, días pasados deshabilitados. Vista previa verde si libre, roja si solapa. Cancelar vuelve a la lista con el detalle abierto. Guardar en transacción con `lockForUpdate` de las `scheduled` de ese día. Choque → 422.

La vista calendario sin programar también muestra días pasados. Tonos: 0 sin cirugías, 1–2 con cirugías, ≥3 «3 o más».

## Lista (staff)

Padre «Cirugías» en `staffNav`, después de Reservas. Grupo: `href` → `/admin/cirugias/calendario`. Hijos, todos con `surgeries.catalog.view` y contador:

- Pendientes → `pending`. Cirugías de obra social que todavía no se solicitaron a la obra social. `id` descendente.
- Solicitadas → `requested`. Enviadas a la obra social; la respuesta se carga a mano. `id` descendente.
- Aprobadas → `to_schedule`, o `scheduled` con `ends_at > now`. Primero las a programar; separador «Programadas» solo si hay alguna; después por `starts_at`.
- Historial → `scheduled` con `ends_at <= now`, `starts_at` descendente.

`GET /admin/cirugias?section=pending|requested|approved|history`. Default `pending`. Cambiar de sección limpia filtros. `isActiveRoute` compara el path y no el query; los hijos comparan `section`.

Header lista: actions outline **Calendario** → `/admin/cirugias/calendario?from={section}` + CTA **Solicitar cirugía** (`surgeries.create`). Header calendario (sin programar): CTA **Solicitar cirugía**.

Filtros con el modal (no el panel inline de la demo). Primario = nombre o DNI. Modal: especialidad (`whereHas` professional.specialties), profesional, obra social. Estado (A programar | Programada | Todos) solo en `approved`. Particular en el filtro = `whereNull('health_insurance_id')`.

Contadores = totales de la sección. `surgeryNavCounts` global si el user tiene `surgeries.catalog.view`.

## Portal professional (`/profesional/cirugias`)

Parity de nav/UI con staff: mismo patrón de grupo + 4 hijos + counts + headers/chrome/botones. **Única diferencia de copy del grupo:** label **«Mis Cirugías»** (no «Cirugías»). Paths bajo `/profesional/cirugias…`. `groupForPath` / active state reconocen el prefijo portal. Agenda de turnos sigue en `/profesional/agenda` (fuera de este recurso).

Grupo en `portalNav`: `label: 'Mis Cirugías'`, `permission: own.surgeries.view`, `href: '/profesional/cirugias/calendario'`, mismos 4 hijos (Pendientes / Solicitadas / Aprobadas / Historial) con `?section=` y counts scoped a `professional_id` del actor vía la misma prop `surgeryNavCounts` cuando tiene `own.surgeries.view` (patient sigue `null`; staff global con `catalog.view`).

`GET /profesional/cirugias?section=pending|requested|approved|history`. Default `pending`. Redirect post-alta: Particular → `approved`; obra social → `pending`.

Header lista: outline **Calendario** → `/profesional/cirugias/calendario?from={section}` + CTA **Solicitar cirugía** (`own.surgeries.create`). Header calendario: **Solicitar cirugía**. Alta modal: sin selector de profesional (fijado al actor); JSON create sin listar professionals ajenos. Pacientes del create: solo vinculados.

Secciones UI: pending RO, requested RO (sin Marcar como solicitada / Aprobar), approved con **Programar** (`own.surgeries.schedule` + ownership), history RO. CTAs staff de solicitar/aprobar intactos en `/admin/cirugias`.

## Rutas

Staff:

- `GET /admin/cirugias`
- `GET /admin/cirugias/crear` JSON del modal (`surgeries.create`)
- `POST /admin/cirugias`
- `GET /admin/cirugias/pacientes?q=` JSON (`surgeries.create`)
- `POST /admin/cirugias/{surgery}/solicitar`
- `POST /admin/cirugias/{surgery}/aprobar`
- `GET /admin/cirugias/calendario`
- `GET /admin/cirugias/{surgery}/programar`
- `POST /admin/cirugias/{surgery}/programar`

Portal (GET Inertia en español; mutaciones bajo el mismo prefijo `/profesional/cirugias/…`, espejo admin — excepción D9 alineada a este recurso; no reusar POST `/admin/cirugias`):

- `GET /profesional/cirugias`
- `GET /profesional/cirugias/crear` JSON del modal (`own.surgeries.create`)
- `POST /profesional/cirugias`
- `GET /profesional/cirugias/pacientes?q=` JSON (`own.surgeries.create`)
- `GET /profesional/cirugias/calendario`
- `GET /profesional/cirugias/{surgery}/programar`
- `POST /profesional/cirugias/{surgery}/programar`

Sin rutas portal de solicitar/aprobar. Transición inválida → 422. Sin permiso → 403. Staff endpoints siguen 403 para patient/professional. El post-login del admin sigue en `/admin/reservas`.

## Columnas `surgeries`

`patient_id` (restrict), `professional_id` (restrict, not null), `health_insurance_id` (nullable, restrict), `requested_by_user_id` (restrict, not null), `status`, `note` (text, not null), `starts_at` / `ends_at` (nullable; not null solo si `scheduled`; `ends_at` posterior a `starts_at`), timestamps, índice `(status, starts_at)`. Sin `unique(professional_id, starts_at)`. Sin columna de procedimiento.
