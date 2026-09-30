# PROGRESS — Potato Cutter

## Statut
- Phase courante : 0 — Infrastructure
- **Prochaine étape : 0.5 Playwright + WebGL headless**

## Checklist
### Phase 0 — Infra
- [x] 0.1 Docker + scripts
- [x] 0.2 Squelette Vue/TS/Vite
- [x] 0.3 Vitest
- [x] 0.4 CLAUDE.md / PROGRESS.md / README
- [ ] 0.5 Playwright + WebGL headless — `./scripts/e2e.sh`
### Phase 1 — Domaine pur
- [ ] 1.1 rng/math/events
- [ ] 1.2 potatoShape
- [ ] 1.3 peelMap
- [ ] 1.4 cutModes/cutPlan
- [ ] 1.5 pieceGeometry
- [ ] 1.6 scoring
- [ ] 1.7 rarities/knives
- [ ] 1.8 save
- [ ] 1.9 crate
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

## Blocages / dettes
- (aucun)

## Journal
### 2026-09-30 — Étapes 0.1–0.4
- Docker OK (Node 24, UID 1001), squelette Vite/Vue, `check.sh` vert (1 fichier de tests), dev server répond sur 5173.
