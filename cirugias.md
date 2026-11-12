# Cirugías

Gestor de staff, aparte de Reservas. La demo `demo/cirugias/cirugias-diseno-v1.html` manda la UI, con dos deltas: el estado **Solicitada** y **Particular** que no pasa por pendiente.

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

Permisos solo en `$staff` de `Permission::forRole` (admin y super_admin). No van a patient ni a professional. No hay `own.surgeries.*` ni `surgeries.manage`.

- `surgeries.catalog.view`
- `surgeries.create`
- `surgeries.request`
- `surgeries.approve`
- `surgeries.schedule`

`professional_id` es obligatorio: es quien «solicita». El admin lo elige. `requested_by_user_id` es el user que crea la fila. No hay páginas bajo `/profesional` ni `/paciente`. No se escribe `professional_patient`.

## Calendario

Un solo recurso. Solape si `a.starts_at < b.ends_at` y `b.starts_at < a.ends_at`, en toda la institución, sin mirar el profesional. Tocar el extremo no es solape. No consulta `availability_windows`, `appointments` ni `slot_duration_minutes`. No hay `surgery_windows`.

Ayuda visual 07:00–21:00; si una programada cae afuera, la línea se estira. Duración mínima 30 minutos. Time24, step 5. Fin posterior al inicio, mismo día. Inicio futuro en hora de pared (`APP_TIMEZONE=America/Argentina/Buenos_Aires`, sin sufijo Z).

Programar abre el calendario (no un modal), día = mañana, primer hueco o 09:00–10:00, días pasados deshabilitados. Vista previa verde si libre, roja si solapa. Cancelar vuelve a la lista con el detalle abierto. Guardar en transacción con `lockForUpdate` de las `scheduled` de ese día. Choque → 422.

La vista calendario sin programar también muestra días pasados. Tonos: 0 sin cirugías, 1–2 con cirugías, ≥3 «3 o más».

## Lista

Padre «Cirugías» en `staffNav`, después de Reservas. Hijos, todos con `surgeries.catalog.view` y contador:

- Pendientes → `pending`. Cirugías de obra social que todavía no se solicitaron a la obra social. `id` descendente.
- Solicitadas → `requested`. Enviadas a la obra social; la respuesta se carga a mano. `id` descendente.
- Aprobadas → `to_schedule`, o `scheduled` con `ends_at > now`. Primero las a programar; separador «Programadas» solo si hay alguna; después por `starts_at`.
- Historial → `scheduled` con `ends_at <= now`, `starts_at` descendente.

`GET /admin/cirugias?section=pending|requested|approved|history`. Default `pending`. Cambiar de sección limpia filtros. `isActiveRoute` compara el path y no el query; los hijos comparan `section`.

Filtros con el modal (no el panel inline de la demo). Primario = nombre o DNI. Modal: especialidad (`whereHas` professional.specialties), profesional, obra social. Estado (A programar | Programada | Todos) solo en `approved`. Particular en el filtro = `whereNull('health_insurance_id')`.

Contadores = totales de la sección. `surgeryNavCounts` solo si el user tiene `surgeries.catalog.view`.

## Rutas

- `GET /admin/cirugias`
- `GET /admin/cirugias/crear` JSON del modal (`surgeries.create`)
- `POST /admin/cirugias`
- `GET /admin/cirugias/pacientes?q=` JSON (`surgeries.create`)
- `POST /admin/cirugias/{surgery}/solicitar`
- `POST /admin/cirugias/{surgery}/aprobar`
- `GET /admin/cirugias/calendario`
- `GET /admin/cirugias/{surgery}/programar`
- `POST /admin/cirugias/{surgery}/programar`

Transición inválida → 422. Sin permiso, o rol patient/professional → 403. El post-login del admin sigue en `/admin/reservas`.

## Columnas `surgeries`

`patient_id` (restrict), `professional_id` (restrict, not null), `health_insurance_id` (nullable, restrict), `requested_by_user_id` (restrict, not null), `status`, `note` (text, not null), `starts_at` / `ends_at` (nullable; not null solo si `scheduled`; `ends_at` posterior a `starts_at`), timestamps, índice `(status, starts_at)`. Sin `unique(professional_id, starts_at)`. Sin columna de procedimiento.
