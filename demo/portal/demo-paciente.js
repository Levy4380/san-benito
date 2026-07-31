    /* ========== Fake data ========== */
    const PATIENT = {
      name: 'Juan Paciente',
      email: 'juan@sanbenito.test',
      password: 'password',
      dni: '30111222',
    };

    const SPECIALTIES = [
      { id: 1, name: 'Clínica médica' },
      { id: 2, name: 'Cardiología' },
      { id: 3, name: 'Pediatría' },
      { id: 4, name: 'Traumatología' },
      { id: 5, name: 'Dermatología' },
      { id: 6, name: 'Ginecología' },
      { id: 7, name: 'Oftalmología' },
      { id: 8, name: 'Neurología' },
    ];

    const INSURANCE_POOL = ['OSDE', 'Swiss Medical', 'Galeno', 'Medicus', 'PAMI', 'IOMA'];
    const DOCTORS_RAW = [
      { id: 1, name: 'Dra. Ana Pérez', specialtyId: 1, specialty: 'Clínica médica' },
      { id: 2, name: 'Dr. Luis Gómez', specialtyId: 2, specialty: 'Cardiología' },
      { id: 3, name: 'Dra. María López', specialtyId: 3, specialty: 'Pediatría' },
      { id: 4, name: 'Dr. Martín Ríos', specialtyId: 1, specialty: 'Clínica médica' },
      { id: 5, name: 'Dra. Valentina Sosa', specialtyId: 2, specialty: 'Cardiología' },
      { id: 6, name: 'Dr. Pablo Fernández', specialtyId: 4, specialty: 'Traumatología' },
      { id: 7, name: 'Dra. Camila Herrera', specialtyId: 5, specialty: 'Dermatología' },
      { id: 8, name: 'Dra. Florencia Díaz', specialtyId: 6, specialty: 'Ginecología' },
      { id: 9, name: 'Dr. Diego Álvarez', specialtyId: 7, specialty: 'Oftalmología' },
      { id: 10, name: 'Dra. Sofía Navarro', specialtyId: 8, specialty: 'Neurología' },
      { id: 11, name: 'Dr. Andrés Molina', specialtyId: 3, specialty: 'Pediatría' },
      { id: 12, name: 'Dra. Lucía Benítez', specialtyId: 1, specialty: 'Clínica médica' },
      { id: 13, name: 'Dr. Julián Castro', specialtyId: 4, specialty: 'Traumatología' },
      { id: 14, name: 'Dra. Paula Romero', specialtyId: 5, specialty: 'Dermatología' },
      { id: 15, name: 'Dr. Nicolás Aguirre', specialtyId: 2, specialty: 'Cardiología' },
      { id: 16, name: 'Dra. Elena Quiroga', specialtyId: 8, specialty: 'Neurología' },
    ];
    const DOCTORS = DOCTORS_RAW.map((d) => {
      const cleaned = d.name.replace(/^(Dra?\.?\s*)/i, '');
      const parts = cleaned.split(/\s+/);
      return {
        ...d,
        firstName: parts[0] || '',
        lastName: parts.slice(1).join(' ') || '',
        document: String(20000000 + d.id * 111111),
        license: `MN ${10000 + d.id * 37}`,
        insurances: INSURANCE_POOL.filter((_, j) => (d.id + j) % 3 !== 0).slice(0, 3),
      };
    });

    /** Seed available slots for the next ~3 weeks (weekdays). */
    function seedSlots() {
      const slots = [];
      let id = 1;
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      for (let d = 1; d <= 21; d++) {
        const day = new Date(start);
        day.setDate(start.getDate() + d);
        const wd = day.getDay();
        if (wd === 0 || wd === 6) continue;
        for (const doc of DOCTORS) {
          const hours = doc.id % 2 === 0 ? [9, 10, 11] : [14, 15, 16];
          for (const h of hours) {
            if ((d + doc.id + h) % 5 !== 0) continue; // sparse with more doctors
            const s = new Date(day);
            s.setHours(h, 0, 0, 0);
            const e = new Date(s);
            e.setMinutes(20);
            slots.push({
              id: id++,
              doctorId: doc.id,
              startsAt: s.toISOString(),
              endsAt: e.toISOString(),
              status: 'available',
            });
          }
        }
      }
      return slots;
    }

    const state = {
      route: 'home',
      authed: false,
      role: null,
      flash: '',
      slots: seedSlots(),
      bookings: [],
      doctorsFilter: { specialty: '', name: '' },
      slotsDoctorId: null,
      profileDoctorId: null,
      slotsDate: null,
      book: { step: 1, specialtyId: null, doctorId: null, date: null, slotsView: 'list' },
      myView: 'list', // list | calendar
      myDate: null,
      monthCursor: new Date(),
    };

    function weekBounds(ref = new Date()) {
      const start = new Date(ref);
      start.setHours(0, 0, 0, 0);
      const dow = start.getDay();
      start.setDate(start.getDate() + (dow === 0 ? -6 : 1 - dow));
      const end = new Date(start);
      end.setDate(start.getDate() + 7);
      return { start, end };
    }

    /* ========== Helpers ========== */
    const MONTHS = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    const DOW = ['D','L','M','X','J','V','S'];

    function pad(n) { return String(n).padStart(2, '0'); }
    function dateKey(iso) {
      const d = new Date(iso);
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    }
    function formatDateLabel(key) {
      const [y, m, day] = key.split('-').map(Number);
      const d = new Date(y, m - 1, day);
      return d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
    }
    function formatTime(iso) {
      const d = new Date(iso);
      return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
    function formatUpcomingWhen(iso) {
      const d = new Date(iso);
      const day = d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' });
      return `${day} · ${formatTime(iso)}`;
    }
    function doctorById(id) { return DOCTORS.find((d) => d.id === id); }
    function bookingsThisWeek(limit = 3) {
      const { start, end } = weekBounds();
      const now = Date.now();
      return [...state.bookings]
        .filter((b) => {
          const t = new Date(b.startsAt).getTime();
          return t >= Math.max(start.getTime(), now) && t < end.getTime();
        })
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
        .slice(0, limit);
    }

    /** Ensure ≥3 fake bookings remain this week (demo). */
    function ensureFakeWeekBookings() {
      const need = 3 - bookingsThisWeek(3).length;
      if (need <= 0) return;
      const { start, end } = weekBounds();
      const now = Date.now();
      const doctorIds = [1, 2, 3, 4];
      const hours = [9, 10, 11, 14, 15, 16];
      let nextId = Math.max(9000, ...state.slots.map((s) => s.id), ...state.bookings.map((b) => b.id)) + 1;
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
          const occupied = state.bookings.some((b) => b.startsAt === s.toISOString())
            || state.slots.some((sl) => sl.startsAt === s.toISOString());
          if (occupied) continue;
          const e = new Date(s);
          e.setMinutes(20);
          const doctorId = doctorIds[created % doctorIds.length];
          const id = nextId++;
          state.slots.push({
            id,
            doctorId,
            startsAt: s.toISOString(),
            endsAt: e.toISOString(),
            status: 'booked',
          });
          state.bookings.push({
            id,
            doctorId,
            startsAt: s.toISOString(),
            endsAt: e.toISOString(),
          });
          created += 1;
        }
      }
    }

    ensureFakeWeekBookings();
    function showFlash(msg, opts) {
      state.flash = msg || '';
      if (window.DemoToast) window.DemoToast.show(msg, opts);
    }

    function persist() {
      sessionStorage.setItem('sb-demo', JSON.stringify({
        authed: state.authed,
        role: state.role,
        bookings: state.bookings,
        slots: state.slots,
        route: state.route,
      }));
    }
    function restore() {
      try {
        const raw = sessionStorage.getItem('sb-demo');
        if (!raw) return;
        const data = JSON.parse(raw);
        state.authed = !!data.authed;
        state.role = data.role || null;
        if (Array.isArray(data.slots)) state.slots = data.slots;
        if (Array.isArray(data.bookings)) state.bookings = data.bookings;
        if (data.route && data.authed) state.route = data.route;
      } catch (_) { /* ignore */ }
    }

    function requirePatientSession() {
      if (!state.authed || state.role !== 'patient') {
        location.href = (window.DemoRouteLoader && window.DemoRouteLoader.loginHref)
        ? window.DemoRouteLoader.loginHref()
        : '../estable/index.html';
        return false;
      }
      return true;
    }

    /* ========== Calendar ========== */
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
          cells.push({
            key: `${y}-${pad(m + 1)}-${pad(dayNum)}`,
            label: String(dayNum),
            muted: false,
          });
        }
      }
      return cells;
    }

    function renderCalendar(container, { markedKeys, selectedKey, onSelect, showLegend, legendEmpty, legendMarked }) {
      const cursor = state.monthCursor;
      const cells = buildMonthCells(cursor);
      const title = `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`;
      const emptyLabel = legendEmpty || 'Sin turnos';
      const markedLabel = legendMarked || 'Con turnos';
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
            const has = markedKeys.has(c.key);
            const sel = selectedKey === c.key;
            return `<button type="button" class="day${has ? ' has' : ''}${sel ? ' selected' : ''}" data-day="${c.key}">${c.label}</button>`;
          }).join('')}
        </div>
        ${showLegend ? `<div class="legend"><span><i class="swatch"></i> ${emptyLabel}</span><span><i class="swatch has"></i> ${markedLabel}</span></div>` : ''}
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

    /* ========== Views ========== */
    function renderDoctors() {
      const { specialty, name } = state.doctorsFilter;
      const list = document.getElementById('doctors-list');
      const empty = document.getElementById('doctors-empty');
      document.getElementById('specialty').value = specialty;
      document.getElementById('doctor-name').value = name;

      let doctors = [];
      const hasSpecialty = specialty !== '';
      const hasName = name.trim() !== '';
      if (hasSpecialty || hasName) {
        doctors = DOCTORS.filter((d) => {
          const okSpec = !hasSpecialty || specialty === 'all' || String(d.specialtyId) === specialty;
          const okName = !hasName || d.name.toLowerCase().includes(name.trim().toLowerCase());
          return okSpec && okName;
        });
      }

      if (!doctors.length) {
        list.innerHTML = '';
        empty.classList.remove('hidden');
        empty.textContent = hasSpecialty || hasName
          ? 'No hay profesionales con ese filtro.'
          : 'Seleccioná una especialidad o escribí un nombre para ver profesionales.';
        return;
      }
      empty.classList.add('hidden');
      list.innerHTML = doctors.map((d) => `
        <article class="doctor-card" data-open-profile="${d.id}">
          <h3>${d.name}</h3>
          <p class="hint">${d.specialty}</p>
          <button type="button" class="btn btn-sm" data-open-slots="${d.id}" style="align-self:flex-start;margin-top:0.35rem">Ver turnos</button>
        </article>
      `).join('');
      list.querySelectorAll('[data-open-profile]').forEach((el) => {
        el.onclick = () => {
          state.profileDoctorId = Number(el.getAttribute('data-open-profile'));
          go('doctor-profile');
        };
      });
      list.querySelectorAll('[data-open-slots]').forEach((btn) => {
        btn.onclick = (e) => {
          e.stopPropagation();
          state.slotsDoctorId = Number(btn.getAttribute('data-open-slots'));
          state.slotsDate = null;
          state.monthCursor = new Date();
          go('slots');
        };
      });
    }

    function renderDoctorProfile() {
      const doc = doctorById(state.profileDoctorId);
      if (!doc) { go('doctors'); return; }
      document.getElementById('doctor-profile-subtitle').textContent = `${doc.specialty}`;
      const body = document.getElementById('doctor-profile-body');
      body.innerHTML = `
        <dl class="profile-dl">
          <div><dt>Nombre</dt><dd>${doc.firstName}</dd></div>
          <div><dt>Apellido</dt><dd>${doc.lastName}</dd></div>
          <div><dt>Documento</dt><dd>${doc.document}</dd></div>
          <div><dt>Matrícula</dt><dd>${doc.license}</dd></div>
          <div><dt>Especialidad</dt><dd>${doc.specialty}</dd></div>
          <div><dt>Obras sociales</dt><dd>${doc.insurances.join(', ')}</dd></div>
        </dl>
        <div class="profile-actions">
          <button type="button" class="btn" id="profile-open-slots">Ver turnos</button>
        </div>
      `;
      document.getElementById('profile-open-slots').onclick = () => {
        state.slotsDoctorId = doc.id;
        state.slotsDate = null;
        state.monthCursor = new Date();
        go('slots');
      };
    }

    function slotsForDoctor(doctorId) {
      return state.slots
        .filter((s) => s.doctorId === doctorId && s.status === 'available')
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    }

    function renderSlots() {
      const doc = doctorById(state.slotsDoctorId);
      if (!doc) { go('doctors'); return; }
      document.getElementById('slots-subtitle').textContent = `${doc.name} · ${doc.specialty}. Elegí un día marcado.`;
      const slots = slotsForDoctor(doc.id);
      const byDate = new Map();
      for (const s of slots) {
        const k = dateKey(s.startsAt);
        if (!byDate.has(k)) byDate.set(k, []);
        byDate.get(k).push(s);
      }
      const marked = new Set(byDate.keys());
      renderCalendar(document.getElementById('slots-cal'), {
        markedKeys: marked,
        selectedKey: state.slotsDate,
        showLegend: true,
        legendEmpty: 'Sin turnos',
        legendMarked: 'Con turnos',
        onSelect: (key) => { state.slotsDate = key; render(); },
      });

      const panel = document.getElementById('slots-panel');
      if (!state.slotsDate) {
        const upcomingDays = [...byDate.entries()].slice(0, 5);
        panel.innerHTML = `
          <h2 style="font-size:var(--text-lg)">Turnos próximos</h2>
          <p class="hint" style="margin-top:0.25rem">Tocá uno para ver el día.</p>
          ${upcomingDays.length ? `
            <div class="panel-scroll">
              ${upcomingDays.map(([k, list]) => `
                <button type="button" class="list-row" data-pick-day="${k}">
                  <p class="list-line">
                    <strong style="text-transform:capitalize">${formatDateLabel(k)}</strong>
                    <span class="muted"> · Disponible · ${list.length} turno${list.length === 1 ? '' : 's'}</span>
                  </p>
                </button>
              `).join('')}
            </div>
          ` : '<p class="empty" style="margin-top:0.75rem">No hay turnos próximos disponibles.</p>'}
        `;
        panel.querySelectorAll('[data-pick-day]').forEach((b) => {
          b.onclick = () => { state.slotsDate = b.getAttribute('data-pick-day'); render(); };
        });
        return;
      }

      const daySlots = byDate.get(state.slotsDate) || [];
      panel.innerHTML = `
        <h2 style="font-size:var(--text-xl);text-transform:capitalize">${formatDateLabel(state.slotsDate)}</h2>
        <button type="button" class="back-link" id="slots-back-day"><span class="nav-arrow" aria-hidden="true">&lt;</span> Atrás</button>
        <p class="hint">${daySlots.length ? `${daySlots.length} horario(s) disponible(s).` : 'No hay turnos disponibles este día.'}</p>
        ${daySlots.length ? `
          <div class="panel-scroll">
            ${daySlots.map((s) => `
              <div class="slot-row">
                <p class="list-line">
                  <span class="mono">${formatTime(s.startsAt)} — ${formatTime(s.endsAt)}</span>
                  <span class="muted"> · ${doc.name}</span>
                </p>
                <button type="button" class="btn btn-sm" data-book="${s.id}">Reservar</button>
              </div>
            `).join('')}
          </div>
        ` : '<p class="empty" style="margin-top:0.75rem">Sin turnos este día.</p>'}
      `;
      document.getElementById('slots-back-day').onclick = () => { state.slotsDate = null; render(); };
      panel.querySelectorAll('[data-book]').forEach((b) => {
        b.onclick = () => bookSlot(Number(b.getAttribute('data-book')));
      });
    }

    function bookSlot(slotId) {
      const slot = state.slots.find((s) => s.id === slotId && s.status === 'available');
      if (!slot) {
        showFlash('El turno ya no está disponible.', { variant: 'warn' });
        render();
        return;
      }
      slot.status = 'booked';
      state.bookings.push({
        id: slot.id,
        doctorId: slot.doctorId,
        startsAt: slot.startsAt,
        endsAt: slot.endsAt,
      });
      state.bookings.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
      persist();
      showFlash('Reservaste el turno.', { variant: 'ok' });
      state.myView = 'list';
      state.myDate = null;
      go('my');
    }

    function renderBookBackSlot() {
      const header = document.querySelector('#page-book > .page-header');
      const slot = document.getElementById('book-back-slot');
      const pastFirst = state.book.step > 1;
      header?.classList.toggle('page-header--back-title', pastFirst);
      if (!pastFirst) {
        slot.innerHTML = '';
        return;
      }
      const prev = state.book.step - 1;
      slot.innerHTML = `<button type="button" class="back-link" id="book-back"><span class="nav-arrow" aria-hidden="true">&lt;</span> Atrás</button>`;
      document.getElementById('book-back').onclick = () => {
        state.book.step = prev;
        if (prev === 1) {
          state.book.doctorId = null;
          state.book.date = null;
        }
        if (prev === 2) state.book.date = null;
        render();
      };
    }

    function renderBook() {
      const steps = document.querySelectorAll('#book-steps .step-pill');
      steps.forEach((el) => {
        const n = Number(el.dataset.step);
        el.classList.toggle('on', n === state.book.step);
        el.classList.toggle('done', n < state.book.step);
        el.setAttribute('aria-current', n === state.book.step ? 'step' : 'false');
      });
      renderBookBackSlot();
      const body = document.getElementById('book-body');

      if (state.book.step === 1) {
        body.innerHTML = `
          <div class="center-stage">
            <div class="doctor-results book-specialty-panel">
              <div class="field" style="margin:0">
                <label for="book-specialty">Especialidad</label>
                <select id="book-specialty">
                  <option value="">Seleccionar especialidad</option>
                  ${SPECIALTIES.map((s) => `<option value="${s.id}" ${state.book.specialtyId === s.id ? 'selected' : ''}>${s.name}</option>`).join('')}
                </select>
              </div>
              <button type="button" class="btn book-next-btn" id="book-next-1" ${state.book.specialtyId ? '' : 'disabled'}>Continuar <span class="nav-arrow" aria-hidden="true">&gt;</span></button>
            </div>
          </div>
        `;
        document.getElementById('book-specialty').onchange = (e) => {
          state.book.specialtyId = e.target.value ? Number(e.target.value) : null;
          state.book.doctorId = null;
          state.book.date = null;
          render();
        };
        document.getElementById('book-next-1').onclick = () => {
          if (!state.book.specialtyId) return;
          state.book.step = 2;
          showFlash('Elegiste la especialidad.');
          render();
        };
        return;
      }

      if (state.book.step === 2) {
        const docs = DOCTORS.filter((d) => d.specialtyId === state.book.specialtyId);
        const spec = SPECIALTIES.find((s) => s.id === state.book.specialtyId);
        body.innerHTML = `
          <div class="center-stage">
            <div class="doctor-results book-doctors-panel">
              <p class="hint book-context-line">Especialidad: <strong>${spec?.name || ''}</strong></p>
              <div class="doctor-grid doctor-grid--3">
                ${docs.map((d) => `
                  <article class="doctor-card${state.book.doctorId === d.id ? ' is-selected' : ''}" data-pick-doc="${d.id}" role="button" tabindex="0" aria-pressed="${state.book.doctorId === d.id ? 'true' : 'false'}">
                    <h3>${d.name}</h3>
                    <p class="hint">${d.specialty}</p>
                  </article>
                `).join('')}
              </div>
              <button type="button" class="btn book-next-btn" id="book-next-2" ${state.book.doctorId ? '' : 'disabled'}>Continuar <span class="nav-arrow" aria-hidden="true">&gt;</span></button>
            </div>
          </div>
        `;
        body.querySelectorAll('[data-pick-doc]').forEach((el) => {
          const pick = () => {
            state.book.doctorId = Number(el.getAttribute('data-pick-doc'));
            state.book.date = null;
            render();
          };
          el.onclick = pick;
          el.onkeydown = (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              pick();
            }
          };
        });
        document.getElementById('book-next-2').onclick = () => {
          if (!state.book.doctorId) return;
          state.book.step = 3;
          state.monthCursor = new Date();
          showFlash('Elegiste el doctor.');
          render();
        };
        return;
      }

      // step 3
      const doc = doctorById(state.book.doctorId);
      const slots = slotsForDoctor(doc.id);
      const byDate = new Map();
      for (const s of slots) {
        const k = dateKey(s.startsAt);
        if (!byDate.has(k)) byDate.set(k, []);
        byDate.get(k).push(s);
      }
      if (state.book.slotsView !== 'split') state.book.slotsView = 'list';
      const onList = state.book.slotsView === 'list';
      body.innerHTML = `
        <div class="center-stage">
          <div class="doctor-results book-slots-panel">
            <div class="book-slots-bar">
              <p class="hint">${doc.name} · ${doc.specialty}</p>
              <button type="button" class="btn btn-outline btn-sm" id="book-view-toggle">${onList ? 'Calendario' : 'Lista'}</button>
            </div>
            ${onList ? `
              <div class="panel book-slots-inner" id="book-panel"></div>
            ` : `
              <div class="agenda book-slots-agenda">
                <div class="cal" id="book-cal"></div>
                <div class="panel" id="book-panel"></div>
              </div>
            `}
          </div>
        </div>
      `;
      document.getElementById('book-view-toggle').onclick = () => {
        state.book.slotsView = onList ? 'split' : 'list';
        if (onList) state.monthCursor = new Date();
        render();
      };
      if (!onList) {
        renderCalendar(document.getElementById('book-cal'), {
          markedKeys: new Set(byDate.keys()),
          selectedKey: state.book.date,
          showLegend: true,
          legendEmpty: 'Sin turnos',
          legendMarked: 'Con turnos',
          onSelect: (key) => { state.book.date = key; render(); },
        });
      }
      const panel = document.getElementById('book-panel');
      if (!state.book.date) {
        if (onList) {
          const upcomingDays = [...byDate.entries()].slice(0, 12);
          panel.innerHTML = `
            <h2 style="font-size:var(--text-lg)">Turnos próximos</h2>
            <p class="hint" style="margin-top:0.25rem">Tocá uno para ver el día.</p>
            ${upcomingDays.length ? `
              <div class="panel-scroll">
                ${upcomingDays.map(([k, list]) => `
                  <button type="button" class="list-row" data-pick-day="${k}">
                    <p class="list-line">
                      <strong style="text-transform:capitalize">${formatDateLabel(k)}</strong>
                      <span class="muted"> · Disponible · ${list.length} turno${list.length === 1 ? '' : 's'}</span>
                    </p>
                  </button>
                `).join('')}
              </div>
            ` : '<p class="empty" style="margin-top:0.75rem">No hay turnos disponibles.</p>'}
          `;
          panel.querySelectorAll('[data-pick-day]').forEach((b) => {
            b.onclick = () => { state.book.date = b.getAttribute('data-pick-day'); render(); };
          });
        } else {
          panel.innerHTML = `
            <h2 style="font-size:var(--text-lg)">Elegí un día</h2>
            <p class="hint" style="margin-top:0.25rem">Los días marcados tienen turnos disponibles. Tocá uno en el calendario para ver los horarios.</p>
          `;
        }
      } else {
        const daySlots = byDate.get(state.book.date) || [];
        panel.innerHTML = `
          <h2 style="font-size:var(--text-xl);text-transform:capitalize">${formatDateLabel(state.book.date)}</h2>
          <button type="button" class="back-link" id="book-clear-day"><span class="nav-arrow" aria-hidden="true">&lt;</span> Atrás</button>
          <p class="hint">${daySlots.length ? `${daySlots.length} horario(s) disponible(s).` : 'No hay turnos este día.'}</p>
          ${daySlots.length ? `
            <div class="panel-scroll">
              ${daySlots.map((s) => `
                <div class="slot-row">
                  <p class="list-line">
                    <span class="mono">${formatTime(s.startsAt)} — ${formatTime(s.endsAt)}</span>
                    <span class="muted"> · ${doc.name}</span>
                  </p>
                  <button type="button" class="btn btn-sm" data-book="${s.id}">Reservar</button>
                </div>
              `).join('')}
            </div>
          ` : '<p class="empty" style="margin-top:0.75rem">Sin turnos este día.</p>'}
        `;
        document.getElementById('book-clear-day').onclick = () => { state.book.date = null; render(); };
        panel.querySelectorAll('[data-book]').forEach((b) => {
          b.onclick = () => {
            bookSlot(Number(b.getAttribute('data-book')));
            state.book = { step: 1, specialtyId: null, doctorId: null, date: null, slotsView: 'list' };
          };
        });
      }
    }

    function renderMyDayPanel(panel, byDate, dayKey) {
      const dayList = byDate.get(dayKey) || [];
      panel.innerHTML = `
        <h2 style="font-size:var(--text-xl);text-transform:capitalize">${formatDateLabel(dayKey)}</h2>
        <p class="hint">${dayList.length ? `${dayList.length} turno(s) este día.` : 'No tenés turnos este día.'}</p>
        ${dayList.length ? `
          <div class="panel-scroll">
            ${dayList.map((b) => {
              const doc = doctorById(b.doctorId);
              return `
                <div class="slot-row">
                  <p class="list-line">
                    <strong>${doc.name}</strong>
                    <span class="muted"> · ${doc.specialty} · </span>
                    <span class="mono">${formatTime(b.startsAt)} — ${formatTime(b.endsAt)}</span>
                  </p>
                  <button type="button" class="btn btn-danger btn-sm" data-cancel="${b.id}">Cancelar</button>
                </div>`;
            }).join('')}
          </div>
        ` : '<p class="empty" style="margin-top:0.75rem">Sin turnos este día.</p>'}
      `;
      panel.querySelectorAll('[data-cancel]').forEach((btn) => {
        btn.onclick = () => cancelBooking(Number(btn.getAttribute('data-cancel')));
      });
    }

    function renderMy() {
      const body = document.getElementById('my-body');
      const switchBtn = document.getElementById('my-all-btn');
      const subtitle = document.getElementById('my-subtitle');
      const bookings = [...state.bookings].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
      const byDate = new Map();
      for (const b of bookings) {
        const k = dateKey(b.startsAt);
        if (!byDate.has(k)) byDate.set(k, []);
        byDate.get(k).push(b);
      }

      if (state.myView === 'all' || state.myView === 'upcoming') state.myView = 'list';
      if (state.myView === 'day') state.myView = 'calendar';
      if (!['list', 'calendar'].includes(state.myView)) state.myView = 'list';

      const onList = state.myView === 'list';
      switchBtn.textContent = onList ? 'Calendario' : 'Lista';
      subtitle.textContent = onList
        ? 'Próximos turnos.'
        : 'Calendario de tus reservas.';
      switchBtn.onclick = () => {
        if (onList) {
          state.myView = 'calendar';
          state.myDate = bookings.length ? dateKey(bookings[0].startsAt) : dateKey(new Date().toISOString());
          const d = new Date((state.myDate || '') + 'T12:00:00');
          if (!Number.isNaN(d.getTime())) state.monthCursor = d;
        } else {
          state.myView = 'list';
          state.myDate = null;
        }
        render();
      };

      if (onList) {
        body.innerHTML = `
          <div class="center-stage">
            <div class="doctor-results">
              <div class="doctor-results-head">
                <h2>Próximos turnos</h2>
                <p class="hint">${bookings.length ? `${bookings.length} turno(s)` : 'Ninguno próximo'}</p>
              </div>
              ${bookings.length ? `
                <div class="panel-scroll">
                  ${bookings.map((b) => {
                    const doc = doctorById(b.doctorId);
                    return `
                      <div class="slot-row">
                        <p class="list-line">
                          <strong>${doc.name}</strong>
                          <span class="muted"> · ${doc.specialty} · ${formatDateLabel(dateKey(b.startsAt))} · </span>
                          <span class="mono">${formatTime(b.startsAt)} — ${formatTime(b.endsAt)}</span>
                        </p>
                        <button type="button" class="btn btn-danger btn-sm" data-cancel="${b.id}">Cancelar</button>
                      </div>`;
                  }).join('')}
                </div>
              ` : '<p class="empty">Sin turnos.</p>'}
            </div>
          </div>
        `;
        body.querySelectorAll('[data-cancel]').forEach((btn) => {
          btn.onclick = () => cancelBooking(Number(btn.getAttribute('data-cancel')));
        });
        return;
      }

      if (!state.myDate) {
        state.myDate = bookings.length
          ? dateKey(bookings[0].startsAt)
          : dateKey(new Date().toISOString());
      }

      body.innerHTML = `
        <div class="agenda">
          <div class="cal" id="my-cal"></div>
          <div class="panel" id="my-panel"></div>
        </div>
      `;
      renderCalendar(document.getElementById('my-cal'), {
        markedKeys: new Set(byDate.keys()),
        selectedKey: state.myDate,
        showLegend: true,
        legendEmpty: 'Sin turnos',
        legendMarked: 'Con turnos',
        onSelect: (key) => { state.myDate = key; state.myView = 'calendar'; render(); },
      });
      renderMyDayPanel(document.getElementById('my-panel'), byDate, state.myDate);
    }

    async function cancelBooking(id) {
      const ok = window.DemoConfirm
        ? await DemoConfirm.ask({
          title: 'Cancelar turno',
          message: '¿Cancelar este turno? El horario volverá a estar disponible.',
          confirmLabel: 'Cancelar turno',
          cancelLabel: 'Volver',
          danger: true,
        })
        : window.confirm('¿Cancelar este turno?');
      if (!ok) return;
      const booking = state.bookings.find((b) => b.id === id);
      if (!booking) return;
      state.bookings = state.bookings.filter((b) => b.id !== id);
      const slot = state.slots.find((s) => s.id === id);
      if (slot) slot.status = 'available';
      persist();
      showFlash('Cancelaste el turno.', { variant: 'ok' });
      render();
    }

    /* ========== Router ========== */
    function go(route) {
      const navigate = () => {
        state.route = route;
        if (route === 'book') {
          state.book = { step: 1, specialtyId: null, doctorId: null, date: null, slotsView: 'list' };
        }
        if (route === 'my') {
          state.myView = 'list';
          state.myDate = null;
        }
        persist();
        render();
        const scroller = document.querySelector('.app.is-authed .main') || document.querySelector('.app') || window;
        if (scroller === window) {
          window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
        } else {
          scroller.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
        }
      };
      if (window.DemoRouteLoader) window.DemoRouteLoader.run(navigate);
      else navigate();
    }

    function render() {
      const app = document.getElementById('app');
      app.classList.add('is-authed');

      if (!['home', 'doctors', 'doctor-profile', 'slots', 'book', 'my'].includes(state.route)) {
        state.route = 'home';
      }

      app.classList.toggle('is-home', state.route === 'home');

      document.querySelectorAll('.page').forEach((p) => p.classList.remove('active'));
      const page = document.getElementById(`page-${state.route}`);
      if (page) page.classList.add('active');

      document.querySelectorAll('[data-nav]').forEach((btn) => {
        const nav = btn.getAttribute('data-nav');
        const onDoctors = ['doctors', 'doctor-profile', 'slots'].includes(state.route);
        btn.classList.toggle('active', nav === state.route || (nav === 'doctors' && onDoctors));
      });

      document.getElementById('user-name').textContent = PATIENT.name;
      const userNameMobile = document.getElementById('user-name-mobile');
      if (userNameMobile) userNameMobile.textContent = PATIENT.name;
      const initials = PATIENT.name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
      const avatar = document.querySelector('.user-avatar');
      if (avatar) avatar.textContent = initials || 'U';
      const firstName = PATIENT.name.split(' ')[0];
      document.getElementById('home-greeting').textContent = `Hola, ${firstName}`;

      if (state.route === 'home') renderHomeUpcoming();
      if (state.route === 'doctors') renderDoctors();
      if (state.route === 'doctor-profile') renderDoctorProfile();
      if (state.route === 'slots') renderSlots();
      if (state.route === 'book') renderBook();
      if (state.route === 'my') renderMy();
      wireMockPickers();
    }

    function renderHomeUpcoming() {
      const box = document.getElementById('home-upcoming');
      if (!box) return;
      const head = `
        <div class="home-upcoming-head">
          <h2>Próximos turnos</h2>
          <button type="button" class="btn btn-outline home-upcoming-add" data-nav="my" aria-label="Ir a mis turnos">+</button>
        </div>`;
      const foot = `
        <div class="home-upcoming-foot">
          <button type="button" class="btn btn-outline" data-nav="my">Ver turnos</button>
        </div>`;
      const list = bookingsThisWeek(3);
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
            ${list.map((b) => {
              const doc = doctorById(b.doctorId);
              return `
                <li>
                  <button type="button" class="home-upcoming-item" data-nav="my">
                    <span class="home-upcoming-when">${formatUpcomingWhen(b.startsAt)}</span>
                    <span class="home-upcoming-title">${doc ? doc.name : 'Profesional'}</span>
                    <span class="home-upcoming-meta">${doc ? doc.specialty : ''}</span>
                  </button>
                </li>`;
            }).join('')}
          </ul>
          ${foot}
        `;
      }
      box.querySelectorAll('[data-nav]').forEach((btn) => {
        btn.addEventListener('click', () => go(btn.getAttribute('data-nav')));
      });
    }

    /* ========== Mobile nav / user drawers ========== */
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
    function toggleNav() {
      setNavOpen(!appEl.classList.contains('nav-open'));
    }
    function toggleUser() {
      setUserOpen(!appEl.classList.contains('user-open'));
    }
    mobileMenuBtn.addEventListener('click', toggleNav);
    mobileUserBtn.addEventListener('click', toggleUser);
    navBackdrop.addEventListener('click', closeDrawers);

    /* ========== Events ========== */
    document.querySelectorAll('[data-go]').forEach((btn) => {
      btn.addEventListener('click', () => go(btn.getAttribute('data-go')));
    });
    document.getElementById('doctor-profile-back').onclick = () => go('doctors');
    document.querySelectorAll('[data-nav]').forEach((btn) => {
      btn.addEventListener('click', () => {
        closeDrawers();
        go(btn.getAttribute('data-nav'));
      });
    });
    document.getElementById('brand-home').onclick = () => {
      closeDrawers();
      go('home');
    };
    function logout() {
      sessionStorage.removeItem('sb-demo');
      sessionStorage.removeItem('sb-demo-role');
      if (window.DemoToast) window.DemoToast.pending('Cerraste sesión.');
      if (window.DemoRouteLoader) window.DemoRouteLoader.navigate(window.DemoRouteLoader.loginHref());
      else location.href = (window.DemoRouteLoader && window.DemoRouteLoader.loginHref)
        ? window.DemoRouteLoader.loginHref()
        : '../estable/index.html';
    }
    document.querySelectorAll('.logout-btn').forEach((btn) => {
      btn.addEventListener('click', logout);
    });
    window.addEventListener('resize', () => {
      if (window.matchMedia('(min-width: 1200px)').matches) closeDrawers();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeDrawers();
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
      sessionStorage.removeItem('sb-demo');
      sessionStorage.removeItem('sb-demo-role');
      if (window.DemoToast) window.DemoToast.pending('Reiniciaste la demo.');
      if (window.DemoRouteLoader) window.DemoRouteLoader.navigate(window.DemoRouteLoader.loginHref());
      else location.href = (window.DemoRouteLoader && window.DemoRouteLoader.loginHref)
        ? window.DemoRouteLoader.loginHref()
        : '../estable/index.html';
    };
    document.getElementById('doctors-filter').onsubmit = (e) => {
      e.preventDefault();
      state.doctorsFilter = {
        specialty: document.getElementById('specialty').value,
        name: document.getElementById('doctor-name').value,
      };
      showFlash('Actualizaste la búsqueda.');
      render();
    };
    (function fillSpecialtySelects() {
      const sel = document.getElementById('specialty');
      sel.innerHTML = [
        '<option value="">Seleccionar especialidad</option>',
        '<option value="all">Todas</option>',
        ...SPECIALTIES.map((s) => `<option value="${s.id}">${s.name}</option>`),
      ].join('');
    })();

    function mockDoctorItems() {
      return DOCTORS.map((d) => ({
        value: d.name.replace(/^(Dra?\.?\s*)/i, '').split(/\s+/)[0],
        label: d.name,
        meta: d.specialty,
      }));
    }

    function mockSpecialtyItems(includeAll) {
      const items = SPECIALTIES.map((s) => ({
        value: String(s.id),
        label: s.name,
      }));
      if (includeAll) items.unshift({ value: 'all', label: 'Todas' });
      return items;
    }

    function wireMockPickers() {
      if (!window.DemoMockPicker) return;
      DemoMockPicker.attach(document.getElementById('specialty'), mockSpecialtyItems(true), {
        title: 'Especialidades mock',
      });
      DemoMockPicker.attach(document.getElementById('doctor-name'), mockDoctorItems(), {
        title: 'Doctores mock',
      });
      const bookSpec = document.getElementById('book-specialty');
      if (bookSpec) {
        DemoMockPicker.attach(bookSpec, mockSpecialtyItems(false), {
          title: 'Especialidades mock',
        });
      }
    }

    restore();
    ensureFakeWeekBookings();
    if (!requirePatientSession()) { /* redirecting */ }
    else {
      if (!state.route || state.route === 'welcome' || state.route === 'login') state.route = 'home';
      state.authed = true;
      state.role = 'patient';
      persist();
      render();
      wireMockPickers();
    }

