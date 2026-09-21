# AGENTS.md — san-benito

Sistema de gestión de turnos para un sanatorio.

## Stack

- Laravel 12 + Inertia + React + TypeScript + Vite + Tailwind
- Spatie Permission (roles: patient, doctor, admin, super_admin)
- Sail (Docker): `laravel.test`, `mysql`, `queue`, `mailpit`
- yarn **Classic 1.22.x** (lockfile `# yarn lockfile v1`) — no npm; **prohibido** el campo `"packageManager"` en `package.json` (Yarn 1.22 aborta si existe). El error Corepack (`defines "packageManager"` + `Yarn is 1.22.22`) se arregla **borrando** el campo, no con `corepack enable` / Yarn 4.

## Fuente de verdad

Leé y seguí **[new-design.md](new-design.md)** al pie de la letra. Visual: [design.md](design.md). Ante ambigüedad: preguntar, no inventar.

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
