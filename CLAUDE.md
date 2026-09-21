# CLAUDE.md — san-benito

## Reglas

1. **Fuente de verdad:** [new-design.md](new-design.md). Visual: [design.md](design.md). No inventar decisiones.
2. **Sail obligatorio** para PHP/Composer/yarn/tests.
3. **yarn Classic 1.22.x**, no npm. **Prohibido** `"packageManager"` en `package.json` (borrarlo si aparece; no poner `yarn@1.22.22` ni Yarn 4). El error Corepack se arregla borrando el campo, **no** con `corepack enable` / `prepare yarn@stable`.
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
- Disponibilidad = franjas (`availability_windows`); huecos calculados; `appointments` solo reservas
- Reserva = INSERT; cancelar borra la reserva; la franja sigue
- `doctor_patient` pivote (D21): nace al book/assign + alta manual; no se borra en v1
