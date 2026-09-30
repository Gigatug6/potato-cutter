# Potato Cutter
Simulateur 3D de découpe de patates (Vue 3 + TypeScript + three.js). Prérequis : Docker uniquement.

- `./scripts/init-env.sh` puis `./scripts/dev.sh` → http://localhost:5173
- `./scripts/check.sh` : typecheck + tests + build
- `./scripts/e2e.sh` : tests Playwright

`make help`-like : `make dev` · `make check` · `make e2e` · `make sh` · `make clean`. Suivi du projet : `PROGRESS.md`.

Graphismes : Réglages → Qualité (Basse/Élevée/Ultra) ; bouton 📷 Ray tracing en jeu (path tracing GPU). Décors : Boutique → Décors.

Production : `SITE_URL=https://mon-domaine.fr make prod` (nginx, http://localhost:8080). Outils : `scripts/optimize-assets.mjs` (WebP), `scripts/make-icons.mjs`, `MAKE_OG=1 ./scripts/e2e.sh og` + `scripts/make-og.mjs` (image Open Graph).
