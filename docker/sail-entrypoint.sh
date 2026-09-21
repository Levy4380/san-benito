#!/usr/bin/env bash
set -euo pipefail

# Sail's runtime Dockerfile (vendor, not edited here) runs:
#   corepack enable && corepack prepare yarn@stable --activate
# That leaves Yarn 4 on `yarn`. This repo is Yarn Classic 1.22.x + lockfile v1.
# Force Classic globally on every container start so sail down/up and image rebuilds
# still expose 1.22.x. Never `corepack use` in /var/www/html (that pins package.json).

export COREPACK_ENABLE_AUTO_PIN="${COREPACK_ENABLE_AUTO_PIN:-0}"
export COREPACK_ENABLE_DOWNLOAD_PROMPT="${COREPACK_ENABLE_DOWNLOAD_PROMPT:-0}"

desired="1.22.22"
# Probe outside the app so Yarn Classic never reads package.json.
current="$(cd /tmp && yarn --version 2>/dev/null || true)"

if [[ ! "$current" =~ ^1\.22\. ]]; then
    if command -v corepack >/dev/null 2>&1; then
        # Global activate only — not yarn@stable / yarn@4.x, not package.json.
        corepack prepare "yarn@${desired}" --activate
    else
        npm install -g "yarn@${desired}"
    fi
fi

exec /usr/local/bin/start-container "$@"
