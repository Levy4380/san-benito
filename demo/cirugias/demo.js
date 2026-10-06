const permissions = [
    'surgeries.catalog.view',
    'surgeries.create',
    'surgeries.approve',
    'surgeries.schedule',
];

const healthInsurances = [
    { id: 1, name: 'OSDE' },
    { id: 2, name: 'Swiss Medical' },
];

const specialties = [
    { id: 1, name: 'Clínica Médica' },
    { id: 2, name: 'Pediatría' },
    { id: 3, name: 'Cardiología' },
];

const patients = [
    { id: 1, name: 'Paciente', dni: '40000001', email: 'paciente@test.test', health_insurance_id: 1 },
    { id: 2, name: 'Juan Paciente', dni: '30111222', email: 'juan@sanbenito.test', health_insurance_id: 1 },
    { id: 3, name: 'Laura Paciente', dni: '32333444', email: 'laura@sanbenito.test', health_insurance_id: 2 },
    { id: 4, name: 'Carlos Ruiz', dni: '28555111', email: 'carlos.ruiz@sanbenito.test', health_insurance_id: 1 },
    { id: 5, name: 'Sofía Díaz', dni: '35999000', email: 'sofia.diaz@sanbenito.test', health_insurance_id: 2 },
    { id: 6, name: 'Martín Acosta', dni: '41222333', email: 'martin.acosta@sanbenito.test', health_insurance_id: null },
    { id: 7, name: 'Valentina Ríos', dni: '45666777', email: 'valentina.rios@sanbenito.test', health_insurance_id: 1 },
    { id: 8, name: 'Tomás Herrera', dni: '50111444', email: 'tomas.herrera@sanbenito.test', health_insurance_id: 2 },
];

const doctors = [
    { id: 1, name: 'Doctor', specialty_ids: [1] },
    { id: 2, name: 'Ana Pérez', specialty_ids: [1, 3] },
    { id: 3, name: 'Luis Gómez', specialty_ids: [2] },
    { id: 4, name: 'María López', specialty_ids: [3] },
];

const PARTICULAR = 'particular';

const STATUS_LABEL = {
    pending_approval: 'Pendiente de aprobación',
    to_schedule: 'A programar',
    scheduled: 'Programada',
};

const WEEKDAYS = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

const EMPTY_FILTERS = { q: '', status: '', specialty_id: '', doctor_id: '', health_insurance_id: '' };

const SECTIONS = {
    pending: {
        title: 'Pendientes',
        subtitle: 'Cirugías solicitadas que esperan aprobación.',
        matches: (surgery) => surgery.status === 'pending_approval',
        sort: (left, right) => right.id - left.id,
    },
    approved: {
        title: 'Aprobadas',
        subtitle: 'A programar y programadas que todavía no terminaron.',
        matches: (surgery) => surgery.status === 'to_schedule' || (surgery.status === 'scheduled' && surgery.ends_at > wallStamp(new Date())),
        sort: (left, right) => {
            if (left.status !== right.status) {
                return left.status === 'to_schedule' ? -1 : 1;
            }
            return left.status === 'scheduled' ? left.starts_at.localeCompare(right.starts_at) : left.id - right.id;
        },
    },
    history: {
        title: 'Historial',
        subtitle: 'Cirugías programadas que ya pasaron.',
        matches: (surgery) => surgery.status === 'scheduled' && surgery.ends_at <= wallStamp(new Date()),
        sort: (left, right) => right.starts_at.localeCompare(left.starts_at),
    },
};

let section = 'pending';
let navOpen = true;
let applied = { ...EMPTY_FILTERS };
let filtersOpen = false;
let selectedPatientId = null;
let view = 'list';
let modalMode = null;
let modalSurgeryId = null;
let detailSurgeryId = null;
let selectedDate = todayKey();
let visibleMonth = `${selectedDate.slice(0, 7)}-01`;
let mobileDayOpen = false;
let scheduleTargetId = null;
let scheduleStart = '09:00';
let scheduleEnd = '10:00';

const DAY_START_MIN = 7 * 60;
const DAY_END_MIN = 21 * 60;

function scheduled(patientId, doctorId, healthInsuranceId, note, slot) {
    const day = addDays(todayKey(), slot[0]);

    return {
        patient_id: patientId,
        doctor_id: doctorId,
        health_insurance_id: healthInsuranceId,
        note,
        status: 'scheduled',
        starts_at: `${day} ${slot[1]}:00`,
        ends_at: `${day} ${slot[2]}:00`,
    };
}

function pending(patientId, doctorId, healthInsuranceId, note) {
    return { patient_id: patientId, doctor_id: doctorId, health_insurance_id: healthInsuranceId, note, status: 'pending_approval', starts_at: null, ends_at: null };
}

function toSchedule(patientId, doctorId, healthInsuranceId, note) {
    return { patient_id: patientId, doctor_id: doctorId, health_insurance_id: healthInsuranceId, note, status: 'to_schedule', starts_at: null, ends_at: null };
}

const surgeries = [
    pending(2, 2, 1, 'Se quiere operar la nariz.'),
    pending(7, 1, 1, 'Hernia inguinal derecha. Pide turno antes de fin de mes.'),
    pending(8, 3, 2, 'Amigdalectomía. Anginas a repetición durante el último año.'),
    pending(6, 4, null, 'Evaluar cateterismo cardíaco por dolor de pecho al esfuerzo.'),
    toSchedule(3, 3, 2, 'Quiere operarse la vesícula.'),
    toSchedule(4, 2, 1, 'Colocación de marcapasos. Estudios prequirúrgicos completos.'),
    toSchedule(5, 1, 2, 'Artroscopía de rodilla izquierda. Lesión de menisco.'),
    scheduled(1, 4, null, 'Cirugía ya coordinada.', [-1, '09:00', '11:00']),
    scheduled(4, 1, 1, 'Apendicectomía programada.', [-1, '12:00', '13:30']),
    scheduled(5, 2, 2, 'Septoplastia.', [-1, '15:00', '17:00']),
    scheduled(7, 4, 1, 'Angioplastia coronaria.', [-6, '09:00', '11:00']),
    scheduled(2, 1, 1, 'Extirpación de lipoma en espalda.', [-6, '14:00', '16:30']),
    scheduled(8, 3, 2, 'Colocación de tubos de ventilación (diábolos).', [-9, '08:00', '10:30']),
    scheduled(6, 1, null, 'Cirugía de cataratas, ojo derecho.', [1, '14:00', '15:30']),
    scheduled(3, 2, 2, 'Ablación por arritmia.', [2, '10:00', '12:30']),
    scheduled(4, 3, 1, 'Frenectomía lingual.', [2, '13:00', '14:00']),
    scheduled(5, 4, 2, 'Reemplazo valvular aórtico.', [4, '07:30', '09:00']),
    scheduled(7, 1, 1, 'Colecistectomía laparoscópica.', [4, '09:30', '11:45']),
    scheduled(8, 3, 2, 'Hernia umbilical.', [4, '12:00', '13:00']),
    scheduled(1, 2, 1, 'Bypass coronario.', [4, '16:00', '18:00']),
    scheduled(2, 1, 1, 'Hernia inguinal izquierda.', [7, '11:00', '13:00']),
    scheduled(6, 4, null, 'Cateterismo diagnóstico.', [10, '08:00', '09:30']),
    scheduled(3, 1, 2, 'Tiroidectomía parcial.', [10, '14:30', '17:00']),
    scheduled(5, 2, 2, 'Rinoplastia.', [15, '09:00', '12:00']),
    scheduled(4, 3, 1, 'Corrección de estrabismo.', [22, '10:00', '11:30']),
].map((surgery, index) => ({ id: index + 1, ...surgery }));

let nextId = surgeries.length + 1;

function can(name) {
    return permissions.includes(name);
}

function pad2(value) {
    return String(value).padStart(2, '0');
}

function wallParts(date) {
    const parts = {};
    const formatted = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Argentina/Buenos_Aires',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23',
    }).formatToParts(date);

    formatted.forEach((part) => {
        if (part.type !== 'literal') {
            parts[part.type] = part.value;
        }
    });

    return parts;
}

function wallStamp(date) {
    const parts = wallParts(date);

    return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
}

function todayKey() {
    return wallStamp(new Date()).slice(0, 10);
}

function addDays(key, delta) {
    const [year, month, day] = key.split('-').map(Number);
    const date = new Date(year, month - 1, day + delta);

    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function addMonths(key, delta) {
    const [year, month] = key.split('-').map(Number);
    const date = new Date(year, month - 1 + delta, 1);

    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-01`;
}

function monthGrid(monthKey) {
    const [year, month] = monthKey.split('-').map(Number);
    const first = new Date(year, month - 1, 1);
    const startWeekday = first.getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    const prevMonthDays = new Date(year, month - 1, 0).getDate();
    const cells = [];

    for (let index = 0; index < 42; index += 1) {
        const offset = index - startWeekday;

        if (offset < 0) {
            const day = prevMonthDays + offset + 1;
            const date = new Date(year, month - 2, day);
            cells.push({
                key: `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`,
                day,
                inMonth: false,
            });
        } else if (offset >= daysInMonth) {
            const day = offset - daysInMonth + 1;
            const date = new Date(year, month, day);
            cells.push({
                key: `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`,
                day,
                inMonth: false,
            });
        } else {
            const day = offset + 1;
            cells.push({
                key: `${year}-${pad2(month)}-${pad2(day)}`,
                day,
                inMonth: true,
            });
        }
    }

    return cells;
}

function monthTitle(monthKey) {
    const [year, month] = monthKey.split('-').map(Number);

    return new Date(year, month - 1, 1).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
}

function formatDateLabel(dateKey) {
    const [year, month, day] = dateKey.split('-').map(Number);

    return new Date(year, month - 1, day).toLocaleDateString('es-AR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    });
}

function patientById(id) {
    return patients.find((patient) => patient.id === id);
}

function doctorById(id) {
    return doctors.find((doctor) => doctor.id === id);
}

function surgeryById(id) {
    return surgeries.find((surgery) => surgery.id === id);
}

function searchPatients(term) {
    const query = term.trim();

    if (Array.from(query).length < 2) {
        return [];
    }

    const needle = query.toLocaleLowerCase('es');

    return patients
        .filter((patient) => [patient.name, patient.dni, patient.email].some((value) => value.toLocaleLowerCase('es').includes(needle)))
        .sort((left, right) => left.id - right.id)
        .slice(0, 25);
}

function overlaps(start, end, otherStart, otherEnd) {
    return start < otherEnd && otherStart < end;
}

function el(tag, attrs, children) {
    const node = tag === 'svg' || tag === 'path'
        ? document.createElementNS('http://www.w3.org/2000/svg', tag)
        : document.createElement(tag);

    Object.entries(attrs || {}).forEach(([key, value]) => {
        if (key === 'class') {
            node.setAttribute('class', value);
        } else if (key === 'text') {
            node.textContent = value;
        } else if (value === true) {
            node.setAttribute(key, '');
        } else if (value !== false && value != null) {
            node.setAttribute(key, String(value));
        }
    });

    (children || []).forEach((child) => {
        if (child == null || child === false) {
            return;
        }
        node.append(child.nodeType ? child : document.createTextNode(String(child)));
    });

    return node;
}

function toast(message, variant) {
    const host = document.getElementById('toasts');
    const node = el('div', {
        class: `toast toast-${variant}`,
        role: variant === 'warn' ? 'alert' : 'status',
        text: message,
    });
    host.append(node);
    window.setTimeout(() => node.remove(), 3400);
}

function showView(next) {
    view = next;
    if (next !== 'calendar' && scheduleTargetId !== null) {
        scheduleTargetId = null;
        setCalendarSubtitle();
    }
    document.getElementById('view-list').hidden = next !== 'list';
    document.getElementById('view-create').hidden = next !== 'create';
    document.getElementById('view-calendar').hidden = next !== 'calendar';
    renderNav();
    closeDrawer();

    if (next === 'calendar') {
        renderCalendar();
    }
}

function closeDrawer() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.remove('is-open');
    sidebar.dataset.open = 'false';
    document.getElementById('nav-toggle').setAttribute('aria-expanded', 'false');
    document.getElementById('nav-toggle').setAttribute('aria-label', 'Abrir menú');
    document.getElementById('user-toggle').setAttribute('aria-expanded', 'false');
    document.getElementById('sidebar-nav-panel').hidden = false;
    document.getElementById('sidebar-user-panel').hidden = true;
}

function renderNav() {
    const parent = document.getElementById('nav-surgeries');
    parent.setAttribute('aria-expanded', navOpen ? 'true' : 'false');
    document.getElementById('nav-surgeries-links').hidden = !navOpen;

    document.querySelectorAll('.nav-child').forEach((button) => {
        const active = view === 'list' && button.dataset.section === section;
        button.classList.toggle('is-active', active);
        if (active) {
            button.setAttribute('aria-current', 'page');
        } else {
            button.removeAttribute('aria-current');
        }
    });

    document.querySelectorAll('[data-count]').forEach((node) => {
        node.textContent = String(surgeries.filter(SECTIONS[node.dataset.count].matches).length);
    });
}

function openSection(next) {
    if (!can('surgeries.catalog.view')) {
        return;
    }

    section = next;
    applied = { ...EMPTY_FILTERS };
    document.getElementById('filter-q').value = '';
    filtersOpen = false;
    renderFilterState();
    renderList();
    showView('list');
}

function renderList() {
    const host = document.getElementById('surgery-list');
    const current = SECTIONS[section];
    host.replaceChildren();
    document.getElementById('list-title').textContent = current.title;
    document.getElementById('list-subtitle').textContent = current.subtitle;
    document.getElementById('filter-status-field').hidden = section !== 'approved';
    renderNav();

    if (!can('surgeries.catalog.view')) {
        host.append(el('p', { class: 'empty', text: 'No tenés permiso para ver las cirugías.' }));
        return;
    }

    const rows = surgeries.filter(current.matches).filter(matchesFilters).sort(current.sort);

    if (rows.length === 0) {
        host.append(el('p', { class: 'empty', text: activeFilterCount() > 0 || applied.q.trim() !== '' ? 'No hay cirugías con esos filtros.' : 'No hay cirugías en esta sección.' }));
        return;
    }

    rows.forEach((surgery, index) => {
        if (section === 'approved' && surgery.status === 'scheduled' && rows[index - 1]?.status !== 'scheduled') {
            host.append(el('div', { class: 'list-divider', role: 'separator', text: 'Programadas' }));
        }
        host.append(surgeryCard(surgery));
    });
}

function matchesFilters(surgery) {
    const patient = patientById(surgery.patient_id);
    const doctor = doctorById(surgery.doctor_id);
    const needle = applied.q.trim().toLocaleLowerCase('es');

    if (needle !== '' && !patient.name.toLocaleLowerCase('es').includes(needle) && !patient.dni.includes(needle)) {
        return false;
    }
    if (section === 'approved' && applied.status !== '' && surgery.status !== applied.status) {
        return false;
    }
    if (applied.specialty_id !== '' && !doctor.specialty_ids.includes(Number(applied.specialty_id))) {
        return false;
    }
    if (applied.doctor_id !== '' && surgery.doctor_id !== Number(applied.doctor_id)) {
        return false;
    }
    if (applied.health_insurance_id === PARTICULAR) {
        return surgery.health_insurance_id === null;
    }
    if (applied.health_insurance_id !== '' && surgery.health_insurance_id !== Number(applied.health_insurance_id)) {
        return false;
    }

    return true;
}

function statusBadge(status) {
    return el('span', { class: `status-badge status-${status}`, text: STATUS_LABEL[status] });
}

function timeRange(surgery) {
    return `${surgery.starts_at.slice(11, 16)}–${surgery.ends_at.slice(11, 16)}`;
}

function insuranceName(id) {
    return id === null ? 'Particular' : healthInsurances.find((item) => item.id === id).name;
}

function shortDate(dateKey) {
    const [year, month, day] = dateKey.split('-').map(Number);

    return new Date(year, month - 1, day).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' });
}

function surgeryCard(surgery) {
    const patient = patientById(surgery.patient_id);
    const doctor = doctorById(surgery.doctor_id);
    const copy = el('div', { class: 'card-copy' }, [
        surgery.starts_at ? el('div', { class: 'card-time', text: `${shortDate(surgery.starts_at.slice(0, 10))} · ${timeRange(surgery)}` }) : null,
        el('div', { class: 'card-name', text: patient.name }),
        el('div', { class: 'card-meta' }, ['DNI ', el('span', { class: 'mono', text: patient.dni })]),
        el('div', { class: 'card-meta', text: `Solicita: ${doctor.name}` }),
        statusBadge(surgery.status),
    ]);
    const detail = el('button', { type: 'button', class: 'btn btn-sm btn-outline', 'data-action': 'detail', text: 'Ver detalle' });
    detail.addEventListener('click', () => openDetail(surgery.id));

    return el('article', { class: 'card', 'data-surgery-id': surgery.id, 'data-status': surgery.status }, [
        copy,
        el('div', { class: 'card-actions' }, [detail]),
    ]);
}

function activeFilterCount() {
    return ['status', 'specialty_id', 'doctor_id', 'health_insurance_id'].filter((key) => applied[key] !== '').length;
}

function renderFilterState() {
    const count = activeFilterCount();
    document.getElementById('open-filters-label').textContent = count > 0 ? `Filtros (${count})` : 'Filtros';
    document.getElementById('filter-form').hidden = filtersOpen;
    document.getElementById('surgery-list').hidden = filtersOpen;
    document.getElementById('filter-panel').hidden = !filtersOpen;
}

function openFilters() {
    document.getElementById('filter-status').value = applied.status;
    document.getElementById('filter-specialty').value = applied.specialty_id;
    document.getElementById('filter-doctor').value = applied.doctor_id;
    document.getElementById('filter-insurance').value = applied.health_insurance_id;
    filtersOpen = true;
    renderFilterState();
    document.getElementById('filter-status').focus();
}

function closeFilters() {
    filtersOpen = false;
    renderFilterState();
}

function fillFilterSelects() {
    const fill = (id, allLabel, options) => {
        const select = document.getElementById(id);
        select.replaceChildren(el('option', { value: '', text: allLabel }));
        options.forEach(([value, label]) => select.append(el('option', { value, text: label })));
    };

    fill('filter-specialty', 'Todas', specialties.map((item) => [item.id, item.name]));
    fill('filter-doctor', 'Todos', doctors.map((item) => [item.id, item.name]));
    fill('filter-insurance', 'Todas', [...healthInsurances.map((item) => [item.id, item.name]), [PARTICULAR, 'Particular']]);
}

function fillInsuranceSelect() {
    const select = document.getElementById('health-insurance-id');
    select.replaceChildren(el('option', { value: '', text: 'Particular' }));
    healthInsurances.forEach((item) => select.append(el('option', { value: item.id, text: item.name })));
}

function renderPatientResults() {
    const input = document.getElementById('patient-q');
    const host = document.getElementById('patient-results');
    const hint = document.getElementById('patient-hint');
    const query = input.value.trim();
    host.replaceChildren();

    if (Array.from(query).length < 2) {
        hint.hidden = false;
        hint.textContent = 'Mínimo 2 caracteres.';
        return;
    }

    const matches = searchPatients(query);
    hint.hidden = matches.length > 0;
    hint.textContent = matches.length === 0 ? 'No hay pacientes con ese criterio.' : '';

    matches.forEach((patient) => {
        const button = el('button', { type: 'button', class: `pick${patient.id === selectedPatientId ? ' is-selected' : ''}` }, [
            el('strong', { text: patient.name }),
            el('span', { text: `DNI ${patient.dni} · ${patient.email}` }),
        ]);
        button.addEventListener('click', () => {
            selectedPatientId = patient.id;
            document.getElementById('health-insurance-id').value = patient.health_insurance_id ?? '';
            renderPatientResults();
            renderPicked();
        });
        host.append(button);
    });
}

function renderPicked() {
    const node = document.getElementById('patient-picked');
    const patient = patientById(selectedPatientId);

    if (!patient) {
        node.hidden = true;
        node.textContent = '';
        return;
    }

    node.hidden = false;
    node.textContent = `Paciente elegido: ${patient.name}`;
}

function fillDoctors() {
    const select = document.getElementById('doctor-id');
    select.replaceChildren(el('option', { value: '', text: 'Elegí un doctor' }));
    doctors.forEach((doctor) => {
        select.append(el('option', { value: doctor.id, text: doctor.name }));
    });
}

function toMinutes(time) {
    const [hour, minute] = time.split(':').map(Number);
    return hour * 60 + minute;
}

function fromMinutes(total) {
    const clamped = Math.max(0, Math.min(total, 23 * 60 + 55));
    return `${pad2(Math.floor(clamped / 60))}:${pad2(clamped % 60)}`;
}

function time24(id, label, value, onChange) {
    const [hour, minute] = value.split(':');
    const hourSelect = el('select', { id: `${id}-h`, 'aria-label': `${label} (hora 0–23)` });
    const minuteSelect = el('select', { id: `${id}-m`, 'aria-label': `${label} (minutos)` });

    for (let index = 0; index < 24; index += 1) {
        hourSelect.append(el('option', { value: pad2(index), text: pad2(index) }));
    }
    for (let index = 0; index < 60; index += 5) {
        minuteSelect.append(el('option', { value: pad2(index), text: pad2(index) }));
    }
    hourSelect.value = hour;
    minuteSelect.value = minute;

    const emit = () => onChange(`${hourSelect.value}:${minuteSelect.value}`);
    hourSelect.addEventListener('change', emit);
    minuteSelect.addEventListener('change', emit);

    return el('div', { class: 'field' }, [
        el('span', { text: label }),
        el('div', { class: 'time24', role: 'group', 'aria-label': label }, [hourSelect, el('span', { class: 'time-sep', 'aria-hidden': 'true', text: ':' }), minuteSelect]),
    ]);
}

function scheduledOn(dateKey, exceptId) {
    return surgeries
        .filter((surgery) => surgery.id !== exceptId && surgery.status === 'scheduled' && surgery.starts_at && surgery.starts_at.slice(0, 10) === dateKey)
        .sort((left, right) => left.starts_at.localeCompare(right.starts_at));
}

function nowMinutesOn(dateKey) {
    const now = wallStamp(new Date());
    if (dateKey < now.slice(0, 10)) {
        return 24 * 60;
    }
    if (dateKey > now.slice(0, 10)) {
        return 0;
    }
    return toMinutes(now.slice(11, 16));
}

function freeGaps(dateKey, busy) {
    const gaps = [];
    let cursor = Math.max(DAY_START_MIN, Math.ceil(nowMinutesOn(dateKey) / 5) * 5);

    busy.forEach((surgery) => {
        const start = toMinutes(surgery.starts_at.slice(11, 16));
        const end = toMinutes(surgery.ends_at.slice(11, 16));
        if (start - cursor >= 30) {
            gaps.push([cursor, start]);
        }
        cursor = Math.max(cursor, end);
    });
    if (DAY_END_MIN - cursor >= 30) {
        gaps.push([cursor, DAY_END_MIN]);
    }

    return gaps;
}

function scheduleCheck(dateKey, busy) {
    const start = toMinutes(scheduleStart);
    const end = toMinutes(scheduleEnd);

    if (end <= start) {
        return { ok: false, message: 'La hora de fin tiene que ser posterior a la de inicio.' };
    }
    if (`${dateKey} ${scheduleStart}:00` <= wallStamp(new Date())) {
        return { ok: false, message: 'Ese horario ya pasó. Programá un horario futuro.' };
    }

    const clash = busy.find((other) => overlaps(`${dateKey} ${scheduleStart}:00`, `${dateKey} ${scheduleEnd}:00`, other.starts_at, other.ends_at));
    if (clash) {
        return {
            ok: false,
            clash: true,
            message: `Se solapa con ${timeRange(clash)} (${patientById(clash.patient_id).name}).`,
        };
    }

    return { ok: true, message: `Libre · ${end - start} min.` };
}

function renderCalendar() {
    const focusedId = document.activeElement && document.activeElement.id;
    paintCalendar();
    if (focusedId) {
        document.getElementById(focusedId)?.focus();
    }
}

function paintCalendar() {
    const monthHost = document.getElementById('calendar-month');
    const panelHost = document.getElementById('day-panel');
    const agenda = document.getElementById('agenda');
    const narrow = window.matchMedia('(max-width: 767px)').matches;
    agenda.classList.toggle('is-day', narrow && mobileDayOpen);
    monthHost.replaceChildren();
    panelHost.replaceChildren();

    const head = el('div', { class: 'cal-head' });
    const prev = el('button', { type: 'button', class: 'btn btn-outline btn-sm btn-icon', 'aria-label': 'Mes anterior' });
    prev.append(el('svg', { class: 'icon icon-lg', viewBox: '0 0 24 24', 'aria-hidden': 'true' }, [svgPath('m15 18-6-6 6-6')]));
    prev.addEventListener('click', () => {
        visibleMonth = addMonths(visibleMonth, -1);
        renderCalendar();
    });
    const next = el('button', { type: 'button', class: 'btn btn-outline btn-sm btn-icon', 'aria-label': 'Mes siguiente' });
    next.append(el('svg', { class: 'icon icon-lg', viewBox: '0 0 24 24', 'aria-hidden': 'true' }, [svgPath('m9 18 6-6-6-6')]));
    next.addEventListener('click', () => {
        visibleMonth = addMonths(visibleMonth, 1);
        renderCalendar();
    });
    head.append(prev, el('h2', { text: monthTitle(visibleMonth) }), next);

    const grid = el('div', { class: 'cal-grid' });
    WEEKDAYS.forEach((label) => grid.append(el('div', { class: 'weekday', text: label })));

    const perDay = {};
    surgeries.forEach((surgery) => {
        if (surgery.status === 'scheduled' && surgery.starts_at) {
            const key = surgery.starts_at.slice(0, 10);
            perDay[key] = (perDay[key] ?? 0) + 1;
        }
    });

    const scheduling = scheduleTargetId !== null;
    const today = todayKey();

    monthGrid(visibleMonth).forEach((day) => {
        const button = el('button', {
            type: 'button',
            class: 'day',
            text: String(day.day),
        });

        if (!day.inMonth || (scheduling && day.key < today)) {
            button.classList.add('is-muted');
            button.disabled = true;
        } else {
            button.dataset.day = day.key;
            const count = perDay[day.key] ?? 0;
            if (count >= 3) {
                button.classList.add('tone-full');
            } else if (count > 0) {
                button.classList.add('tone-has');
            }
            if (count > 0) {
                button.setAttribute('aria-label', `${day.day}, ${count} cirugía${count === 1 ? '' : 's'}`);
            }
            if (day.key === selectedDate) {
                button.classList.add('is-selected');
                button.setAttribute('aria-current', 'date');
            }
            button.addEventListener('click', () => {
                selectedDate = day.key;
                mobileDayOpen = true;
                renderCalendar();
            });
        }

        grid.append(button);
    });

    const legend = el('div', { class: 'legend' }, [
        el('span', {}, [el('i', { class: 'swatch', 'aria-hidden': 'true' }), 'Sin cirugías']),
        el('span', {}, [el('i', { class: 'swatch swatch-has', 'aria-hidden': 'true' }), 'Con cirugías']),
        el('span', {}, [el('i', { class: 'swatch swatch-full', 'aria-hidden': 'true' }), '3 o más']),
    ]);
    monthHost.append(head, grid, legend);

    const back = el('button', { type: 'button', class: 'back-link day-back', text: '' });
    back.append(el('svg', { class: 'icon icon-chevron', viewBox: '0 0 24 24', 'aria-hidden': 'true' }, [svgPath('m15 18-6-6 6-6')]));
    back.append('Calendario');
    back.addEventListener('click', () => {
        mobileDayOpen = false;
        renderCalendar();
    });

    const daySurgeries = scheduledOn(selectedDate, scheduling ? scheduleTargetId : null);
    const title = formatDateLabel(selectedDate);
    panelHost.append(
        back,
        el('h2', { text: title.charAt(0).toUpperCase() + title.slice(1) }),
        el('p', {
            class: 'hint',
            text: `${daySurgeries.length} cirugía${daySurgeries.length === 1 ? '' : 's'} programada${daySurgeries.length === 1 ? '' : 's'}.`,
        }),
    );

    if (scheduling) {
        panelHost.append(renderScheduleDay(daySurgeries));
        return;
    }

    panelHost.append(el('div', { class: 'timeline-wrap' }, [buildTimeline(daySurgeries, { onOpen: openDetail })]));
}

function buildTimeline(busy, options) {
    const { preview = null, onPick = null, onOpen = null } = options;
    const previewStart = preview ? toMinutes(preview.start) : null;
    const previewEnd = preview ? toMinutes(preview.end) : null;
    const firstHour = Math.floor(Math.min(DAY_START_MIN, previewStart ?? DAY_START_MIN, ...busy.map((item) => toMinutes(item.starts_at.slice(11, 16)))) / 60);
    const lastHour = Math.ceil(Math.max(DAY_END_MIN, previewEnd ?? DAY_END_MIN, ...busy.map((item) => toMinutes(item.ends_at.slice(11, 16)))) / 60);
    const span = (lastHour - firstHour) * 60;
    const pct = (minutes) => `${((minutes - firstHour * 60) / span) * 100}%`;
    const height = (minutes) => `${(minutes / span) * 100}%`;
    const now = wallStamp(new Date());

    const timeline = el('div', {
        class: `timeline${onPick ? ' is-pickable' : ''}`,
        style: `--hours: ${lastHour - firstHour}`,
        'aria-label': 'Cirugías del día por hora',
    });

    for (let hour = firstHour; hour <= lastHour; hour += 1) {
        timeline.append(el('div', { class: 'tl-hour', style: `top: ${pct(hour * 60)}` }, [el('span', { text: `${pad2(hour)}:00` })]));
    }

    const nowMin = Math.min(nowMinutesOn(selectedDate), lastHour * 60);
    if (nowMin > firstHour * 60) {
        timeline.append(el('div', { class: 'tl-past', style: `height: ${height(nowMin - firstHour * 60)}` }));
    }

    busy.forEach((surgery) => {
        const start = toMinutes(surgery.starts_at.slice(11, 16));
        const end = toMinutes(surgery.ends_at.slice(11, 16));
        const patient = patientById(surgery.patient_id);
        const doctor = doctorById(surgery.doctor_id);
        const block = el(onOpen ? 'button' : 'div', {
            type: onOpen ? 'button' : null,
            class: `tl-block tl-busy${surgery.ends_at <= now ? ' is-done' : ''}`,
            style: `top: ${pct(start)}; height: ${height(end - start)}`,
            'aria-label': onOpen ? `${timeRange(surgery)}, ${patient.name}, ${doctor.name}. Ver detalle` : null,
        }, [
            el('strong', { class: 'mono', text: timeRange(surgery) }),
            ` ${patient.name} · ${doctor.name}`,
        ]);
        if (onOpen) {
            block.addEventListener('click', () => onOpen(surgery.id));
        }
        timeline.append(block);
    });

    if (preview && previewEnd > previewStart) {
        timeline.append(
            el('div', { class: `tl-block tl-preview ${preview.ok ? 'is-ok' : 'is-bad'}`, style: `top: ${pct(previewStart)}; height: ${height(previewEnd - previewStart)}` }, [
                el('strong', { class: 'mono', text: `${preview.start}–${preview.end}` }),
                ' Esta cirugía',
            ]),
        );
    }

    if (onPick) {
        timeline.addEventListener('click', (event) => {
            if (event.target.closest('.tl-busy')) {
                return;
            }
            const rect = timeline.getBoundingClientRect();
            onPick(firstHour * 60 + Math.round((((event.clientY - rect.top) / rect.height) * span) / 15) * 15);
        });
    }

    return timeline;
}

function renderScheduleDay(busy) {
    const check = scheduleCheck(selectedDate, busy);
    const startMin = toMinutes(scheduleStart);
    const endMin = toMinutes(scheduleEnd);
    const timeline = buildTimeline(busy, {
        preview: { start: scheduleStart, end: scheduleEnd, ok: check.ok },
        onPick: (minutes) => {
            const keep = Math.max(endMin - startMin, 30);
            scheduleStart = fromMinutes(minutes);
            scheduleEnd = fromMinutes(minutes + keep);
            renderCalendar();
        },
    });

    const gaps = freeGaps(selectedDate, busy);
    const duration = Math.max(endMin - startMin, 30);
    const chips = el('div', { class: 'gap-chips' });
    if (gaps.length === 0) {
        chips.append(el('p', { class: 'hint', text: 'No quedan huecos libres de 30 min o más este día.' }));
    }
    gaps.forEach(([from, to]) => {
        const chip = el('button', { type: 'button', class: 'gap-chip', text: `${fromMinutes(from)}–${fromMinutes(to)}` });
        chip.addEventListener('click', () => {
            scheduleStart = fromMinutes(from);
            scheduleEnd = fromMinutes(Math.min(from + duration, to));
            renderCalendar();
        });
        chips.append(chip);
    });

    const status = el('p', { class: `schedule-status ${check.ok ? 'is-ok' : 'is-bad'}`, role: 'status', text: check.message });
    const submit = el('button', { type: 'button', class: 'btn', id: 'schedule-submit', text: 'Programar' });
    submit.disabled = !check.ok;
    submit.addEventListener('click', submitSchedule);
    const cancel = el('button', { type: 'button', class: 'btn btn-outline', text: 'Cancelar' });
    cancel.addEventListener('click', cancelSchedule);

    const controls = el('div', { class: 'schedule-controls' }, [
        el('div', { class: 'time-row' }, [
            time24('schedule-start', 'Hora de inicio', scheduleStart, (value) => {
                const keep = Math.max(toMinutes(scheduleEnd) - toMinutes(scheduleStart), 30);
                scheduleStart = value;
                scheduleEnd = fromMinutes(toMinutes(value) + keep);
                renderCalendar();
            }),
            time24('schedule-end', 'Hora de fin', scheduleEnd, (value) => {
                scheduleEnd = value;
                renderCalendar();
            }),
        ]),
        status,
        el('div', { class: 'field' }, [el('span', { text: 'Huecos libres' }), chips]),
        el('div', { class: 'schedule-actions' }, [cancel, submit]),
    ]);

    return el('div', { class: 'schedule-day' }, [controls, el('div', { class: 'timeline-wrap' }, [timeline])]);
}

function setCalendarSubtitle() {
    const node = document.getElementById('calendar-subtitle');
    const surgery = surgeryById(scheduleTargetId);

    if (!surgery) {
        node.textContent = 'Calendario de cirugías programadas.';
        return;
    }

    node.replaceChildren(
        el('strong', { text: `Programar: ${patientById(surgery.patient_id).name}` }),
        ` · Solicita ${doctorById(surgery.doctor_id).name}. Elegí un día y un horario libre.`,
    );
}

function cancelSchedule() {
    const id = scheduleTargetId;
    scheduleTargetId = null;
    setCalendarSubtitle();
    showView('list');
    if (id !== null) {
        openDetail(id);
    }
}

function submitSchedule() {
    const surgery = surgeryById(scheduleTargetId);
    if (!surgery || surgery.status !== 'to_schedule' || !can('surgeries.schedule')) {
        return;
    }

    const check = scheduleCheck(selectedDate, scheduledOn(selectedDate, surgery.id));
    if (!check.ok) {
        toast(check.message, 'warn');
        renderCalendar();
        return;
    }

    surgery.status = 'scheduled';
    surgery.starts_at = `${selectedDate} ${scheduleStart}:00`;
    surgery.ends_at = `${selectedDate} ${scheduleEnd}:00`;
    scheduleTargetId = null;
    setCalendarSubtitle();
    renderList();
    renderCalendar();
    toast(`Cirugía programada: ${selectedDate} ${scheduleStart}–${scheduleEnd}.`, 'ok');
}

function svgPath(d) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    return path;
}

function detailRow(label, value) {
    return [el('dt', { text: label }), el('dd', {}, [value])];
}

function detailSection(title, rows) {
    return el('section', { class: 'detail-section' }, [
        el('h3', { text: title }),
        el('dl', {}, rows.flatMap(([label, value]) => detailRow(label, value))),
    ]);
}

function openDetail(id) {
    const surgery = surgeryById(id);
    if (!can('surgeries.catalog.view') || !surgery) {
        return;
    }

    const patient = patientById(surgery.patient_id);
    const doctor = doctorById(surgery.doctor_id);
    const doctorSpecialties = doctor.specialty_ids.map((specialtyId) => specialties.find((item) => item.id === specialtyId).name).join(', ');
    const schedule = surgery.starts_at
        ? el('span', { class: 'mono', text: `${surgery.starts_at.slice(0, 10)} · ${timeRange(surgery)}` })
        : 'Sin horario';

    detailSurgeryId = id;
    document.getElementById('detail-title').textContent = 'Detalle de la cirugía';
    document.getElementById('detail-status').replaceChildren(statusBadge(surgery.status));
    document.getElementById('detail-body').replaceChildren(
        detailSection('Cirugía', [
            ['Estado', STATUS_LABEL[surgery.status]],
            ['Horario', schedule],
            ['Obra social', insuranceName(surgery.health_insurance_id)],
        ]),
        detailSection('Paciente', [
            ['Nombre', patient.name],
            ['DNI', el('span', { class: 'mono', text: patient.dni })],
            ['Correo', patient.email],
        ]),
        detailSection('Doctor', [
            ['Nombre', doctor.name],
            ['Especialidades', doctorSpecialties],
        ]),
        el('section', { class: 'detail-section' }, [el('h3', { text: 'Nota' }), el('p', { class: 'detail-note', text: surgery.note })]),
    );

    const actions = document.getElementById('detail-actions');
    const close = el('button', { type: 'button', class: 'btn btn-outline', id: 'detail-close', text: 'Cerrar' });
    close.addEventListener('click', closeDetail);
    actions.replaceChildren(close);

    if (can('surgeries.approve') && surgery.status === 'pending_approval') {
        const approve = el('button', { type: 'button', class: 'btn', 'data-permission': 'surgeries.approve', text: 'Aprobar' });
        approve.addEventListener('click', () => {
            closeDetail();
            openApprove(id);
        });
        actions.append(approve);
    }

    if (can('surgeries.schedule') && surgery.status === 'to_schedule') {
        const program = el('button', { type: 'button', class: 'btn', 'data-permission': 'surgeries.schedule', text: 'Programar' });
        program.addEventListener('click', () => {
            closeDetail();
            openSchedule(id);
        });
        actions.append(program);
    }

    document.getElementById('detail-modal').hidden = false;
    close.focus();
}

function closeDetail() {
    detailSurgeryId = null;
    document.getElementById('detail-modal').hidden = true;
}

function openModal() {
    const modal = document.getElementById('modal');
    modal.hidden = false;
    document.getElementById('modal-confirm').focus();
}

function closeModal() {
    modalMode = null;
    modalSurgeryId = null;
    document.getElementById('modal').hidden = true;
}

function backToDetail() {
    const id = modalSurgeryId;
    closeModal();
    if (id !== null) {
        openDetail(id);
    }
}

function openApprove(id) {
    const surgery = surgeryById(id);
    if (!can('surgeries.approve') || !surgery || surgery.status !== 'pending_approval') {
        return;
    }

    modalMode = 'approve';
    modalSurgeryId = id;
    document.getElementById('modal-title').textContent = 'Aprobar cirugía';
    document.getElementById('modal-message').textContent = 'Pasa a «A programar» y sigue sin horario.';
    document.getElementById('modal-confirm').textContent = 'Aprobar';
    openModal();
}

function openSchedule(id) {
    const surgery = surgeryById(id);
    if (!can('surgeries.schedule') || !surgery || surgery.status !== 'to_schedule') {
        return;
    }

    selectedDate = addDays(todayKey(), 1);
    visibleMonth = `${selectedDate.slice(0, 7)}-01`;
    mobileDayOpen = false;
    const firstGap = freeGaps(selectedDate, scheduledOn(selectedDate, id))[0];
    scheduleStart = firstGap ? fromMinutes(firstGap[0]) : '09:00';
    scheduleEnd = fromMinutes(toMinutes(scheduleStart) + 60);
    showView('calendar');
    scheduleTargetId = id;
    setCalendarSubtitle();
    renderCalendar();
}

function confirmModal() {
    if (modalMode === 'approve') {
        const surgery = surgeryById(modalSurgeryId);
        if (!surgery || surgery.status !== 'pending_approval' || !can('surgeries.approve')) {
            closeModal();
            return;
        }
        surgery.status = 'to_schedule';
        surgery.starts_at = null;
        surgery.ends_at = null;
        closeModal();
        renderList();
        openDetail(surgery.id);
        toast('Cirugía aprobada. Quedó a programar.', 'ok');
    }
}

function submitCreate(event) {
    event.preventDefault();
    if (!can('surgeries.create')) {
        return;
    }

    const error = document.getElementById('create-error');
    const note = document.getElementById('note').value.trim();
    const doctorId = Number(document.getElementById('doctor-id').value);
    const insuranceValue = document.getElementById('health-insurance-id').value;
    const patient = patientById(selectedPatientId);
    const doctor = doctorById(doctorId);

    if (!patient || !doctor || note === '') {
        error.hidden = false;
        error.textContent = 'Elegí un paciente, un doctor y escribí la nota.';
        return;
    }

    surgeries.unshift({
        id: nextId,
        patient_id: patient.id,
        doctor_id: doctor.id,
        note,
        health_insurance_id: insuranceValue === '' ? null : Number(insuranceValue),
        status: 'pending_approval',
        starts_at: null,
        ends_at: null,
    });
    nextId += 1;
    error.hidden = true;
    document.getElementById('create-form').reset();
    selectedPatientId = null;
    renderPatientResults();
    renderPicked();
    openSection('pending');
    toast('Solicitaste la cirugía.', 'ok');
}

function applyPermissionVisibility() {
    document.querySelectorAll('[data-permission]').forEach((node) => {
        if (!can(node.dataset.permission)) {
            node.hidden = true;
        }
    });
}

function bind() {
    document.getElementById('nav-surgeries').addEventListener('click', () => {
        navOpen = !navOpen;
        renderNav();
    });
    document.querySelectorAll('.nav-child').forEach((button) => {
        button.addEventListener('click', () => openSection(button.dataset.section));
    });
    document.getElementById('brand-home').addEventListener('click', () => {
        navOpen = true;
        openSection('pending');
    });
    document.getElementById('open-calendar').addEventListener('click', () => {
        if (can('surgeries.catalog.view')) {
            showView('calendar');
        }
    });
    document.getElementById('open-create').addEventListener('click', () => {
        if (can('surgeries.create')) {
            showView('create');
        }
    });
    document.getElementById('create-back').addEventListener('click', () => showView('list'));
    document.getElementById('calendar-back').addEventListener('click', () => showView('list'));
    document.getElementById('filter-form').addEventListener('submit', (event) => {
        event.preventDefault();
        applied = { ...applied, q: document.getElementById('filter-q').value };
        renderList();
    });
    document.getElementById('open-filters').addEventListener('click', openFilters);
    document.getElementById('filter-panel-back').addEventListener('click', closeFilters);
    document.getElementById('filter-panel').addEventListener('submit', (event) => {
        event.preventDefault();
        applied = {
            q: document.getElementById('filter-q').value,
            status: document.getElementById('filter-status').value,
            specialty_id: document.getElementById('filter-specialty').value,
            doctor_id: document.getElementById('filter-doctor').value,
            health_insurance_id: document.getElementById('filter-insurance').value,
        };
        closeFilters();
        renderList();
    });
    document.getElementById('detail-backdrop').addEventListener('click', closeDetail);
    document.getElementById('patient-q').addEventListener('input', () => {
        selectedPatientId = null;
        renderPicked();
        renderPatientResults();
    });
    document.getElementById('create-form').addEventListener('submit', submitCreate);
    document.getElementById('modal-cancel').addEventListener('click', backToDetail);
    document.getElementById('modal-backdrop').addEventListener('click', backToDetail);
    document.getElementById('modal-confirm').addEventListener('click', confirmModal);
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            if (!document.getElementById('modal').hidden) {
                backToDetail();
                return;
            }
            if (!document.getElementById('detail-modal').hidden) {
                closeDetail();
                return;
            }
            closeDrawer();
        }
    });

    const logout = () => toast('Esta demo no cierra la sesión.', 'info');
    document.getElementById('logout-desktop').addEventListener('click', logout);
    document.getElementById('logout-mobile').addEventListener('click', logout);

    document.getElementById('nav-toggle').addEventListener('click', () => {
        const sidebar = document.getElementById('sidebar');
        const showingNav = sidebar.classList.contains('is-open') && document.getElementById('sidebar-user-panel').hidden;
        const willOpen = !showingNav;
        sidebar.classList.toggle('is-open', willOpen);
        sidebar.dataset.open = willOpen ? 'true' : 'false';
        document.getElementById('sidebar-nav-panel').hidden = false;
        document.getElementById('sidebar-user-panel').hidden = true;
        document.getElementById('nav-toggle').setAttribute('aria-expanded', willOpen ? 'true' : 'false');
        document.getElementById('nav-toggle').setAttribute('aria-label', willOpen ? 'Cerrar menú' : 'Abrir menú');
        document.getElementById('user-toggle').setAttribute('aria-expanded', 'false');
        document.getElementById('user-toggle').setAttribute('aria-label', 'Abrir sesión');
    });

    document.getElementById('user-toggle').addEventListener('click', () => {
        const sidebar = document.getElementById('sidebar');
        const userPanel = document.getElementById('sidebar-user-panel');
        const willOpen = !(sidebar.classList.contains('is-open') && !userPanel.hidden);
        sidebar.classList.toggle('is-open', willOpen);
        sidebar.dataset.open = willOpen ? 'true' : 'false';
        document.getElementById('sidebar-nav-panel').hidden = willOpen;
        userPanel.hidden = !willOpen;
        document.getElementById('user-toggle').setAttribute('aria-expanded', willOpen ? 'true' : 'false');
        document.getElementById('user-toggle').setAttribute('aria-label', willOpen ? 'Cerrar cuenta' : 'Abrir sesión');
        document.getElementById('nav-toggle').setAttribute('aria-expanded', 'false');
        document.getElementById('nav-toggle').setAttribute('aria-label', 'Abrir menú');
    });

    window.addEventListener('resize', () => {
        if (view === 'calendar') {
            renderCalendar();
        }
    });
}

applyPermissionVisibility();
fillFilterSelects();
fillInsuranceSelect();
fillDoctors();
renderPatientResults();
renderList();
bind();
