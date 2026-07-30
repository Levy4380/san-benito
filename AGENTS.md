# AGENTS.md — san-benito

Sistema de gestión de turnos para un sanatorio.

## Stack

- Laravel 12 + Inertia + React + TypeScript + Vite + Tailwind
- Spatie Permission (roles: patient, doctor, admin, super_admin)
- Sail (Docker): `laravel.test`, `mysql`, `queue`, `mailpit`
- yarn (no npm)

## Fuente de verdad

Leé y seguí **[DESIGN.md](DESIGN.md)** al pie de la letra. Ante ambigüedad: preguntar, no inventar.

## Comandos

```sh
./vendor/bin/sail up -d
./vendor/bin/sail artisan migrate --seed
./vendor/bin/sail yarn dev
./vendor/bin/sail artisan test
composer pint
./vendor/bin/sail yarn build
./vendor/bin/sail yarn lint
```

## Arquitectura

Services + Eloquent directo (sin repositories). Controllers finos. FormRequests. Policies.
