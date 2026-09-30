#!/bin/sh
cd "$(dirname "$0")/.." && docker compose run --rm app sh -c "npm run typecheck && npm test && npm run build"
