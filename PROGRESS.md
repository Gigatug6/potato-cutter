# PROGRESS — Potato Cutter

## Statut
- Phase courante : 2 — Stores
- **Prochaine étape : 2.1 stores Pinia profile + persist** (commandes : `make check`, `make e2e`, `make dev`)

## Checklist
### Phase 0 — Infra
- [x] 0.1 Docker + scripts
- [x] 0.2 Squelette Vue/TS/Vite
- [x] 0.3 Vitest
- [x] 0.4 CLAUDE.md / PROGRESS.md / README
- [x] 0.5 Playwright + WebGL headless — `make e2e`
### Phase 1 — Domaine pur
- [x] 1.1 rng/math/events
- [x] 1.2 potatoShape
- [x] 1.3 peelMap
- [x] 1.4 cutModes/cutPlan
- [x] 1.5 pieceGeometry
- [x] 1.6 scoring
- [x] 1.7 rarities/knives
- [x] 1.8 save
- [x] 1.9 crate
### Phase 2 — Stores
- [ ] 2.1 profile + persist
- [ ] 2.2 game
### Phase 3 — Moteur 3D
- [ ] 3.1 Engine + Kitchen
- [ ] 3.2 PotatoMesh
- [ ] 3.3 Épluchage
- [ ] 3.4 Couteaux 3D
- [ ] 3.5 Découpe 1 passe
- [ ] 3.6 Multi-passes + fin de manche
### Phase 4 — UI
- [ ] 4.1 Menu/HUD/Résultats
- [ ] 4.2 Boutique/Caisse
- [ ] 4.3 Collection/Réglages
- [ ] 4.4 Mobile/tactile
### Phase 5 — Finitions
- [ ] 5.1 Audio
- [ ] 5.2 Juice
- [ ] 5.3 Perf/robustesse
- [ ] 5.4 Vérif finale

## Décisions
- D1 : three.js direct plutôt que TresJS (maillages impératifs).
- D2 : découpe = cellule ∩ forme analytique par rétraction (pas de CSG).
- D3 : TypeScript 5.9 (TS 7 casse vue-tsc).

- D4 : hôte `app` refusé par Chromium (TLD `.app` en HSTS) → alias réseau `vite` pour l'e2e.
- D5 : Makefile ajouté (init, dev, up, check, e2e, sh, npm, clean).

## Blocages / dettes
- (aucun)

## Journal
### 2026-09-30 — Étapes 0.1–0.4
- Docker OK (Node 24, UID 1001), squelette Vite/Vue, `check.sh` vert (1 fichier de tests), dev server répond sur 5173.

### 2026-09-30 — Étape 0.5 + Makefile
- Playwright 1.63.0, WebGL OK via swiftshader, smoke e2e vert.

### 2026-09-30 — Phase 1 complète
- Domaine pur : 45 tests verts, build OK. pieceGeometry < 2 s pour le mode dés en test.
