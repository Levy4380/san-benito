# Design — San Benito

A locked visual design system for this app. Product rules live in `DESIGN.md`.
Every page redesign reads this file before emitting UI. Do not regenerate per page —
amend this file when the system needs to grow.

## Genre
modern-minimal

## Tone
austere · clinical white · blue signal CTAs

## Macrostructure family
- Marketing pages: Letter (salutation + narrow prose + sign-off CTA)
- App pages: Index-First (calendar / list as the page; quiet headings)
- Auth pages: austere single-column form on paper band

## Theme · custom
Vibe: `clinical white, blue CTAs, austere`
Axes: light / geometric-sans / cool

### Light
- `--color-paper`   oklch(99% 0.006 255)
- `--color-paper-2` oklch(96.5% 0.01 255)
- `--color-paper-3` oklch(93.5% 0.014 255)
- `--color-ink`     oklch(22% 0.02 255)
- `--color-ink-2`   oklch(48% 0.016 255)
- `--color-rule`    oklch(88% 0.012 255)
- `--color-accent`  oklch(47% 0.16 255)
- `--color-accent-ink` oklch(99% 0.004 255)
- `--color-focus`   oklch(52% 0.18 255)

### Dark
- `--color-paper`   oklch(16% 0.014 255)
- `--color-paper-2` oklch(20% 0.016 255)
- `--color-paper-3` oklch(26% 0.02 255)
- `--color-ink`     oklch(96% 0.008 255)
- `--color-ink-2`   oklch(74% 0.014 255)
- `--color-rule`    oklch(30% 0.018 255)
- `--color-accent`  oklch(50% 0.15 255)
- `--color-accent-ink` oklch(99% 0.004 255)
- `--color-focus`   oklch(62% 0.16 255)

Primary buttons use `--color-accent` fill + `--color-accent-ink` text in both modes.

## Typography
- Display: Inter Tight, weight 600, style normal (never italic on headings)
- Body: IBM Plex Sans, weight 400 / 500 / 600
- Mono: IBM Plex Mono (dates / times only)
- Display tracking: -0.02em on large titles
- Type scale anchor: `--text-display` = clamp(2rem, 3.5vw, 3rem)

## Spacing
4-point named scale in `tokens.css`. Prefer `var(--space-*)` / Tailwind mapped spacing.

## Motion
- Easings: `--ease-out` cubic-bezier(0.16, 1, 0.3, 1)
- App pages: no entrance reveals
- Reduced-motion: opacity-only, ≤ 150ms

## Microinteractions stance
- silent success (flash / Inertia — no celebratory toasts)
- hover delay 800ms on tooltips · focus delay 0ms
- buttons: color + 1px translateY on active; never bounce

## CTA voice
- Primary: filled blue (`--color-accent`), radius `--radius-input` 6px, verb first (“Ver agenda”, “Reservar”, “Crear horario”)
- Secondary: hairline rule border on paper, ink text

## Nav / chrome
- App: N3 side-rail — wordmark + role nav + user foot; paper-2 rail, accent on active
- Marketing: wordmark left, auth links right (minimal)
- Footer marketing: one line + copyright

## Per-page allowances
- Marketing MAY use a very soft cool paper wash. No stock photos.
- App pages MUST NOT use enrichment — the calendar and lists carry the page.
- Auth: typography + form only.

## What pages MUST share
- Wordmark “San Benito” + mark on accent tile
- Accent ≤ ~5% of viewport (CTAs, active nav, calendar marks)
- Inter Tight + IBM Plex Sans
- CTA voice and radius
- Quiet page titles

## What pages MAY differ on
- Macrostructure within family
- Density of lists vs calendar prominence

## Audience / use (locked)
- Audience: pacientes, doctores, admins, super admins
- Primary use: ver agenda / turnos
- Direction: minimal clinical UI — white (or dark) paper, blue filled buttons

## Exports
See `tokens.css` and `resources/css/app.css` (shadcn bridge).
