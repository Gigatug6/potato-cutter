#!/bin/sh
cd "$(dirname "$0")/.." && docker compose up -d --wait app && docker compose --profile e2e run --rm e2e npx playwright test "$@"
