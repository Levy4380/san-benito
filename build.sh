#!/usr/bin/env bash
# Laravel Cloud build commands (Yarn Classic 1.x). Paste these in the dashboard.
# Do NOT use corepack enable / prepare / use — Cloud's yarn is 1.22.x and aborts
# if package.json has "packageManager", or if you migrate the lockfile to Berry.
set -euo pipefail

npm install -g yarn
yarn install --frozen-lockfile
yarn run build
