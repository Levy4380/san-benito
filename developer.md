# developer.md — cómo levantar San Benito

Guía de entorno local. La fuente de verdad de **producto** es [new-design.md](new-design.md). Visual: [design.md](design.md). Este archivo cubre bootstrap, puertos, hostname y errores reales al clonar el repo.

## Qué es

Sistema de turnos (Laravel 12 + Inertia + React + TypeScript + Vite + Tailwind). Roles Spatie: `patient`, `doctor`, `admin`, `super_admin`.

Todo corre en **Laravel Sail** (Docker). **yarn Classic 1.22.x** (lockfile v1), no npm. **Sin** campo `"packageManager"` en `package.json`. `vendor/` y `.env` no están en git.

## Prerrequisitos

- Docker en ejecución (`sudo systemctl start docker` si hace falta; usuario en el grupo `docker`).
- PHP y Composer **en el host no son obligatorios**. Si no están, el primer `composer install` se hace con un contenedor (ver más abajo).

## Primera vez (clone limpio)

`vendor/` está en `.gitignore`. Sin eso no existe `./vendor/bin/sail` ni el Dockerfile de Sail (`vendor/laravel/sail/runtimes/8.5` en `docker-compose.yml`). `./vendor/bin/sail up` **no puede** ser el primer comando.

### 1. `.env`

```bash
cp .env.example .env
```

### 2. Dependencias PHP

**Si hay PHP 8.3+ y Composer en el host:**

```bash
composer install
```

**Si no hay PHP/Composer** (caso típico: solo Docker + Node), receta oficial de Laravel Sail — *Installing Composer Dependencies for Existing Applications* — **no está en este repo**:

```bash
docker run --rm \
  -u "$(id -u):$(id -g)" \
  -v "$(pwd):/var/www/html" \
  -w /var/www/html \
  laravelsail/php84-composer:latest \
  composer install --ignore-platform-reqs
```

Qué hace: un contenedor con PHP + Composer monta el repo, escribe `vendor/` con tu uid/gid, y se borra (`--rm`). `--ignore-platform-reqs` evita exigir extensiones PHP del host.

Ese contenedor **solo instala dependencias**. La app corre después en Sail 8.5. CI (`.github/workflows/tests.yml`) usa PHP 8.4 + `composer install` en la máquina, no este `docker run`.

### 3. Contenedores, clave y base

```bash
./vendor/bin/sail up -d
./vendor/bin/sail artisan key:generate
./vendor/bin/sail artisan migrate --seed
```

Si `migrate` falla por conexión, MySQL todavía no está healthy: esperá unos segundos y repetí.

`--seed` carga roles, especialidades y cuentas demo (`DemoSeeder` solo en `APP_ENV=local`).

### 4. Frontend

```bash
./vendor/bin/sail yarn install
./vendor/bin/sail yarn dev
```

`yarn dev` tiene que seguir corriendo (HMR). No uses `npm` ni `package-lock.json`; el lockfile es `yarn.lock` (formato Classic `# yarn lockfile v1`).

Sail fuerza Yarn 1.22.x al arrancar el contenedor (`docker/sail-entrypoint.sh`) porque la imagen Sail nueva deja Yarn 4 vía Corepack. Eso sobrevive `sail down` / `sail up`. No hace falta `corepack enable` en el host.

## Laravel Cloud (build)

No hay `cloud.yml` en el repo. En el dashboard de Laravel Cloud pegá **exactamente** estos tres comandos (también en `build.sh` en la raíz). **Sin Corepack.**

```bash
npm install -g yarn
yarn install --frozen-lockfile
yarn run build
```

Si el dashboard todavía tiene `corepack enable` / `corepack prepare --activate` / `yarn@4.x`, reemplazalo por lo de arriba. Cloud vuelve a Yarn 1.22.22; con `"packageManager"` en `package.json` el build aborta. El commit desplegado tiene que ser el que **no** tiene ese campo.

## URL local

Dos setups válidos. El `.env.example` usa **A**. En esta máquina quedó **B**.

### A — localhost (lo que trae el example)

```
APP_URL=http://localhost:8080
APP_PORT=8080
VITE_PORT=5174
```

Abrí **http://localhost:8080**.

### B — `sanbenito.local` (dominio local)

`APP_URL` **no crea un DNS**. Vite imprime `APP_URL: …` como etiqueta; no sirve el hostname.

1. En `/etc/hosts` (no pisa `laravel.test`; son nombres distintos a la misma IP):

```
127.0.0.1 laravel.test sanbenito.local
```

Sail suele dejar `laravel.test`. Agregar `sanbenito.local` **no lo rompe**.

2. En `.env`:

```
APP_URL=http://sanbenito.local
APP_PORT=80
VITE_PORT=5174
```

`APP_URL` tiene que llevar esquema (`http://`). Sin eso Laravel arma mal redirects y cookies.

3. Abrí **http://sanbenito.local** (no `https`, no el puerto 5174).

Si `APP_PORT` no es 80, la URL lleva el puerto: `http://sanbenito.local:8080`.

| Qué | Puerto (example) | Puerto (setup B) |
|---|---|---|
| App PHP | 8080 | 80 |
| Vite (HMR) | 5174 | 5174 |
| MySQL (host) | 3307 | 3307 |
| Mailpit dashboard | 8026 | 8026 |

Vite **5174** es solo assets en desarrollo. La app es `APP_PORT`. Mailpit está por paridad de stack; en v1 no hay mails (D8).

## Cuentas demo

Contraseña de todos: `password`.

| Rol | Email | Tras el login |
|---|---|---|
| Paciente | `juan@sanbenito.test` | `/home` |
| Paciente | `laura@sanbenito.test` | `/home` |
| Doctor | `ana.perez@sanbenito.test` | `/home` |
| Doctor | `luis.gomez@sanbenito.test` | `/home` |
| Doctor | `maria.lopez@sanbenito.test` | `/home` |
| Admin | `admin@sanbenito.test` | `/admin/appointments` |
| Super admin | `superadmin@sanbenito.test` | `/admin/appointments` |

Registro público de paciente: `/register`. En `local`, el login lista estas cuentas.

## Día a día

```bash
./vendor/bin/sail up -d
./vendor/bin/sail yarn dev
./vendor/bin/sail artisan test
composer pint                          # o: ./vendor/bin/sail bin pint
./vendor/bin/sail yarn build
./vendor/bin/sail yarn lint
./vendor/bin/sail down
```

Nada de PHP/MySQL/Vite fuera de Sail. `composer pint` en el host solo si hay PHP; si no, `./vendor/bin/sail bin pint`.

## Errores que ya vimos

### `vendor/bin/sail: No such file`

No corriste `composer install` (o el `docker run` de Sail). `vendor/` no está en git.

### El navegador no entra a `sanbenito.local`

El nombre no está en `/etc/hosts`. Vite mostrando `APP_URL: sanbenito.local` no alcanza. Ver sección URL local.

### `APP_URL=sanbenito.local` (sin `http://`)

Tiene que ser `http://sanbenito.local`. Sin esquema, redirects y sesión fallan.

### `APP_KEY` vacío

500 o errores de cifrado. `./vendor/bin/sail artisan key:generate`.

### `Table 'laravel.sessions' doesn't exist` (SQLSTATE 1146)

MySQL responde, pero no corriste migraciones. `SESSION_DRIVER=database` lee `sessions` en cada request; esa tabla sale de la migración de users.

```bash
./vendor/bin/sail artisan migrate --seed
```

### CORS: `Access to script at 'http://localhost:5174/@vite/client' from origin 'http://sanbenito.local'`

La página corre en `sanbenito.local` y los scripts de Vite en `localhost:5174`: orígenes distintos. Suele aparecer si `APP_URL` no tiene `http://` o si Vite se reinició a mitad de un cambio de host.

Qué hacer: `APP_URL=http://sanbenito.local`, reiniciar `./vendor/bin/sail yarn dev`, recargar. Si vuelve, o usás setup A (`localhost:8080` para app y Vite), o en `vite.config.js` alineás CORS/`server.origin` con el host de la app. No abras el 5174 como URL de la aplicación.

### `yarn`: package doesn't seem to be present in your lockfile

Dentro de Sail, `yarn install`. No `npm install`.

### Error Corepack: `This project's package.json defines "packageManager"` + `Yarn is 1.22.22` + `Corepack must currently be enabled`

**Síntoma:** Yarn Classic 1.22.22 lee `package.json`, ve el campo `"packageManager"`, y aborta pidiendo Corepack.

**Causa real:** alguien (starter Laravel, Agent, o `corepack use`) escribió `"packageManager"` (p. ej. `yarn@4.4.1+sha224…` o `yarn@4.9.2`). Corepack **no** está corriendo; el arreglo no es habilitarlo.

**Qué hacer:**
1. Borrar `"packageManager"` de `package.json`. No reemplazarlo por `yarn@1.22.22` — Yarn 1.22.22 aborta si el campo **existe**.
2. Confirmar que `yarn.lock` empieza con `# yarn lockfile v1` (no `__metadata` Berry). Si alguien lo pasó a Yarn 4, revertir el lockfile; no “migrar a Berry”.
3. En Sail: `COREPACK_ENABLE_AUTO_PIN=0` + entrypoint que deja `yarn` en 1.22.x. Verificar: `./vendor/bin/sail yarn --version` → `1.22.x`. Tras `sail down` && `sail up -d`, igual.
4. En Laravel Cloud: los tres comandos de la sección *Laravel Cloud (build)* — **nunca** `corepack enable` / `prepare yarn@stable`.

**Qué NO hacer:** `corepack enable`, `corepack prepare yarn@4` / `yarn@stable`, `yarn set version`, restaurar el `packageManager` del starter, ni instalar Yarn Berry “bien” (`.yarnrc.yml`, `nodeLinker`, lockfile `__metadata`).

### Puerto ocupado

Cambiá `APP_PORT` o `VITE_PORT` en `.env` y recreá contenedores (`./vendor/bin/sail up -d`).

## Calidad

Ver [CLAUDE.md](CLAUDE.md) / [AGENTS.md](AGENTS.md): tests, Pint, `yarn build`, `yarn lint`. Ramas `feature/<slug>` desde `main`; Conventional Commits; todo por PR.
