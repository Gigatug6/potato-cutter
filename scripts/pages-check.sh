#!/bin/sh
# Test automatique du build GitHub Pages : build (base /potato-cutter/, sans API, hooks de test) puis Playwright sur `vite preview`.
cd "$(dirname "$0")/.." || exit 1
export BASE_PATH=/potato-cutter/ SITE_URL=https://exemple.github.io/potato-cutter VITE_CLOUD=off VITE_E2E=1
docker compose run --rm -e BASE_PATH -e SITE_URL -e VITE_CLOUD -e VITE_E2E app npm run build || exit 1
docker compose --profile e2e run --rm -e BASE_PATH -e PAGES_TEST=1 e2e sh -c \
  'npx vite preview --host 127.0.0.1 --port 4173 --strictPort > /tmp/preview.log 2>&1 & sleep 4; BASE_URL=http://127.0.0.1:4173/potato-cutter/ npx playwright test e2e/pages.spec.ts; R=$?; kill %1; exit $R'
