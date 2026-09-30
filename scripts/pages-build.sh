#!/bin/sh
# Construit le site comme GitHub Pages le fera (sous-dossier + sans API) et le sert sur http://localhost:4173/<base>.
# Usage : ./scripts/pages-build.sh [nom-du-depot]      (défaut : potato-cutter)
cd "$(dirname "$0")/.." || exit 1
REPO="${1:-potato-cutter}"
export BASE_PATH="/$REPO/"
export SITE_URL="https://exemple.github.io/$REPO"
export VITE_CLOUD=off
docker compose run --rm -e BASE_PATH -e SITE_URL -e VITE_CLOUD app npm run build || exit 1
echo "Aperçu : http://localhost:4173$BASE_PATH  (Ctrl+C pour arrêter)"
docker compose run --rm --service-ports -p 4173:4173 -e BASE_PATH app npx vite preview --host 0.0.0.0 --port 4173 --strictPort
