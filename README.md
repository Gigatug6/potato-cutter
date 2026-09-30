# Potato Cutter
Simulateur 3D de découpe de patates (Vue 3 + TypeScript + three.js). Prérequis : Docker uniquement.

- `./scripts/init-env.sh` puis `./scripts/dev.sh` → http://localhost:5173
- `./scripts/check.sh` : typecheck + tests + build
- `./scripts/e2e.sh` : tests Playwright

`make help`-like : `make dev` · `make check` · `make e2e` · `make sh` · `make clean`. Suivi du projet : `PROGRESS.md`.

Graphismes : Réglages → Qualité (Basse/Élevée/Ultra) ; bouton 📷 Ray tracing en jeu (path tracing GPU). Décors : Boutique → Décors.

Production : `SITE_URL=https://mon-domaine.fr make prod` (nginx, http://localhost:8080). Outils : `scripts/optimize-assets.mjs` (WebP), `scripts/make-icons.mjs`, `MAKE_OG=1 ./scripts/e2e.sh og` + `scripts/make-og.mjs` (image Open Graph).

## Déploiement
- `SITE_URL=https://mon-domaine.fr SITE_ADDRESS=mon-domaine.fr AUTO_HTTPS=on make prod` : Caddy (HTTPS Let's Encrypt automatique, HTTP/3, Brotli précompressé) + API de sauvegarde (`/api`, volume `api_data`).
- **CDN** (Cloudflare, Fastly…) devant Caddy : respecter les `Cache-Control` d'origine (`/assets/*` immuable 1 an ; `/textures`, `/decor`, `/hdri`, `/basis` 30 jours ; `index.html`, `sw.js`, manifest, sitemap en `no-cache`), activer Brotli + HTTP/3, ne pas mettre `/api/*` en cache, purger `index.html` à chaque déploiement.
- Sauvegarde en ligne : Réglages → Sauvegarde (code de synchro sans compte) ; fichier d'export/import en plus.

## Assets
`scripts/optimize-assets.mjs` (JPEG→WebP), `scripts/make-ktx2.mjs` (WebP→KTX2 + transcodeur Basis), `scripts/make-icons.mjs`, `scripts/precompress.mjs` (Brotli/gzip).

**Héberger gratuitement sur GitHub Pages** : guide pas à pas dans [`docs/DEPLOIEMENT-GITHUB-PAGES.md`](docs/DEPLOIEMENT-GITHUB-PAGES.md) (un seul réglage à faire côté GitHub : *Settings → Pages → Source = GitHub Actions*).
