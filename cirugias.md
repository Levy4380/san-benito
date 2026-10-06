# cirugias.md — propuesta de cirugías

Esta propuesta no es la constitución. Entra en `new-design.md` recién cuando el dueño la incorpore. Hasta entonces no hay migración, modelo, policy escrita, ruta registrada ni case nuevo en `App\Enums\Permission`. La demo de `demo/cirugias/` solo muestra lo que este documento fija.

Idioma (D9): tablas, columnas, estados y permisos en inglés. Textos de UI en español.

## Actores

La persona «Secretaria» de `LocalDemoAccounts` (`admin@test.test`, name Secretaria) es el rol `admin`. No se crea el rol `secretary` y no se le cambia el rol a esa cuenta.

Gestionan las cirugías `admin` y `super_admin`, con los mismos cuatro permisos. `patient` y `doctor` no tienen permiso de cirugías y no tienen pantalla.

Los cuatro cases van en el array `$staff` de `Permission::forRole`. `admin` los recibe porque el brazo `'admin'` devuelve `$staff`. `super_admin` los recibe por `...$staff`. No van en el brazo exclusivo de `super_admin`. Ese brazo sigue siendo solo `admins.manage`, `patients.catalog.view`, `patients.create`, `specialties.manage` y `health_insurances.manage`.

No se usa un permiso `surgeries.manage`. En este código `manage` es el CRUD de un catálogo solo de `super_admin`.

## Permisos

Nombres `{recurso}.{acción}`. Sin prefijo `staff.`. Sin `own.surgeries.*`: `own.*` es el sujeto del portal (`patient` o `doctor`) y el admin no tiene esa entidad (d37). Ver las cirugías que pidió otro admin es el any del catálogo: `surgeries.catalog.view` lista todas las de la institución.

| Permiso | Qué autoriza | Transición | Roles |
|---|---|---|---|
| `surgeries.catalog.view` | Listar todas las de la institución, incluidas las que pidió otro admin | `GET /admin/surgeries` y `GET /admin/surgeries/calendar` | admin, super_admin |
| `surgeries.create` | Reservar = solicitar. UI «Solicitar cirugía». Paciente + doctor + obra social + nota | INSERT `status` `pending_approval`, sin horario | admin, super_admin |
| `surgeries.approve` | Aprobar | `pending_approval` → `to_schedule`, sigue sin horario | admin, super_admin |
| `surgeries.schedule` | Fijar día, hora de inicio y hora de fin | `to_schedule` → `scheduled` | admin, super_admin |

Matriz de acción × rol, al nivel de `new-design.md` §5:

| Acción | Paciente | Doctor | Admin | Super admin |
|---|---|---|---|---|
| Ver el catálogo de cirugías | No | No | Sí (`surgeries.catalog.view`) | Sí (`surgeries.catalog.view`) |
| Solicitar cirugía | No | No | Sí (`surgeries.create`) | Sí (`surgeries.create`) |
| Aprobar | No | No | Sí (`surgeries.approve`) | Sí (`surgeries.approve`) |
| Programar día y hora | No | No | Sí (`surgeries.schedule`) | Sí (`surgeries.schedule`) |

Catálogo permiso → rutas propuestas → roles. Las rutas no se registran en esta etapa.

| Permiso | Rutas | Roles |
|---|---|---|
| `surgeries.catalog.view` | `GET /admin/surgeries`, `GET /admin/surgeries/calendar` | admin, super_admin |
| `surgeries.create` | `GET /admin/surgeries/create`, `POST /admin/surgeries/create` | admin, super_admin |
| `surgeries.approve` | `POST /admin/surgeries/{surgery}/approve` | admin, super_admin |
| `surgeries.schedule` | `POST /admin/surgeries/{surgery}/schedule` | admin, super_admin |

Post-login del admin sigue en `/admin/appointments` (d14). No hay home de cirugías.

En `Permission::forRole`, los cuatro cases se agregan dentro de `$staff`, junto a `doctors.catalog.view` y `doctors.create`. `RoleSeeder` no se toca aparte: cuando el dueño incorpore la propuesta, sigue sincronizando el enum.

Nav futura, todavía no editada en `Sidebar.tsx`: un ítem «Cirugías» en `staffNav` si el usuario tiene `surgeries.catalog.view`. La demo dibuja ese ítem solo dentro de su HTML.

## Policy

Descrita acá. No se escribe `app/Policies` en esta etapa. Sigue el corte de `AppointmentPolicy`: el middleware `permission:` abre la familia; el método mira la fila.

| Método | Permiso | Fila |
|---|---|---|
| `viewAny` | `surgeries.catalog.view` | — (el catálogo es de la institución) |
| `create` | `surgeries.create` | — |
| `approve` | `surgeries.approve` | `status === pending_approval` |
| `schedule` | `surgeries.schedule` | `status === to_schedule` |

Aprobar una que ya está «A programar», o programar una «Pendiente de aprobación», no pasa la policy.

## Solicitar

La UI dice «Solicitar cirugía». El INSERT deja `status` `pending_approval`, `starts_at` null y `ends_at` null.

No es `appointments.book`: eso inserta un hueco de `AvailabilityService::calculateSlots`. No es `own.appointments.assign`. No se crean `surgeries.reserve` ni `surgeries.book`.

Paciente: búsqueda por nombre, DNI o correo, mínimo 2 caracteres, el mismo contrato que `DoctorPatientService::searchRegisteredPatients` (d21). `trim`; si `mb_strlen` es menor que 2, colección vacía; `LIKE` sobre `patients.name`, `patients.dni` y `patients.email`, incluidas las fichas con `user_id` null; `orderBy('id')`; `limit(25)`. El `q` viaja en `GET /admin/surgeries/create` (mismo mínimo que `LinkPatientRequest`). No se abre `GET /admin/patients` y no se concede `patients.catalog.view` al admin: hoy es 403 para ese rol (d37). `super_admin` usa la misma búsqueda. El formulario no se bifurca.

Doctor: el listado que el admin ya puede ver con `doctors.catalog.view`. Sin permiso nuevo de doctores.

Obra social: select con las filas de `health_insurances` más «Particular» (vacío = `health_insurance_id` null). Al elegir paciente se precarga su obra de `patient_health_insurance`; quien solicita la puede cambiar. Elegirla en la cirugía no escribe `patient_health_insurance`.

Solicitar no escribe `doctor_patient`. D21 solo nace en book, assign y alta manual del vínculo. La nota no va en `doctor_patient`.

## Estados

Una etiqueta por valor.

| `status` | UI |
|---|---|
| `pending_approval` | Pendiente de aprobación |
| `to_schedule` | A programar |
| `scheduled` | Programada |

«A programar» también cubre «pendiente a programar», «por programar» y «a convenir». No hay rechazada, cancelada ni `completed`. Sin mails (D8).

## Programar y calendario

Programar no es `availability.program`: eso es el wizard N×M de franjas. No se crea `surgeries.program`.

La cirugía no es fila de `appointments` (D7: esa tabla no tiene `status`). No se usan `availability_windows`, `AvailabilityService::calculateSlots` ni `slot_duration_minutes`. No existe la tabla `surgery_windows`.

`starts_at` y `ends_at` viven en `surgeries`. Quedan null hasta `schedule`. Los dos son obligatorios al programar. La duración la carga quien programa (inicio y fin). No hay duración fija de 20 minutos.

Intervalo semiabierto `[starts_at, ends_at)`. Dos filas `scheduled` no se solapan en toda la institución: hay solape si `a.starts_at < b.ends_at` y `b.starts_at < a.ends_at`. El solape no se guarda y la UI muestra el error. Tocar el extremo (`11:00–12:00` y `12:00–13:00`) no es solape.

Zona `America/Argentina/Buenos_Aires`. Hora de pared, sin sufijo `Z` (d17). Programar solo en futuro (`starts_at` posterior a ahora en esa zona). El calendario muestra también las ya pasadas.

Vista (d15): mes a la izquierda y panel del día a la derecha, sin modal de día. En teléfono (≤767) se ve el mes o el panel, no los dos. Los días de otro mes no se eligen. Los días anteriores a hoy sí se eligen: ahí viven las programadas pasadas. El panel del día no es una lista: es una línea de tiempo por hora (07:00–21:00, se estira si una cirugía cae fuera) con cada `scheduled` de toda la institución como bloque (horario, paciente, doctor). Las ya terminadas van en gris y la parte del día que ya pasó, rayada. Tocar un bloque abre el modal de detalle. Horas con el control de `Time24`: hora 0–23 y minutos con step 5 (d30). No `input type=time`.

Modo programar: **Programar** (desde el modal de detalle) abre esa misma vista de calendario con la cirugía elegida, no un modal. El subtítulo nombra paciente y doctor. Los días anteriores a hoy quedan deshabilitados y arranca en mañana, con el primer hueco libre precargado (1 hora). El panel del día muestra el `Time24` de inicio y fin, una línea de tiempo del día con las `scheduled` de toda la institución como bloques ocupados, la parte ya pasada rayada y la cirugía a programar como vista previa: verde si está libre, roja si se solapa. Un mensaje dice «Libre · N min.» o «Se solapa con HH:MM–HH:MM (paciente).». Los huecos libres del día aparecen como botones; tocar uno o tocar la línea de tiempo mueve el inicio y mantiene la duración. **Programar** queda deshabilitado mientras haya solape, el fin no sea posterior al inicio o el inicio no sea futuro; el servidor repite el chequeo igual. **Cancelar** vuelve a la lista con el detalle abierto. El éxito muestra toast y deja el día con la nueva programada. La línea de tiempo y los huecos cubren 07:00–21:00 como ayuda visual; no es una restricción de horario.

Navegación: en la sidebar, «Cirugías» es un cajón (botón con `aria-expanded`) que despliega tres links, todos con `surgeries.catalog.view`, cada uno con su conteo:

| Link | Muestra | Orden |
|---|---|---|
| Pendientes | `pending_approval` | más nueva primero |
| Aprobadas | `to_schedule` y `scheduled` con `ends_at` posterior a ahora | primero las a programar; después las programadas por `starts_at` |
| Historial | `scheduled` con `ends_at` anterior o igual a ahora | más reciente primero |

Las tres son la misma lista con un filtro de sección (`GET /admin/surgeries?section=pending|approved|history`, default `pending`); no suman permisos ni rutas. En Aprobadas, un separador «Programadas» marca dónde empiezan las programadas (solo si hay alguna en la lista). El filtro «Estado» del panel solo aparece en Aprobadas (a programar / programada). Cambiar de sección limpia los filtros. Calendario y «Solicitar cirugía» siguen como botones del encabezado. Es una propuesta para el chrome staff; no toca `Sidebar.tsx` en esta etapa.

Lista primero (d35). El alta es otra vista; el éxito vuelve a Pendientes. Feedback: toast y modal de página (d29), no `window.confirm`.

Filtros (d41): campo primario de texto (nombre o DNI del paciente, `patients.name` / `patients.dni`) + **Buscar** + **Filtros**. El panel de Filtros lleva estado, especialidad, doctor y obra social, cada uno con «Todos» / «Todas» como default; **Aplicar** busca y vuelve a la lista, **Volver** descarta. Sin filtros se lista todo. Especialidad filtra por las especialidades del doctor (`doctor_specialty`); la cirugía no guarda `specialty_id`. Obra social filtra por `surgeries.health_insurance_id` («Particular» = null).

Card del listado: nombre del paciente, DNI, doctor que solicita e indicador de estado; si está programada, también fecha y horario. La card no aprueba ni programa. Su único botón, **Ver detalle**, abre un modal de página con los datos de la cirugía (estado, horario si existe, obra social), del doctor (nombre, especialidades), del paciente (nombre, DNI, correo) y la nota. Las acciones viven en ese modal: **Aprobar** con `surgeries.approve` y solo si `pending_approval`; **Programar** con `surgeries.schedule` y solo si `to_schedule`.

## Fila `surgeries`

Propuesta de columnas. No hay migración en esta etapa.

| Columna | Tipo | Reglas |
|---|---|---|
| `id` | bigint PK | |
| `patient_id` | FK `patients.id` | not null |
| `doctor_id` | FK `doctors.id` | not null |
| `note` | text | not null |
| `health_insurance_id` | FK `health_insurances.id` | nullable (null = particular), restrict on delete |
| `status` | string | `pending_approval`, `to_schedule`, `scheduled` |
| `starts_at` | datetime | nullable; not null solo si `scheduled` |
| `ends_at` | datetime | nullable; not null solo si `scheduled`; posterior a `starts_at` |
| timestamps | | |

Sin `specialty_id`: la especialidad se lee del doctor. Sin columna de estado en `appointments`.

## Demo

`demo/cirugias/` es un mock en memoria con la piel Clínico. Un solo chrome staff. El usuario mock es Secretaria (rol `admin`) y lleva los cuatro strings `surgeries.catalog.view`, `surgeries.create`, `surgeries.approve` y `surgeries.schedule`. Los botones leen esos strings: «Solicitar cirugía» con `surgeries.create`; «Aprobar» (en el modal de detalle) con `surgeries.approve` y solo en `pending_approval`; «Programar» (en el modal de detalle, abre el calendario en modo programar) con `surgeries.schedule` y solo en `to_schedule`; lista, detalle y calendario con `surgeries.catalog.view`.

Al abrir hay filas con pacientes y doctores de `DemoSeeder` y algunas fichas mock extra: una `pending_approval` (Juan Paciente, Ana Pérez, nota «Se quiere operar la nariz.») entre varias pendientes, varias `to_schedule` y varias `scheduled` repartidas en días pasados y futuros, sin solaparse. En el calendario, los días con 3 o más programadas usan el tono «full». La sidebar tiene el cajón «Cirugías» con Pendientes, Aprobadas e Historial; abre en Pendientes. Desde ahí se va a solicitar y al calendario.
