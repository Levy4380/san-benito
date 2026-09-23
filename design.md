# Design — San Benito

A locked visual design system for the Clínico skin. Product rules live in `new-design.md`. Every page redesign reads this file before emitting UI. Do not regenerate per page — amend this file when the system needs to grow.

Skin: **Clínico only** (light). No theme picker. No other skins.

## Genre
modern-minimal

## Tone
austere · clinical white · blue signal CTAs

## Macrostructure family
- Auth: austere single-column card on a paper band (logo + establishment + form)
- App home: centered hero (watermark + greeting + stacked CTAs + this-week preview)
- App pages: Index-First — `page-header` then one content stage (calendar / results recuadro / list)

There is no marketing / institutional site.

## Theme · Clínico (light)

Vibe: `clinical white, blue CTAs, austere`
Axes: light / geometric-sans / cool

### Color tokens

Hue 255 throughout except danger (hue 25) and calendar “full” (hue ~55).

| Token | Value | Use |
| --- | --- | --- |
| `--color-paper` | `oklch(99% 0.006 255)` | Main canvas, cards, inputs, filled outline buttons |
| `--color-paper-2` | `oklch(96.5% 0.01 255)` | Page frame behind the app, nested panels, filter/auth wells |
| `--color-paper-3` | `oklch(93.5% 0.014 255)` | Idle step-pill tracks |
| `--color-ink` | `oklch(22% 0.02 255)` | Body text, outline-button text, toasts (info) |
| `--color-ink-2` | `oklch(48% 0.016 255)` | Subtitles, hints, idle nav, labels |
| `--color-rule` | `oklch(88% 0.012 255)` | Hairline borders (`--rule-hair`) |
| `--color-accent` | `oklch(47% 0.16 255)` | Primary fill, active nav, selected day, step “on”, success toast |
| `--color-accent-ink` | `oklch(99% 0.004 255)` | Text/icon on accent (and on ink toasts) |
| `--color-accent-soft` | `oklch(92% 0.045 255)` | Selected cards, done step track, picker hover |
| `--color-focus` | `oklch(52% 0.18 255)` | Focus ring only |
| `--color-danger` | `oklch(52% 0.18 25)` | Destructive buttons, error text, warn toasts |

Accent occupies ≤ ~5% of the viewport (CTAs, active nav, selected calendar day, step “on”). Never wash a page in accent.

Hardcoded calendar tones (not tokens — keep these hex/oklch pairs):

| Day | Background | Ink |
| --- | --- | --- |
| Default / empty | `oklch(90–92% 0.005–0.008 260)` | `--color-ink-2` / `oklch(55% 0.02 260)` |
| Has bookings (`tone-has`) | `oklch(88% 0.06 250)` | `oklch(32% 0.08 250)` |
| Full (`tone-full`) | `oklch(88% 0.12 55)` | `oklch(35% 0.1 45)` |
| Selected | `--color-accent` | `--color-accent-ink` + inset white ring |

Muted days (other month): opacity 0.35, not clickable.

### Type tokens

- Display: Inter Tight, weight 600 (headings) / 700 (wordmark “San Benito”). Never italic.
- Body: IBM Plex Sans 400 / 500 / 600
- Mono: IBM Plex Mono 400 / 500 — times, dates, member numbers only
- Display tracking: `-0.02em` on headings; wordmark last line `-0.03em`
- Scale: `--text-xs` 0.75rem · `--text-sm` 0.875rem · `--text-md` 1rem · `--text-lg` 1.25rem · `--text-xl` 1.5rem · `--text-display` `clamp(2rem, 3.5vw, 3rem)` (1.45rem on ≤767px)
- Body size: `--text-md`, line-height 1.45
- Page title: `--text-xl` (≈1.35–1.4rem on tablet/phone)

### Space

4-point named scale: `--space-3xs` 0.25rem · `2xs` 0.5rem · `xs` 0.75rem · `sm` 1rem · `md` 1.5rem · `lg` 2rem · `xl` 3rem.

### Radius

| Token | Value | Applies to |
| --- | --- | --- |
| `--radius-input` | **6px** | Buttons, inputs, selects, nav items, back-link hit, day cells, text-row hover |
| `--radius-card` | **8px** | Surfaces, result recuadros, calendar/panel, toasts, confirm dialog, booking/doctor cards, demo panel |
| `--app-radius` | **0.85rem** | Outer app shell + mobile chrome header + drawer |
| Pill / logo | `999px` / `50%` | Logo disc, user avatar, mock-picker trigger |
| Step node / swatch | 2px | Step-pill bar, calendar legend swatch |

On phones (≤767px) calendar/panel/results may use `calc(var(--radius-card) + 2px)` — do not invent a third token.

### Control size

Shared height for inputs, selects, and adjacent primary buttons:

- `--control-h`: **2.75rem** (2.35rem ≤767px)
- `--control-h-sm`: **2.25rem** (1.95rem ≤767px)
- `--btn-pad-x`: 0.85rem (0.7rem ≤767px); `--btn-pad-y` unused — height is locked, padding-x only
- Filter “Buscar” and header actions match `--control-h` (header actions drop to `--control-h-sm` on phone)

### Shadow

`--shadow-color`: `oklch(22% 0.02 255 / 0.14)`
- `--shadow-sm`: `0 1px 2px` — default primary buttons
- `--shadow-md`: `0 6px 18px`
- `--shadow-lg`: `0 10px 28px` — toasts, confirm dialog

Outline / small / in-row buttons: **no shadow**. Programar / Mi agenda sticky footers (Continuar, day CTAs): **no shadow** — hairline top only.

### Motion

- `--ease-out`: `cubic-bezier(0.16, 1, 0.3, 1)`
- `--dur-short`: 180ms
- Page enter: opacity 0.55 → 1 in `--dur-short` (none on reduced-motion: opacity-only ≤150ms)
- App pages: no entrance reveals besides that fade
- Buttons: color / border / shadow in `--dur-short`; **active = `translateY(1px)`**; never bounce, never scale
- Hover on filled buttons: `filter: brightness(1.05)` (not a color rewrite)

### Focus

`--focus-ring`: `2px solid var(--color-focus)`, offset 2px (1px on nested search fields). Same ring on `.btn`, `.nav-btn`, `.day`, `.list-row`, `.booking-card`, `.home-card`, `.home-upcoming-item`, inputs, selects.

---

## Buttons — variants and logic

Default class `.btn` is **primary**. Combine with modifiers; do not invent new fills.

### Geometry (all `.btn*`)

- Radius: `--radius-input` (6px)
- Inline-flex, center, gap 0.35rem
- Font: body, weight **500**, size `--text-sm` (xs on phone)
- Border: 1px solid transparent (outline paints the rule)
- Disabled: opacity 0.45, `cursor: not-allowed`, no hover filter

### Primary — `.btn`

Fill `--color-accent`, text `--color-accent-ink`, `--shadow-sm`.
Hover: brightness 1.05. Active: 1px down.

Use for the **one** forward action in a region: Logear (paciente), Reservar, Buscar, Continuar, Crear turno, Guardar, Confirmar, Vincular, Ir a mi agenda, header “Programar turnos” / “Reservar turno”.

Verb first, Spanish: “Ver agenda”, “Reservar”, “Crear horario”, “Continuar”, “Buscar”.

### Secondary / outline — `.btn.btn-outline`

Fill `--color-paper`, text `--color-ink`, border `--color-rule`, no extra shadow beyond the hairline.
Hover: **fills accent** (same as primary) — not a grey wash.
Use for: alternate roles on login, Cerrar sesión, mes ‹ ›, Quitar / Cancelar (non-destructive), Reset, Agregar franja, Volver in dialogs, home secondary CTAs.

### Destructive — `.btn.btn-danger`

Fill `--color-danger`, text `#fff` (not accent-ink).
Use only for patient “Cancelar” a booked appointment, and confirm-dialog OK when `danger: true`. Doctor “Eliminar” / “Cancelar turno” in the demo still uses outline — prefer danger when the action deletes a booking.

### Small — `.btn-sm`

Height `--control-h-sm`, pad-x 0.65rem, `--text-xs`, **no shadow**.
Use inside list/slot rows, header secondary actions, calendar month chevrons (also square — see icon).

### View switcher — Lista / Calendario

One control, not two buttons. Label **Cambiar vista:** (same as a field label) above a hairline track (`border-rule`, paper, radius `--radius-input`, height `--control-h` to match an adjacent header CTA). Two segments (Lucide + label). Active: accent fill + accent-ink. Idle: ink-2, no own border. Header actions align to the control baseline (`items-end`). Wizard Horario and Mis turnos.

### Icon / chevron — `.btn-icon` or `.cal-head .btn-sm`

Square: width = height = `--control-h` (or `-sm`). Pad 0. Glyph size ~1.35–1.45rem. Calendar month buttons are outline `size="icon"` with Lucide `ChevronLeft` / `ChevronRight` (`currentColor`, ~1.35rem, `shrink-0`). BackLink uses Lucide `ChevronLeft` at `1.05em` (`shrink-0`), not a two-border CSS chevron.

Home “+” (`home-upcoming-add`): outline, 2×2rem, weight 600.

### Text link button — `.btn-text`

No border, no fill, accent ink, weight 600, pad 0.35rem 0. Rare; keep for inline “text actions” next to forms, not as a page CTA.

### Ghost nav — `.nav-btn`

Not a `.btn`. Transparent, ink-2, radius 6px, pad 0.55rem 0.65rem, left-aligned.
Hover: ink on `--color-paper`.
Active: **accent fill + accent-ink** (same as primary).
One active item per role nav.

### Back — `.back-link`

Not a `.btn`. No border/fill. Ink-2, weight 500. Hover → accent.
Leading glyph is Lucide `ChevronLeft` (`1.05em`, `shrink-0`) so it scales with the label and does not collapse. On `page-header--back-title`, the back link **replaces** the h1 (same size as the title).

### Home stacked CTAs — `.home-start-cta`

Full width, slightly taller than `--control-h` (+0.25rem), `--text-md`, weight 600.
First is primary; the rest outline. Secondary row (doctor) is a 2- or 3-col grid of outline buttons at weight 500.

### Login role stack

Patient = primary. Doctor and admin = outline. Full-width column. Same heights as `--control-h`.

### Confirm dialog actions

Right-aligned pair: outline “Volver” + primary “Confirmar”. Min width 6.5rem.
If destructive: OK becomes `.btn-danger` and **initial focus is Cancel**. Escape / backdrop = false.

### Placement rules

- **Header actions** (`.header-actions`): one primary (optional) + outline siblings; nowrap on desktop, wrap full-width under the title on ≤1199px.
- **Filters**: fields + one primary “Buscar” aligned to the control baseline (`align-items: end`).
- **Lists / slots**: action buttons `flex-shrink: 0` on the right; `btn-sm`.
- **Wizard footer**: primary “Continuar >” (`book-next-btn`) bottom-right of the recuadro; disabled until the step has a selection. On **Programar** phone, sticky Continuar (`WizardStickyCta`). On phone cal flows (Agenda / Book cal / Mis turnos cal / Slots): `MobileDaySwap` (cal XOR day), not cal+sheet together.
- **In-row vs page**: never put a full `--control-h` primary inside a slot row.

---

## Inputs and checks

- Height `--control-h`, radius 6px, hairline, paper fill, pad-x 0.75rem, `--text-sm`.
- Labels: `--text-sm`, weight 500.
- Time: IBM Plex Mono, tabular nums; `:` separator in ink-2.
- Checkbox `.cal-check`: 1rem box, `accent-color: var(--color-accent)`.
- Errors: `.error` in `--color-danger`. Hints: `.hint` in ink-2.

---

## Chrome

### Frame

`html`/`body` = paper-2. Padding `--app-frame` 0.45rem. Inner shell radius `--app-radius`.
Authed main = paper, same radius. Desktop (≥1200): margin = frame. Mobile (<1200): the body padding is the frame, so main adds no side or bottom margin — only the top gap (`--space-2xs`) that separates it from the topbar. Viewport locked; **only `.main` scrolls**.

Breakpoints: desktop chrome **1200px**; agenda two-column **768px**; filter grids **640px**.

### Sidebar (desktop ≥1200)

Width `--sidebar-w` 16.75rem, transparent over paper-2. Logo disc 3.5rem (white, circular, light shadow) + two-line wordmark (“Sanatorio integral” ink-2 / “San Benito” ink 700).
Nav + foot; foot hairline + name + outline small “Cerrar sesión”.
**Home hides the rail** (grid column 0; nav/foot fade + slide). Logo stays.

### Mobile chrome (<1200)

Topbar height `--mobile-header-h` (3rem / 2.75rem): hamburger + centered “San Benito” + avatar (accent disc). Paper, no border, no shadow, no extra margin (the body padding is the frame). The bar stays in place when the menu opens.
Hit targets on the topbar use `--control-h-sm`. Open = Sidebar slides down from the top and fills the shell (100%, paper, 320ms `--ease-out`). Hamburger morphs to X. Escape closes the drawer; navigate closes it too.
Main padding under the topbar: `--space-sm` on all sides (<1200); on phone (≤767) horizontal stays `--space-sm`, vertical `--space-xs` — titles must not sit flush to the paper edge. Shared class fragment: `chromeMainPadClass` in `resources/js/lib/mobile-chrome.ts`.

### Page header

Fixed footprint `--page-header-h` 5.75rem (auto on phone): title band + subtitle **or** step pills (same 2.35rem sub-band). Quiet titles. No bottom rule. Titles ≈1.35–1.4rem under 1200.

Step pills: three equal columns; 2px-radius bar. Idle paper-3; done accent-soft + accent label; on = accent bar + ink weight 600.

Header actions: match `--control-h` next to ViewSwitch on desktop; on phone (≤767) they stack full-width and drop to `--control-h-sm` (ViewSwitch track matches).

---

## Surfaces and lists

- `.surface` / `.doctor-results` / `.cal` / `.panel`: hairline, radius-card, paper.
- Results recuadro: filters or heading in a bottom-ruled band, then scrollable grid/list.
- `.slot-row` / `.list-row` / `.doctor-card` / `.booking-card`: hairline, radius-card. Clickable rows/cards hover **border → accent** (doctor selected also gets accent-soft fill).
- Names in lists: Inter Tight 600. Times: mono. Meta: ink-2.

---

## Calendar + agenda

Month title centered, capitalize; ‹ › outline icon buttons.
7×6 grid; day cells radius 6px, mono, no inner border.
Legend: 0.55rem swatches, 2px radius.
Desktop: cal | panel (2fr / 3fr). Phone (≤767): calendar **or** day panel — never both. Choosing a day opens the day view and hides the calendar; **Calendario** (BackLink) returns to the month. Shared primitive: `MobileDaySwap`. CalendarMonth on phone uses a near-square aspect capped at `38dvh` so short viewports (e.g. 340×525) keep toolbar + Continuar on screen. On `md+`, Book / Mis turnos / Slots still use bottom sheet on the split; Mi agenda uses split without sheet.

Programar paint mode: `cursor: crosshair` on enabled days; selected-day swatch uses accent fill.

Phone list/card density: shared `phoneInteractivePadClass` / `phoneSurfaceRadiusClass` (`calc(var(--radius-card) + 2px)` — not a third radius token).

---

## Feedback (locked — not silent)

The demo is **not** silent-success. Product UI follows this, not flash/Inertia-only.

- **Toast**: top-right; on desktop near the top (`0.75rem`); under `<1200` clears the mobile topbar via `calc(var(--app-frame) + var(--mobile-header-h) + … + safe-area)`. Radius-card, `--text-sm` weight 500, 3400ms. `info` = ink + accent-ink; `ok` = accent; `warn` = danger + white. Slide from the right. No action buttons.
- **Confirm modal**: page-level, not `window.confirm`. Paper dialog, radius-card, hairline, `--shadow-lg`. Backdrop `oklch(22% 0.02 255 / 0.42)`. Title display `--text-md`; message ink-2. See button logic above.
- **Route loader**: 3px top bar, accent → `oklch(62% 0.16 230)` gradient; main dims to 0.55 and ignores pointer while loading.

---

## Auth and home extras

- Auth card `min(100%, 26rem)`. Logo 7rem circular on white. Soft radial wash allowed **only** on auth (`ellipse` cool tint on paper).
- Home watermark: logo top-right, opacity 0.1, pointer-events none.
- Upcoming card: hairline, radius-card, left-aligned list; row hover tints the title accent.

---

## What pages MUST share

- Wordmark “San Benito” + circular logo
- Clínico tokens above (no second palette)
- CTA voice, 6px control radius, 8px card radius, `--control-h`
- Quiet page titles + shared header footprint
- Toasts + in-page confirm
- Inter Tight + IBM Plex Sans (+ Mono for times)

## What pages MAY differ on

- Macrostructure within family (hero vs index-first)
- List density vs calendar prominence
- Header actions set per page

## Audience / use (locked)

- Audience: pacientes, doctores, admins, super admins
- Primary use: ver agenda / turnos
- Direction: minimal clinical UI — white paper, blue filled buttons

## Exports

Canonical values live in `resources/css/tokens.css` and `resources/css/app.css`; they must match this file.
