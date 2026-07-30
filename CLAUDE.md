# CLAUDE.md — san-benito

## Reglas

1. **Fuente de verdad:** [DESIGN.md](DESIGN.md). No inventar decisiones.
2. **Sail obligatorio** para PHP/Composer/yarn/tests.
3. **yarn**, no npm.
4. Ramas `feature/<slug>` desde `main`; Conventional Commits; todo por PR.

## Quality gates

```bash
./vendor/bin/sail artisan test
composer pint
./vendor/bin/sail yarn build
./vendor/bin/sail yarn lint
```

## Dominio (resumen)

- `users` = auth; `doctors` / `patients` = entidades de dominio
- `appointments` status: `available` | `booked`
- Reserva atómica; cancelación reabre el slot
- `doctor_patient` pivote (D21): nace al book + alta manual; no se borra en v1
- Franjas en modal + generate mes actual/siguiente/posterior (d23); sin plantilla persistida
