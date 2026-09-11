#!/usr/bin/env bash
set -euo pipefail

# Sail's image still ships Yarn Classic. This repo pins Yarn 4.9.2 in
# package.json, so Corepack must own `yarn` on every container create.
# That way `sail down` / `sail up` does not require a manual re-enable.
export COREPACK_ENABLE_DOWNLOAD_PROMPT="${COREPACK_ENABLE_DOWNLOAD_PROMPT:-0}"
export COREPACK_HOME="${COREPACK_HOME:-/usr/local/share/corepack}"

mkdir -p "$COREPACK_HOME"

desired="4.9.2"
# Yarn 1 errors if it sees this repo's package.json; probe outside the app.
current="$(cd /tmp && yarn --version 2>/dev/null || true)"

if [ "$current" != "$desired" ]; then
    corepack enable
    corepack prepare "yarn@${desired}" --activate
fi

chmod -R a+rwX "$COREPACK_HOME" || true

exec /usr/local/bin/start-container "$@"
