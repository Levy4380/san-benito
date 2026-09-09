(() => {
  const STORAGE = 'sb-demo-doctor';
  const DOCTOR = {
    id: 1,
    name: 'Dra. Ana Pérez',
    specialty: 'Clínica médica',
    slotDurationMinutes: 20,
  };

  const ALL_PATIENTS = [
    { id: 1, name: 'Juan Paciente', firstName: 'Juan', lastName: 'Paciente', dni: '30111222', birthDate: '1990-03-15', healthInsurance: 'OSDE', memberNumber: '45218901', email: 'juan@sanbenito.test', phone: '11 5555-0101' },
    { id: 2, name: 'María Gómez', firstName: 'María', lastName: 'Gómez', dni: '28444555', birthDate: '1985-11-02', healthInsurance: 'Swiss Medical', memberNumber: '77881234', email: 'maria@sanbenito.test', phone: '11 5555-0202' },
    { id: 3, name: 'Carlos Ruiz', firstName: 'Carlos', lastName: 'Ruiz', dni: '32999888', birthDate: '1998-07-21', healthInsurance: 'Galeno', memberNumber: '99001122', email: 'carlos@sanbenito.test', phone: null },
    { id: 4, name: 'Lucía Fernández', firstName: 'Lucía', lastName: 'Fernández', dni: '35111222', birthDate: '2001-01-09', healthInsurance: 'IOMA', memberNumber: '33445566', email: 'lucia@sanbenito.test', phone: '11 5555-0404' },
    { id: 5, name: 'Pedro Sánchez', firstName: 'Pedro', lastName: 'Sánchez', dni: '26777888', birthDate: '1979-09-30', healthInsurance: 'PAMI', memberNumber: '11223344', email: 'pedro@sanbenito.test', phone: '11 5555-0505' },
  ];

  const MONTHS = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const DOW = ['D','L','M','X','J','V','S'];

  function pad(n) { return String(n).padStart(2, '0'); }
  function dateKey(iso) {
    const d = new Date(iso);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
  function formatDateLabel(key) {
    const [y, m, day] = key.split('-').map(Number);
    return new Date(y, m - 1, day).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
  }
  function formatTime(iso) {
    const d = new Date(iso);
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  /** "Dra. Ana Pérez" → "Dra. Pérez" */
  function doctorGreetingLabel(name) {
    const m = String(name || '').match(/^(Dra?\.?)\s+(.+)$/i);
    if (!m) return name || '';
    const title = /^dra/i.test(m[1]) ? 'Dra.' : 'Dr.';
    const parts = m[2].trim().split(/\s+/).filter(Boolean);
    const last = parts[parts.length - 1] || m[2];
    return `${title} ${last}`;
  }
  function formatUpcomingWhen(iso) {
    const d = new Date(iso);
    const day = d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' });
    return `${day} · ${formatTime(iso)}`;
  }
  function weekBounds(ref = new Date()) {
    const start = new Date(ref);
    start.setHours(0, 0, 0, 0);
    const dow = start.getDay();
    start.setDate(start.getDate() + (dow === 0 ? -6 : 1 - dow));
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    return { start, end };
  }
  function bookedThisWeek(limit = 3) {
    const { start, end } = weekBounds();
    const now = Date.now();
    return state.slots
      .filter((s) => {
        if (s.status !== 'booked') return false;
        const t = new Date(s.startsAt).getTime();
        return t >= Math.max(start.getTime(), now) && t < end.getTime();
      })
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
      .slice(0, limit);
  }

  /** Forced 24h picker (native type=time follows OS locale and may show AM/PM). */
  function time24Html(id, value, { stepMinutes = 5, blank = false } = {}) {
    const [hh = '', mm = ''] = (value || '').split(':');
    const hourOpts = (blank ? [''] : []).concat(Array.from({ length: 24 }, (_, i) => pad(i)));
    const minOpts = (blank ? [''] : []).concat(
      Array.from({ length: Math.floor(60 / stepMinutes) }, (_, i) => pad(i * stepMinutes)),
    );
    // Snap minutes to step if needed
    let mmSel = mm;
    if (mm && !minOpts.includes(mm)) {
      const n = Number(mm);
      mmSel = pad(Math.round(n / stepMinutes) * stepMinutes % 60);
    }
    return `
      <div class="time-24">
        <select id="${id}-h" aria-label="Hora (0–23)">
          ${hourOpts.map((h) => `<option value="${h}" ${h === hh ? 'selected' : ''}>${h === '' ? '—' : h}</option>`).join('')}
        </select>
        <span class="time-24-sep" aria-hidden="true">:</span>
        <select id="${id}-m" aria-label="Minutos">
          ${minOpts.map((m) => `<option value="${m}" ${m === mmSel ? 'selected' : ''}>${m === '' ? '—' : m}</option>`).join('')}
        </select>
      </div>
    `;
  }

  function readTime24(id) {
    const h = document.getElementById(`${id}-h`)?.value ?? '';
    const m = document.getElementById(`${id}-m`)?.value ?? '';
    if (h === '' || m === '') return '';
    return `${h}:${m}`;
  }

  function wireTime24(id, onChange) {
    const sync = () => onChange(readTime24(id));
    document.getElementById(`${id}-h`).onchange = sync;
    document.getElementById(`${id}-m`).onchange = sync;
  }
  function toIso(dateKeyStr, hhmm) {
    const [y, m, d] = dateKeyStr.split('-').map(Number);
    const [hh, mm] = hhmm.split(':').map(Number);
    return new Date(y, m - 1, d, hh, mm, 0, 0).toISOString();
  }
  function addMinutesIso(iso, minutes) {
    const d = new Date(iso);
    d.setMinutes(d.getMinutes() + minutes);
    return d.toISOString();
  }
  function minutesBetween(start, end) {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    return eh * 60 + em - (sh * 60 + sm);
  }
  function overlaps(aStart, aEnd, bStart, bEnd) {
    return aStart < bEnd && bStart < aEnd;
  }

  function seedSlots() {
    const slots = [];
    let id = 1;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    for (let d = 1; d <= 14; d++) {
      const day = new Date(start);
      day.setDate(start.getDate() + d);
      if (day.getDay() === 0 || day.getDay() === 6) continue;
      for (const h of [9, 10, 11, 14, 15]) {
        if ((d + h) % 3 !== 0) continue;
        const s = new Date(day);
        s.setHours(h, 0, 0, 0);
        const e = new Date(s);
        e.setMinutes(DOCTOR.slotDurationMinutes);
        slots.push({
          id: id++,
          startsAt: s.toISOString(),
          endsAt: e.toISOString(),
          status: 'available',
          patientId: null,
        });
      }
    }
    return slots;
  }

  const state = {
    authed: false,
    role: null,
    route: 'home',
    flash: '',
    slotDurationMinutes: DOCTOR.slotDurationMinutes,
    slots: seedSlots(),
    linkedPatientIds: [1, 2],
    patientsQ: '',
    patientsMode: 'list', // list | link
    linkQ: '',
    linkCandidates: [],
    agendaDate: null,
    agendaMode: 'slots', // slots | single
    assignSlotId: null,
    assignPatientId: null,
    profilePatientId: null,
    monthCursor: new Date(),
    programMonthCursor: new Date(),
    nextSlotId: 1000,
    program: {
      step: 1,
      dates: [], // multi-select; seeded with today on open
      start: '',
      end: '',
      draftFranjas: [], // UI-only; never written to slots
      blockWeekends: false,
    },
  };

  function ensureFakeWeekBookings() {
    const need = 3 - bookedThisWeek(3).length;
    if (need <= 0) return;
    const { start, end } = weekBounds();
    const now = Date.now();
    const patients = [1, 2, 3, 4];
    const hours = [9, 10, 11, 14, 15, 16];
    let created = 0;
    for (let dayOffset = 0; dayOffset < 7 && created < need; dayOffset++) {
      const day = new Date(start);
      day.setDate(start.getDate() + dayOffset);
      if (day.getDay() === 0 || day.getDay() === 6) continue;
      for (const h of hours) {
        if (created >= need) break;
        const s = new Date(day);
        s.setHours(h, 0, 0, 0);
        if (s.getTime() < now || s.getTime() >= end.getTime()) continue;
        if (state.slots.some((sl) => sl.startsAt === s.toISOString())) continue;
        const e = new Date(s);
        e.setMinutes(state.slotDurationMinutes);
        state.slots.push({
          id: state.nextSlotId++,
          startsAt: s.toISOString(),
          endsAt: e.toISOString(),
          status: 'booked',
          patientId: patients[created % patients.length],
        });
        created += 1;
      }
    }
  }

  (function seedDemoDays() {
    // One mixed day: keep a single booked slot among existing seed.
    const open = state.slots.find((s) => s.status === 'available');
    if (open) {
      open.status = 'booked';
      open.patientId = 1;
    }

    // Fully booked weekday for calendar "Todo reservado" (ámbar).
    const fullDay = new Date();
    fullDay.setHours(0, 0, 0, 0);
    let offset = 1;
    while (offset <= 10) {
      const d = new Date(fullDay);
      d.setDate(fullDay.getDate() + offset);
      if (d.getDay() !== 0 && d.getDay() !== 6) {
        fullDay.setTime(d.getTime());
        break;
      }
      offset += 1;
    }
    const key = dateKeyFromDate(fullDay);
    // Drop any partial seed on that day, then refill as all booked.
    state.slots = state.slots.filter((s) => dateKey(s.startsAt) !== key);
    const patients = [1, 2, 3, 4];
    [9, 10, 11, 14].forEach((h, i) => {
      const s = new Date(fullDay);
      s.setHours(h, 0, 0, 0);
      const e = new Date(s);
      e.setMinutes(state.slotDurationMinutes);
      state.slots.push({
        id: state.nextSlotId++,
        startsAt: s.toISOString(),
        endsAt: e.toISOString(),
        status: 'booked',
        patientId: patients[i % patients.length],
      });
    });

    ensureFakeWeekBookings();
  })();

  function showFlash(msg, opts) {
    state.flash = msg || '';
    if (window.DemoToast) window.DemoToast.show(msg, opts);
  }

  function persist() {
    sessionStorage.setItem(STORAGE, JSON.stringify({
      authed: state.authed,
      role: state.role,
      route: state.route,
      slotDurationMinutes: state.slotDurationMinutes,
      slots: state.slots,
      linkedPatientIds: state.linkedPatientIds,
      nextSlotId: state.nextSlotId,
    }));
  }

  function restore() {
    try {
      const raw = sessionStorage.getItem(STORAGE);
      if (!raw) return;
      const data = JSON.parse(raw);
      state.authed = !!data.authed;
      state.role = data.role || null;
      if (data.route) state.route = data.route;
      if (typeof data.slotDurationMinutes === 'number') state.slotDurationMinutes = data.slotDurationMinutes;
      if (Array.isArray(data.slots)) state.slots = data.slots;
      if (Array.isArray(data.linkedPatientIds)) state.linkedPatientIds = data.linkedPatientIds;
      if (typeof data.nextSlotId === 'number') state.nextSlotId = data.nextSlotId;
    } catch (_) { /* ignore */ }
  }

  function bootstrapFromLogin() {
    const role = sessionStorage.getItem('sb-demo-role');
    if (role === 'doctor') {
      sessionStorage.removeItem('sb-demo-role');
      state.authed = true;
      state.role = 'doctor';
      state.route = 'home';
      persist();
      return true;
    }
    return false;
  }

  function requireDoctorSession() {
    if (!state.authed || state.role !== 'doctor') {
      location.href = (window.DemoRouteLoader && window.DemoRouteLoader.loginHref)
        ? window.DemoRouteLoader.loginHref()
        : '../estable/index.html';
      return false;
    }
    return true;
  }

  function linkedPatients() {
    return ALL_PATIENTS.filter((p) => state.linkedPatientIds.includes(p.id));
  }
  function patientById(id) {
    return ALL_PATIENTS.find((p) => p.id === id);
  }
  function formatBirthDate(iso) {
    if (!iso) return '—';
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('es-AR');
  }

  function buildMonthCells(cursor) {
    const y = cursor.getFullYear();
    const m = cursor.getMonth();
    const first = new Date(y, m, 1);
    const startPad = first.getDay(); // Sunday-first
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < 42; i++) {
      const dayNum = i - startPad + 1;
      if (dayNum < 1 || dayNum > daysInMonth) {
        cells.push({ key: null, label: '', muted: true });
      } else {
        cells.push({ key: `${y}-${pad(m + 1)}-${pad(dayNum)}`, label: String(dayNum), muted: false });
      }
    }
    return cells;
  }

  function dayAgendaTone(slots) {
    if (!slots?.length) return 'empty';
    if (slots.every((s) => s.status === 'booked')) return 'full';
    return 'has';
  }

  function renderCalendar(container, { byDate, selectedKey, onSelect }) {
    const cursor = state.monthCursor;
    const cells = buildMonthCells(cursor);
    const title = `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`;
    container.innerHTML = `
      <div class="cal-head">
        <button type="button" class="btn btn-outline btn-sm" data-cal="-1" aria-label="Mes anterior"><span class="nav-arrow" aria-hidden="true">&lt;</span></button>
        <h2>${title}</h2>
        <button type="button" class="btn btn-outline btn-sm" data-cal="1" aria-label="Mes siguiente"><span class="nav-arrow" aria-hidden="true">&gt;</span></button>
      </div>
      <div class="cal-grid">
        ${DOW.map((d) => `<div class="cal-dow">${d}</div>`).join('')}
        ${cells.map((c) => {
          if (!c.key) return `<button type="button" class="day muted" disabled>&nbsp;</button>`;
          const tone = dayAgendaTone(byDate.get(c.key));
          const sel = selectedKey === c.key;
          const toneClass = tone === 'has' ? ' tone-has' : tone === 'full' ? ' tone-full' : ' tone-empty';
          return `<button type="button" class="day${toneClass}${sel ? ' selected' : ''}" data-day="${c.key}">${c.label}</button>`;
        }).join('')}
      </div>
      <div class="legend">
        <span><i class="swatch tone-empty"></i> Sin turnos</span>
        <span><i class="swatch tone-has"></i> Con turnos libres</span>
        <span><i class="swatch tone-full"></i> Todo reservado</span>
      </div>
    `;
    container.querySelector('[data-cal="-1"]').onclick = () => {
      state.monthCursor = new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1);
      render();
    };
    container.querySelector('[data-cal="1"]').onclick = () => {
      state.monthCursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
      render();
    };
    container.querySelectorAll('[data-day]').forEach((btn) => {
      btn.onclick = () => onSelect(btn.getAttribute('data-day'));
    });
  }

  function slotsByDate() {
    const map = new Map();
    for (const s of state.slots) {
      const k = dateKey(s.startsAt);
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(s);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    }
    return map;
  }

  function canCreateSlot(startsAt, endsAt) {
    if (!(new Date(startsAt) > new Date())) return 'El turno debe ser futuro.';
    if (!(new Date(endsAt) > new Date(startsAt))) return 'La hora de fin debe ser posterior al inicio.';
    for (const s of state.slots) {
      if (overlaps(startsAt, endsAt, s.startsAt, s.endsAt)) {
        return 'Se solapa con otro turno de tu agenda.';
      }
    }
    return null;
  }

  function createClassic(dateKeyStr, startTime) {
    const startsAt = toIso(dateKeyStr, startTime);
    const endsAt = addMinutesIso(startsAt, state.slotDurationMinutes);
    const err = canCreateSlot(startsAt, endsAt);
    if (err) { showFlash(err, { variant: 'warn' }); return; }
    state.slots.push({
      id: state.nextSlotId++,
      startsAt,
      endsAt,
      status: 'available',
      patientId: null,
    });
    showFlash('Creaste el turno.', { variant: 'ok' });
    state.agendaMode = 'slots';
    persist();
    render();
  }

  function dateKeyFromDate(d) {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  function todayKey() {
    return dateKeyFromDate(new Date());
  }

  function resetProgram() {
    const today = todayKey();
    state.program = {
      step: 1,
      dates: [today],
      start: '',
      end: '',
      draftFranjas: [],
      blockWeekends: false,
    };
    state.programMonthCursor = new Date();
  }

  function isWeekendKey(key) {
    const [y, m, d] = key.split('-').map(Number);
    const dow = new Date(y, m - 1, d).getDay();
    return dow === 0 || dow === 6;
  }

  function closeProgramFlow() {
    go('agenda');
  }

  function programSelectedDays() {
    let days = [...state.program.dates].sort();
    if (state.program.blockWeekends) days = days.filter((k) => !isWeekendKey(k));
    return days;
  }

  function programWhenValid() {
    return programSelectedDays().length > 0;
  }

  function countFranjaSlots(days, start, end) {
    if (!start || !end || minutesBetween(start, end) < state.slotDurationMinutes) {
      return { created: 0, skipped: 0, error: 'La franja debe ser al menos la duración del turno.' };
    }
    const duration = state.slotDurationMinutes;
    const now = new Date();
    let created = 0;
    let skipped = 0;
    const provisional = state.slots.map((s) => ({ startsAt: s.startsAt, endsAt: s.endsAt }));
    for (const key of days) {
      let cursor = start;
      while (minutesBetween(cursor, end) >= duration) {
        const startsAt = toIso(key, cursor);
        const endsAt = addMinutesIso(startsAt, duration);
        const blocked = !(new Date(startsAt) > now)
          || provisional.some((s) => overlaps(startsAt, endsAt, s.startsAt, s.endsAt));
        if (blocked) skipped += 1;
        else {
          created += 1;
          provisional.push({ startsAt, endsAt });
        }
        const [hh, mm] = cursor.split(':').map(Number);
        const next = hh * 60 + mm + duration;
        cursor = `${pad(Math.floor(next / 60))}:${pad(next % 60)}`;
      }
    }
    return { created, skipped, error: null };
  }

  function commitFranja(days, start, end) {
    const preview = countFranjaSlots(days, start, end);
    if (preview.error) { showFlash(preview.error); return; }
    if (!preview.created) { showFlash('No se pudo crear ningún turno (pasados o solapes).'); return; }
    const duration = state.slotDurationMinutes;
    let created = 0;
    for (const key of days) {
      let cursor = start;
      while (minutesBetween(cursor, end) >= duration) {
        const startsAt = toIso(key, cursor);
        const endsAt = addMinutesIso(startsAt, duration);
        if (canCreateSlot(startsAt, endsAt) === null) {
          state.slots.push({
            id: state.nextSlotId++,
            startsAt,
            endsAt,
            status: 'available',
            patientId: null,
          });
          created += 1;
        }
        const [hh, mm] = cursor.split(':').map(Number);
        const next = hh * 60 + mm + duration;
        cursor = `${pad(Math.floor(next / 60))}:${pad(next % 60)}`;
      }
    }
    showFlash(
      `Creaste ${created} turno(s)${preview.skipped ? ` · ${preview.skipped} omitido(s)` : ''}.`,
      { variant: 'ok' },
    );
    closeProgramFlow();
    persist();
  }

  async function deleteSlot(id) {
    const slot = state.slots.find((s) => s.id === id);
    if (!slot) return;
    if (slot.status !== 'available') {
      showFlash('Solo se pueden eliminar turnos disponibles. Cancelá el reservado primero.');
      return;
    }
    const ok = window.DemoConfirm
      ? await DemoConfirm.ask({
        title: 'Eliminar turno',
        message: '¿Eliminar este horario disponible? No se puede deshacer.',
        confirmLabel: 'Eliminar',
        cancelLabel: 'Volver',
        danger: true,
      })
      : window.confirm('¿Eliminar este turno?');
    if (!ok) return;
    state.slots = state.slots.filter((s) => s.id !== id);
    showFlash('Eliminaste el turno.', { variant: 'ok' });
    persist();
    render();
  }

  async function cancelSlot(id) {
    const slot = state.slots.find((s) => s.id === id);
    if (!slot || slot.status !== 'booked') return;
    const ok = window.DemoConfirm
      ? await DemoConfirm.ask({
        title: 'Cancelar turno',
        message: '¿Cancelar este turno reservado? El horario volverá a estar disponible.',
        confirmLabel: 'Cancelar turno',
        cancelLabel: 'Volver',
        danger: true,
      })
      : window.confirm('¿Cancelar este turno?');
    if (!ok) return;
    slot.status = 'available';
    slot.patientId = null;
    showFlash('Cancelaste el turno.', { variant: 'ok' });
    persist();
    render();
  }

  function assignSlot(id, patientId) {
    const slot = state.slots.find((s) => s.id === id);
    if (!slot || slot.status !== 'available') return;
    if (!state.linkedPatientIds.includes(patientId)) {
      showFlash('Solo podés asignar pacientes ya vinculados.');
      return;
    }
    slot.status = 'booked';
    slot.patientId = patientId;
    state.assignSlotId = null;
    state.assignPatientId = null;
    showFlash('Asignaste el turno al paciente.', { variant: 'ok' });
    persist();
    render();
  }

  function syncProgramWhenHint() {
    const hint = document.getElementById('program-when-hint');
    const count = document.getElementById('program-when-count');
    const next = document.getElementById('program-next-1');
    if (hint) {
      hint.textContent = 'Podés seleccionar hoy, un día o arrastrar varios.';
    }
    if (count) {
      const n = programSelectedDays().length;
      count.textContent = n === 1
        ? `1 día · ${formatDateLabel(programSelectedDays()[0])}`
        : `${n} días seleccionados.`;
      count.hidden = n === 0;
    }
    if (next) next.disabled = !programWhenValid();
  }

  function renderProgramCalendar(root) {
    const cursor = state.programMonthCursor;
    const cells = buildMonthCells(cursor);
    const title = `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`;
    const selected = new Set(state.program.dates);
    const blockWe = state.program.blockWeekends;
    const byDate = slotsByDate();
    const cal = root.querySelector('#program-cal');
    const panel = root.querySelector('#program-when-panel');
    if (!cal || !panel) return;

    cal.innerHTML = `
      <div class="cal-head">
        <button type="button" class="btn btn-outline btn-sm" data-pcal="-1" aria-label="Mes anterior"><span class="nav-arrow" aria-hidden="true">&lt;</span></button>
        <h2>${title}</h2>
        <button type="button" class="btn btn-outline btn-sm" data-pcal="1" aria-label="Mes siguiente"><span class="nav-arrow" aria-hidden="true">&gt;</span></button>
      </div>
      <div class="cal-grid">
        ${DOW.map((d) => `<div class="cal-dow">${d}</div>`).join('')}
        ${cells.map((c) => {
          if (!c.key) return `<button type="button" class="day muted" disabled>&nbsp;</button>`;
          const weekend = isWeekendKey(c.key);
          const blocked = blockWe && weekend;
          const sel = selected.has(c.key) && !blocked;
          const tone = dayAgendaTone(byDate.get(c.key));
          const toneClass = tone === 'has' ? 'tone-has' : tone === 'full' ? 'tone-full' : 'tone-empty';
          const cls = [
            'day',
            blocked ? 'muted' : toneClass,
            sel ? 'selected' : '',
          ].filter(Boolean).join(' ');
          return `<button type="button" class="${cls}" data-pday="${c.key}" ${blocked ? 'disabled' : ''}>${c.label}</button>`;
        }).join('')}
      </div>
      <div class="legend">
        <span><i class="swatch tone-empty"></i> Sin turnos</span>
        <span><i class="swatch tone-has"></i> Con turnos libres</span>
        <span><i class="swatch tone-full"></i> Todo reservado</span>
        <span><i class="swatch program-swatch-selected"></i> Seleccionado</span>
      </div>
    `;
    panel.innerHTML = `
      <h2 style="font-size:var(--text-lg)">Elegí los días</h2>
      <p class="hint" id="program-when-hint" style="margin-top:0.25rem"></p>
      <p class="hint" id="program-when-count"></p>
      <div class="panel-scroll" style="align-content:start;gap:var(--space-sm);padding-top:0.75rem">
        <label class="cal-check">
          <input type="checkbox" id="program-block-weekends" ${state.program.blockWeekends ? 'checked' : ''} />
          Bloquear fines de semana
        </label>
        <button type="button" class="btn btn-outline btn-sm" id="program-reset-days">Reset</button>
      </div>
      <button type="button" class="btn book-next-btn" id="program-next-1">Continuar <span class="nav-arrow" aria-hidden="true">&gt;</span></button>
    `;

    cal.querySelector('[data-pcal="-1"]').onclick = () => {
      state.programMonthCursor = new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1);
      render();
    };
    cal.querySelector('[data-pcal="1"]').onclick = () => {
      state.programMonthCursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
      render();
    };

    panel.querySelector('#program-block-weekends')?.addEventListener('change', (e) => {
      state.program.blockWeekends = e.target.checked;
      if (state.program.blockWeekends) {
        state.program.dates = state.program.dates.filter((k) => !isWeekendKey(k));
        if (!state.program.dates.length) state.program.dates = [todayKey()].filter((k) => !isWeekendKey(k));
      }
      render();
    });

    // Paint / drag select: pointerdown sets add vs remove; drag applies same mode.
    const grid = cal.querySelector('.cal-grid');
    const resetBtn = panel.querySelector('#program-reset-days');
    let painting = null; // true = add, false = remove

    const setDay = (key, on, btn) => {
      if (!key || btn?.disabled) return;
      if (on && state.program.blockWeekends && isWeekendKey(key)) return;
      const i = state.program.dates.indexOf(key);
      if (on && i < 0) state.program.dates.push(key);
      if (!on && i >= 0) state.program.dates.splice(i, 1);
      if (btn) btn.classList.toggle('selected', on);
      syncProgramWhenHint();
    };

    resetBtn?.addEventListener('click', () => {
      state.program.dates = [todayKey()];
      render();
    });

    const dayFromPoint = (x, y) => {
      const el = document.elementFromPoint(x, y);
      return el?.closest?.('[data-pday]') || null;
    };

    const endPaint = () => { painting = null; };

    grid.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      const btn = e.target.closest?.('[data-pday]');
      if (!btn || btn.disabled) return;
      e.preventDefault();
      const key = btn.getAttribute('data-pday');
      painting = !state.program.dates.includes(key);
      setDay(key, painting, btn);
      grid.setPointerCapture?.(e.pointerId);
    });
    grid.addEventListener('pointermove', (e) => {
      if (painting === null) return;
      const btn = dayFromPoint(e.clientX, e.clientY);
      if (btn && !btn.disabled) setDay(btn.getAttribute('data-pday'), painting, btn);
    });
    grid.addEventListener('pointerup', endPaint);
    grid.addEventListener('pointercancel', endPaint);
    grid.addEventListener('lostpointercapture', endPaint);
  }

  function syncProgramSteps() {
    const step = state.program.step;
    document.querySelectorAll('#program-steps .step-pill').forEach((el) => {
      const n = Number(el.dataset.step);
      el.classList.toggle('on', n === step);
      el.classList.toggle('done', n < step);
      el.setAttribute('aria-current', n === step ? 'step' : 'false');
    });
    const header = document.getElementById('program-header');
    const slot = document.getElementById('program-back-slot');
    const pastFirst = step > 1;
    header?.classList.toggle('page-header--back-title', pastFirst);
    if (!pastFirst) {
      if (slot) slot.innerHTML = '';
      return;
    }
    slot.innerHTML = `<button type="button" class="back-link" id="program-back"><span class="nav-arrow" aria-hidden="true">&lt;</span> Atrás</button>`;
    document.getElementById('program-back').onclick = () => {
      state.program.step = 1;
      state.program.start = '';
      state.program.end = '';
      state.program.draftFranjas = [];
      render();
    };
  }

  function renderProgram() {
    syncProgramSteps();
    const body = document.getElementById('program-body');
    const p = state.program;

    if (p.step === 1) {
      body.innerHTML = `
        <div class="agenda program-when-agenda">
          <div class="cal program-cal--paint" id="program-cal"></div>
          <div class="panel program-when-side" id="program-when-panel"></div>
        </div>
      `;
      renderProgramCalendar(body.querySelector('.program-when-agenda'));
      syncProgramWhenHint();
      document.getElementById('program-next-1').onclick = () => {
        if (!programWhenValid()) return;
        p.step = 2;
        p.start = '09:00';
        p.end = '12:00';
        p.draftFranjas = [];
        showFlash('Elegiste los días.');
        render();
      };
      return;
    }

    // step 2 horario — franjas solo en UI (demo); no escriben slots
    const days = programSelectedDays();
    if (!Array.isArray(p.draftFranjas)) p.draftFranjas = [];
    const draftOk = p.start && p.end && minutesBetween(p.start, p.end) >= state.slotDurationMinutes;
    body.innerHTML = `
      <div class="doctor-results program-horario-panel">
        <p class="hint book-context-line">${days.length === 1 ? formatDateLabel(days[0]) : `${days.length} días`} · turnos de ${state.slotDurationMinutes} min</p>
        <div class="program-time-fields">
          <div class="field" style="margin:0">
            <label for="program-start-h">Hora de inicio</label>
            ${time24Html('program-start', p.start || '', { blank: !p.start })}
          </div>
          <div class="field" style="margin:0">
            <label for="program-end-h">Hora de finalización</label>
            ${time24Html('program-end', p.end || '', { blank: !p.end })}
          </div>
        </div>
        <div class="program-franja-actions">
          <button type="button" class="btn btn-outline" id="program-add-franja" ${draftOk ? '' : 'disabled'}>Agregar franja</button>
        </div>
        <div class="program-franja-list" id="program-franja-list">
          ${p.draftFranjas.length ? `
            <h2 style="font-size:var(--text-md);margin:0">Franjas</h2>
            ${p.draftFranjas.map((f, i) => `
              <div class="slot-row program-franja-row">
                <p class="list-line">
                  <span class="mono">${f.start} — ${f.end}</span>
                  <span class="muted"> · ${days.length} día${days.length === 1 ? '' : 's'}</span>
                </p>
                <button type="button" class="btn btn-outline btn-sm" data-remove-franja="${i}">Quitar</button>
              </div>
            `).join('')}
          ` : '<p class="empty" style="margin:0">Todavía no agregaste franjas.</p>'}
        </div>
        <button type="button" class="btn book-next-btn" id="program-done" ${p.draftFranjas.length ? '' : 'disabled'}>Listo</button>
      </div>
    `;
    wireTime24('program-start', (v) => {
      p.start = v;
      render();
    });
    wireTime24('program-end', (v) => {
      p.end = v;
      render();
    });
    document.getElementById('program-add-franja').onclick = () => {
      if (!p.start || !p.end) {
        showFlash('Completá inicio y finalización.', { variant: 'warn' });
        return;
      }
      if (minutesBetween(p.start, p.end) < state.slotDurationMinutes) {
        showFlash('La franja debe ser al menos la duración del turno.', { variant: 'warn' });
        return;
      }
      const dup = p.draftFranjas.some((f) => f.start === p.start && f.end === p.end);
      if (dup) {
        showFlash('Esa franja ya está en la lista.', { variant: 'warn' });
        return;
      }
      p.draftFranjas.push({ start: p.start, end: p.end });
      showFlash('Agregaste una franja.', { variant: 'ok' });
      render();
    };
    body.querySelectorAll('[data-remove-franja]').forEach((btn) => {
      btn.onclick = () => {
        const i = Number(btn.getAttribute('data-remove-franja'));
        p.draftFranjas.splice(i, 1);
        showFlash('Quitaste la franja.');
        render();
      };
    });
    document.getElementById('program-done').onclick = () => {
      // Demo: no materializa slots ni persiste franjas
      showFlash('Franjas listas (demo: no se cargaron turnos).', { variant: 'ok' });
      closeProgramFlow();
    };
  }

  function renderSingleForm(panel) {
    panel.innerHTML = `
      <button type="button" class="back-link" id="single-back"><span class="nav-arrow" aria-hidden="true">&lt;</span> Atrás</button>
      <h2 style="font-size:var(--text-xl)">Cargar un turno</h2>
      <p class="hint" style="margin-top:0.25rem">
        ${formatDateLabel(state.agendaDate)} · ${state.slotDurationMinutes} min
      </p>
      <div class="panel-scroll" style="align-content:start">
        <div class="field" style="margin:0">
          <label for="single-start-h">Hora de inicio</label>
          ${time24Html('single-start', '09:00')}
        </div>
        <p class="hint" id="single-preview" style="margin:0"></p>
      </div>
      <button type="button" class="btn" id="single-submit" style="margin-top:auto;align-self:flex-start">Crear turno</button>
    `;
    const preview = document.getElementById('single-preview');
    const update = () => {
      const v = readTime24('single-start');
      if (!v) { preview.textContent = ''; return; }
      const end = addMinutesIso(toIso(state.agendaDate, v), state.slotDurationMinutes);
      preview.textContent = `Queda de ${v} a ${formatTime(end)}.`;
    };
    wireTime24('single-start', update);
    update();
    document.getElementById('single-back').onclick = () => { state.agendaMode = 'slots'; render(); };
    document.getElementById('single-submit').onclick = () => {
      const v = readTime24('single-start');
      if (!v) { showFlash('Elegí hora de inicio.'); return; }
      createClassic(state.agendaDate, v);
    };
  }

  function renderAgenda() {
    document.getElementById('agenda-subtitle').textContent =
      `Turnos de ${state.slotDurationMinutes} min.`;

    const byDate = slotsByDate();
    const panel = document.getElementById('agenda-panel');

    document.getElementById('agenda-root').style.gridTemplateColumns = '';
    renderCalendar(document.getElementById('agenda-cal'), {
      byDate,
      selectedKey: state.agendaDate,
      onSelect: (key) => {
        state.agendaDate = key;
        state.agendaMode = 'slots';
        state.assignSlotId = null;
        render();
      },
    });

    if (state.agendaMode === 'single' && state.agendaDate) {
      renderSingleForm(panel);
      return;
    }

    const viewDate = state.agendaDate || todayKey();
    const viewingDefaultToday = !state.agendaDate;
    const daySlots = byDate.get(viewDate) || [];
    const patients = linkedPatients();
    const emptyMsg = viewingDefaultToday
      ? 'Ya atendiste a todos hoy.'
      : 'Sin turnos este día.';
    const title = viewingDefaultToday
      ? 'Turnos de hoy'
      : formatDateLabel(viewDate);
    const assignTarget = state.assignPatientId ? patientById(state.assignPatientId) : null;
    panel.innerHTML = `
      <h2 style="font-size:var(--text-xl);text-transform:capitalize">${title}</h2>
      ${viewingDefaultToday ? '' : '<button type="button" class="back-link" id="day-clear"><span class="nav-arrow" aria-hidden="true">&lt;</span> Atrás</button>'}
      <p class="hint" style="margin-top:0.25rem">${daySlots.length ? `${daySlots.length} turno(s)${viewingDefaultToday ? ' hoy' : ' este día'}.` : emptyMsg}</p>
      ${assignTarget ? `
        <p class="hint" style="margin:0.35rem 0 0">
          Asignando turno a <strong>${assignTarget.name}</strong>.
          Elegí un horario disponible.
          <button type="button" class="back-link" id="assign-patient-clear" style="display:inline;padding:0;margin-left:0.35rem">Cancelar</button>
        </p>
      ` : ''}
      <div class="panel-scroll">
        ${daySlots.map((s) => {
          const patient = s.patientId ? patientById(s.patientId) : null;
          const assigning = state.assignSlotId === s.id;
          return `
            <article class="slot-row" style="flex-wrap:wrap;align-items:flex-start">
              <div style="min-width:0;flex:1">
                <p><strong>${formatTime(s.startsAt)} — ${formatTime(s.endsAt)}</strong>
                  <span class="muted"> · ${s.status === 'available' ? 'Disponible' : 'Reservado'}</span></p>
                ${patient ? `<p class="hint">Paciente: ${patient.name}</p>` : ''}
                ${assigning ? `
                  <div style="display:grid;gap:0.5rem;margin-top:0.5rem">
                    <select id="assign-select" ${patients.length ? '' : 'disabled'}>
                      <option value="">Seleccionar paciente</option>
                      ${patients.map((p) => `<option value="${p.id}" ${state.assignPatientId === p.id ? 'selected' : ''}>${p.name} · DNI ${p.dni}</option>`).join('')}
                    </select>
                    ${patients.length ? '' : '<p class="hint">No tenés pacientes vinculados.</p>'}
                    <div style="display:flex;gap:0.5rem;flex-wrap:wrap">
                      <button type="button" class="btn btn-sm" id="assign-confirm" ${patients.length ? '' : 'disabled'}>Confirmar</button>
                      <button type="button" class="btn btn-outline btn-sm" id="assign-cancel">Cancelar</button>
                    </div>
                  </div>
                ` : ''}
              </div>
              <div style="display:flex;gap:0.35rem;flex-wrap:wrap">
                ${s.status === 'available' && !assigning ? `
                  <button type="button" class="btn btn-sm" data-assign="${s.id}">${assignTarget ? 'Asignar a este' : 'Asignar'}</button>
                  <button type="button" class="btn btn-outline btn-sm" data-delete="${s.id}">Eliminar</button>
                ` : ''}
                ${s.status === 'booked' ? `
                  <button type="button" class="btn btn-outline btn-sm" data-cancel="${s.id}">Cancelar turno</button>
                ` : ''}
              </div>
            </article>
          `;
        }).join('')}
      </div>
      <button type="button" class="btn" id="open-single" style="margin-top:auto;align-self:flex-start">Cargar un turno</button>
    `;

    document.getElementById('day-clear')?.addEventListener('click', () => {
      state.agendaDate = null;
      state.assignSlotId = null;
      render();
    });
    document.getElementById('assign-patient-clear')?.addEventListener('click', () => {
      state.assignPatientId = null;
      state.assignSlotId = null;
      render();
    });
    document.getElementById('open-single').onclick = () => {
      state.agendaDate = viewDate;
      state.agendaMode = 'single';
      render();
    };
    panel.querySelectorAll('[data-delete]').forEach((b) => {
      b.onclick = () => deleteSlot(Number(b.getAttribute('data-delete')));
    });
    panel.querySelectorAll('[data-cancel]').forEach((b) => {
      b.onclick = () => cancelSlot(Number(b.getAttribute('data-cancel')));
    });
    panel.querySelectorAll('[data-assign]').forEach((b) => {
      b.onclick = () => {
        const slotId = Number(b.getAttribute('data-assign'));
        if (state.assignPatientId) {
          assignSlot(slotId, state.assignPatientId);
          return;
        }
        state.assignSlotId = slotId;
        render();
      };
    });
    const assignCancel = document.getElementById('assign-cancel');
    if (assignCancel) {
      assignCancel.onclick = () => { state.assignSlotId = null; render(); };
    }
    const assignConfirm = document.getElementById('assign-confirm');
    if (assignConfirm) {
      assignConfirm.onclick = () => {
        const sel = document.getElementById('assign-select');
        const pid = Number(sel.value);
        if (!pid) { showFlash('Seleccioná un paciente.'); return; }
        assignSlot(state.assignSlotId, pid);
      };
    }
  }

  function renderPatients() {
    const linking = state.patientsMode === 'link';
    const listPanel = document.getElementById('patients-list-panel');
    const linkPanel = document.getElementById('patients-link-panel');
    const subtitle = document.getElementById('patients-subtitle');
    const modeBtn = document.getElementById('patients-link-btn');

    listPanel.classList.toggle('hidden', linking);
    linkPanel.classList.toggle('hidden', !linking);
    subtitle.textContent = linking
      ? 'Buscá un paciente del sistema y vinculalo a tu práctica.'
      : 'Vinculados a tu práctica. El vínculo nace al reservar o al dar de alta.';
    modeBtn.textContent = linking ? 'Volver a la lista' : 'Vincular paciente';
    modeBtn.classList.toggle('btn-outline', linking);

    if (!linking) {
      const q = state.patientsQ.trim().toLowerCase();
      let list = linkedPatients();
      if (q) {
        list = list.filter((p) =>
          p.name.toLowerCase().includes(q) || p.dni.includes(q));
      }
      const box = document.getElementById('patients-list');
      const empty = document.getElementById('patients-empty');
      document.getElementById('patients-q').value = state.patientsQ;

      if (!list.length) {
        box.innerHTML = '';
        empty.classList.remove('hidden');
        empty.textContent = q ? 'No hay pacientes con ese filtro.' : 'Todavía no tenés pacientes vinculados.';
      } else {
        empty.classList.add('hidden');
        box.innerHTML = list.map((p) => `
          <article class="doctor-card" data-open-profile="${p.id}">
            <h3>${p.name}</h3>
            <p class="hint">DNI ${p.dni}</p>
            <p class="hint">${p.healthInsurance || '—'}</p>
            <button type="button" class="btn btn-sm" data-assign-patient="${p.id}" style="align-self:flex-start;margin-top:0.35rem">Asignar turno</button>
          </article>
        `).join('');
        box.querySelectorAll('[data-open-profile]').forEach((el) => {
          el.onclick = () => {
            state.profilePatientId = Number(el.getAttribute('data-open-profile'));
            go('patient-profile');
          };
        });
        box.querySelectorAll('[data-assign-patient]').forEach((btn) => {
          btn.onclick = (e) => {
            e.stopPropagation();
            state.assignPatientId = Number(btn.getAttribute('data-assign-patient'));
            state.assignSlotId = null;
            go('agenda');
          };
        });
      }
      return;
    }

    document.getElementById('link-q').value = state.linkQ;
    const box = document.getElementById('link-results');
    const empty = document.getElementById('link-empty');
    const q = state.linkQ.trim();
    if (!state.linkCandidates.length) {
      box.innerHTML = '';
      empty.classList.remove('hidden');
      empty.textContent = q.length >= 2
        ? 'No hay candidatos nuevos con esa búsqueda.'
        : 'Escribí al menos 2 caracteres y buscá para ver pacientes del sistema.';
      return;
    }
    empty.classList.add('hidden');
    box.innerHTML = state.linkCandidates.map((p) => `
      <article class="doctor-card" data-link-card="${p.id}">
        <h3>${p.name}</h3>
        <p class="hint">DNI ${p.dni}</p>
        <p class="hint">${p.healthInsurance || '—'}${p.memberNumber ? ` · ${p.memberNumber}` : ''}</p>
        <button type="button" class="btn btn-sm" data-link-patient="${p.id}" style="align-self:flex-start;margin-top:0.35rem">Vincular</button>
      </article>
    `).join('');
    box.querySelectorAll('[data-link-patient]').forEach((btn) => {
      btn.onclick = (e) => {
        e.stopPropagation();
        linkPatientById(Number(btn.getAttribute('data-link-patient')));
      };
    });
  }

  function linkPatientById(id) {
    if (!id || state.linkedPatientIds.includes(id)) return;
    state.linkedPatientIds.push(id);
    state.linkCandidates = [];
    state.linkQ = '';
    state.patientsMode = 'list';
    showFlash('Cargaste un paciente.', { variant: 'ok' });
    persist();
    renderPatients();
    wireMockPickers();
  }

  function renderPatientProfile() {
    const p = patientById(state.profilePatientId);
    if (!p) { go('patients'); return; }
    document.getElementById('patient-profile-subtitle').textContent = `DNI ${p.dni}`;
    const body = document.getElementById('patient-profile-body');
    body.innerHTML = `
      <dl class="profile-dl">
        <div><dt>Nombre</dt><dd>${p.firstName}</dd></div>
        <div><dt>Apellido</dt><dd>${p.lastName}</dd></div>
        <div><dt>Fecha de nacimiento</dt><dd>${formatBirthDate(p.birthDate)}</dd></div>
        <div><dt>DNI</dt><dd>${p.dni}</dd></div>
        <div><dt>Obra social</dt><dd>${p.healthInsurance || '—'}</dd></div>
        <div><dt>Número de socio</dt><dd>${p.memberNumber || '—'}</dd></div>
      </dl>
      <div class="profile-actions">
        <button type="button" class="btn" id="profile-assign-turn">Asignar turno</button>
      </div>
    `;
    document.getElementById('profile-assign-turn').onclick = () => {
      state.assignPatientId = p.id;
      state.assignSlotId = null;
      go('agenda');
    };
  }


  function renderSettings() {
    const body = document.getElementById('settings-body');
    body.innerHTML = `
      <div class="field" style="margin:0">
        <label for="slot-duration">Duración del turno (minutos)</label>
        <input id="slot-duration" type="number" min="5" max="120" step="5" value="${state.slotDurationMinutes}" />
        <p class="hint">Se usa al partir franjas en <strong>Programar turnos</strong>. No modifica turnos ya creados.</p>
      </div>
      <button type="button" class="btn" id="save-duration" style="align-self:flex-start">Guardar duración</button>
      <p class="hint" style="margin-top:auto">Para cargar franjas: <button type="button" class="back-link" id="goto-program" style="display:inline;padding:0">Programar turnos <span class="nav-arrow" aria-hidden="true">&gt;</span></button>.</p>
    `;
    document.getElementById('save-duration').onclick = () => {
      const n = Number(document.getElementById('slot-duration').value);
      if (!n || n < 5 || n > 120) { showFlash('Duración entre 5 y 120.'); return; }
      state.slotDurationMinutes = n;
      persist();
      showFlash('Guardaste la duración de turnos.', { variant: 'ok' });
    };
    document.getElementById('goto-program').onclick = () => go('program');
  }

  /* ========== Mobile drawers ========== */
  const appEl = document.getElementById('app');
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileUserBtn = document.getElementById('mobile-user-btn');
  const userPanel = document.getElementById('sidebar-user-panel');
  const navBackdrop = document.getElementById('nav-backdrop');

  function syncBackdrop() {
    const anyOpen = appEl.classList.contains('nav-open') || appEl.classList.contains('user-open');
    navBackdrop.setAttribute('aria-hidden', anyOpen ? 'false' : 'true');
  }
  function setNavOpen(open) {
    if (open) {
      appEl.classList.remove('user-open');
      mobileUserBtn.setAttribute('aria-expanded', 'false');
      mobileUserBtn.setAttribute('aria-label', 'Abrir cuenta');
      userPanel.setAttribute('hidden', '');
    }
    appEl.classList.toggle('nav-open', open);
    mobileMenuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    mobileMenuBtn.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    syncBackdrop();
  }
  function setUserOpen(open) {
    if (open) {
      appEl.classList.remove('nav-open');
      mobileMenuBtn.setAttribute('aria-expanded', 'false');
      mobileMenuBtn.setAttribute('aria-label', 'Abrir menú');
    }
    appEl.classList.toggle('user-open', open);
    mobileUserBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    mobileUserBtn.setAttribute('aria-label', open ? 'Cerrar cuenta' : 'Abrir cuenta');
    if (open) userPanel.removeAttribute('hidden');
    else userPanel.setAttribute('hidden', '');
    syncBackdrop();
  }
  function closeDrawers() {
    appEl.classList.remove('nav-open', 'user-open');
    mobileMenuBtn.setAttribute('aria-expanded', 'false');
    mobileMenuBtn.setAttribute('aria-label', 'Abrir menú');
    mobileUserBtn.setAttribute('aria-expanded', 'false');
    mobileUserBtn.setAttribute('aria-label', 'Abrir cuenta');
    userPanel.setAttribute('hidden', '');
    syncBackdrop();
  }
  mobileMenuBtn.addEventListener('click', () => setNavOpen(!appEl.classList.contains('nav-open')));
  mobileUserBtn.addEventListener('click', () => setUserOpen(!appEl.classList.contains('user-open')));
  navBackdrop.addEventListener('click', closeDrawers);
  window.addEventListener('resize', () => {
    if (window.matchMedia('(min-width: 1200px)').matches) closeDrawers();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDrawers();
  });

  function go(route) {
    const navigate = () => {
      state.route = route;
      if (route === 'agenda') {
        state.agendaDate = null;
        state.agendaMode = 'slots';
        state.assignSlotId = null;
        state.monthCursor = new Date();
      }
      if (route === 'program') {
        resetProgram();
      }
      if (route === 'patients') {
        state.patientsMode = 'list';
        state.linkQ = '';
        state.linkCandidates = [];
      }
      persist();
      render();
      const scroller = document.querySelector('.app.is-authed .main');
      if (scroller) scroller.scrollTo({ top: 0 });
    };
    if (window.DemoRouteLoader) window.DemoRouteLoader.run(navigate);
    else navigate();
  }

  document.getElementById('agenda-program-btn')?.addEventListener('click', () => go('program'));

  function render() {
    if (!requireDoctorSession()) return;
    appEl.classList.add('is-authed');
    if (!['home', 'agenda', 'program', 'patients', 'patient-profile', 'settings'].includes(state.route)) state.route = 'home';
    appEl.classList.toggle('is-home', state.route === 'home');

    document.querySelectorAll('.page').forEach((p) => p.classList.remove('active'));
    document.getElementById(`page-${state.route}`)?.classList.add('active');
    document.querySelectorAll('[data-nav]').forEach((btn) => {
      const nav = btn.getAttribute('data-nav');
      const onPatients = state.route === 'patients' || state.route === 'patient-profile';
      btn.classList.toggle('active', nav === state.route || (nav === 'patients' && onPatients));
    });

    document.getElementById('user-name').textContent = DOCTOR.name;
    document.getElementById('user-name-mobile').textContent = DOCTOR.name;
    const initials = DOCTOR.name.replace(/^(Dra?\.?\s*)/i, '').split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
    const avatar = document.querySelector('.user-avatar');
    if (avatar) avatar.textContent = initials || 'DR';
    document.getElementById('home-greeting').textContent = `Hola, ${doctorGreetingLabel(DOCTOR.name)}`;

    if (state.route === 'home') renderHomeUpcoming();
    if (state.route === 'agenda') renderAgenda();
    if (state.route === 'program') {
      if (!state.program.dates.length) resetProgram();
      renderProgram();
    }
    if (state.route === 'patients') renderPatients();
    if (state.route === 'patient-profile') renderPatientProfile();
    if (state.route === 'settings') renderSettings();
    wireMockPickers();
  }

  function renderHomeUpcoming() {
    const box = document.getElementById('home-upcoming');
    if (!box) return;
    const goAgenda = () => {
      state.agendaDate = null;
      go('agenda');
    };
    const head = `
      <div class="home-upcoming-head">
        <h2>Próximos turnos</h2>
        <button type="button" class="btn btn-outline home-upcoming-add" data-go-agenda aria-label="Ir a mi agenda">+</button>
      </div>`;
    const foot = `
      <div class="home-upcoming-foot">
        <button type="button" class="btn btn-outline" data-go-agenda>Ver turnos</button>
      </div>`;
    const list = bookedThisWeek(3);
    if (!list.length) {
      box.innerHTML = `
        ${head}
        <p class="home-upcoming-empty">Esta semana no tenés ningún turno.</p>
        ${foot}
      `;
    } else {
      box.innerHTML = `
        ${head}
        <ul class="home-upcoming-list">
          ${list.map((s) => {
            const patient = s.patientId ? patientById(s.patientId) : null;
            return `
              <li>
                <button type="button" class="home-upcoming-item" data-open-day="${dateKey(s.startsAt)}">
                  <span class="home-upcoming-when">${formatUpcomingWhen(s.startsAt)}</span>
                  <span class="home-upcoming-title">${patient ? patient.name : 'Paciente'}</span>
                  <span class="home-upcoming-meta">${formatTime(s.startsAt)} — ${formatTime(s.endsAt)}</span>
                </button>
              </li>`;
          }).join('')}
        </ul>
        ${foot}
      `;
    }
    box.querySelectorAll('[data-go-agenda]').forEach((btn) => {
      btn.addEventListener('click', goAgenda);
    });
    box.querySelectorAll('[data-open-day]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.agendaDate = btn.getAttribute('data-open-day');
        go('agenda');
      });
    });
  }

  document.querySelectorAll('[data-nav]').forEach((btn) => {
    btn.addEventListener('click', () => {
      closeDrawers();
      const route = btn.getAttribute('data-nav');
      if (route === 'agenda') state.assignPatientId = null;
      go(route);
    });
  });
  document.getElementById('brand-home').onclick = () => {
    closeDrawers();
    state.assignPatientId = null;
    go('home');
  };
  document.querySelectorAll('.logout-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      sessionStorage.removeItem(STORAGE);
      sessionStorage.removeItem('sb-demo-role');
      if (window.DemoToast) window.DemoToast.pending('Cerraste sesión.');
      if (window.DemoRouteLoader) window.DemoRouteLoader.navigate(window.DemoRouteLoader.loginHref());
      else location.href = (window.DemoRouteLoader && window.DemoRouteLoader.loginHref)
        ? window.DemoRouteLoader.loginHref()
        : '../estable/index.html';
    });
  });

  const demoToggle = document.getElementById('demo-toggle');
  const demoPanel = document.getElementById('demo-panel');
  demoToggle.onclick = () => {
    const open = demoPanel.classList.toggle('open');
    demoToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  };
  document.addEventListener('pointerdown', (e) => {
    if (!e.target.closest('.demo-chip') && demoPanel.classList.contains('open')) {
      demoPanel.classList.remove('open');
      demoToggle.setAttribute('aria-expanded', 'false');
    }
  });
  document.getElementById('reset-demo').onclick = () => {
    sessionStorage.removeItem(STORAGE);
    sessionStorage.removeItem('sb-demo-role');
    if (window.DemoToast) window.DemoToast.pending('Reiniciaste la demo.');
    if (window.DemoRouteLoader) window.DemoRouteLoader.navigate(window.DemoRouteLoader.loginHref());
    else location.href = (window.DemoRouteLoader && window.DemoRouteLoader.loginHref)
        ? window.DemoRouteLoader.loginHref()
        : '../estable/index.html';
  };

  document.getElementById('patient-profile-back').onclick = () => {
    state.patientsMode = 'list';
    go('patients');
  };
  document.getElementById('patients-link-btn').onclick = () => {
    if (state.patientsMode === 'link') {
      state.patientsMode = 'list';
      state.linkQ = '';
      state.linkCandidates = [];
    } else {
      state.patientsMode = 'link';
    }
    renderPatients();
    wireMockPickers();
  };
  document.getElementById('patients-filter').onsubmit = (e) => {
    e.preventDefault();
    state.patientsQ = document.getElementById('patients-q').value;
    renderPatients();
  };
  document.getElementById('link-filter').onsubmit = (e) => {
    e.preventDefault();
    state.linkQ = document.getElementById('link-q').value;
    const q = state.linkQ.trim().toLowerCase();
    if (q.length < 2) {
      state.linkCandidates = [];
      showFlash('Mínimo 2 caracteres.', { variant: 'warn' });
    } else {
      state.linkCandidates = ALL_PATIENTS.filter((p) =>
        !state.linkedPatientIds.includes(p.id)
        && (p.name.toLowerCase().includes(q) || p.dni.includes(q)));
      showFlash(
        state.linkCandidates.length
          ? `Encontramos ${state.linkCandidates.length} paciente(s).`
          : 'Sin resultados para esa búsqueda.',
        state.linkCandidates.length ? undefined : { variant: 'warn' },
      );
    }
    renderPatients();
    wireMockPickers();
  };

  function mockPatientItems(list) {
    return list.flatMap((p) => [
      { value: p.name.split(/\s+/).slice(-1)[0], label: p.name, meta: `DNI ${p.dni}` },
      { value: p.dni, label: p.dni, meta: p.name },
    ]);
  }

  function wireMockPickers() {
    if (!window.DemoMockPicker) return;
    DemoMockPicker.attach(document.getElementById('patients-q'), () => mockPatientItems(ALL_PATIENTS), {
      title: 'Pacientes mock',
    });
    DemoMockPicker.attach(document.getElementById('link-q'), () => mockPatientItems(
      ALL_PATIENTS.filter((p) => !state.linkedPatientIds.includes(p.id)),
    ), {
      title: 'Candidatos mock',
    });
    const assignSelect = document.getElementById('assign-select');
    if (assignSelect) {
      if (!assignSelect.closest('.field')) {
        const wrap = document.createElement('div');
        wrap.className = 'field';
        wrap.style.margin = '0';
        const label = document.createElement('label');
        label.htmlFor = 'assign-select';
        label.textContent = 'Paciente';
        assignSelect.before(wrap);
        wrap.appendChild(label);
        wrap.appendChild(assignSelect);
      }
      DemoMockPicker.attach(assignSelect, () => linkedPatients().map((p) => ({
        value: String(p.id),
        label: p.name,
        meta: `DNI ${p.dni}`,
      })), {
        title: 'Pacientes mock',
      });
    }
    const duration = document.getElementById('slot-duration');
    if (duration) {
      DemoMockPicker.attach(duration, [
        { value: '15', label: '15 min' },
        { value: '20', label: '20 min (default)' },
        { value: '30', label: '30 min' },
        { value: '45', label: '45 min' },
        { value: '60', label: '60 min' },
      ], { title: 'Duraciones demo' });
    }
  }

  restore();
  ensureFakeWeekBookings();
  if (!state.authed) bootstrapFromLogin();
  if (!requireDoctorSession()) return;
  render();
  wireMockPickers();
})();
