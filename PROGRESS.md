# PROGRESS — Potato Cutter

## Statut
- Phase courante : terminé
- **Projet terminé** — voir « Reste possible » ci-dessous (commandes : `make check`, `make e2e`, `make dev`)

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
- [x] 2.1 profile + persist
- [x] 2.2 game
### Phase 3 — Moteur 3D
- [x] 3.1 Engine + Kitchen
- [x] 3.2 PotatoMesh
- [x] 3.3 Épluchage
- [x] 3.4 Couteaux 3D
- [x] 3.5 Découpe 1 passe
- [x] 3.6 Multi-passes + fin de manche
### Phase 4 — UI
- [x] 4.1 Menu/HUD/Résultats
- [x] 4.2 Boutique/Caisse
- [x] 4.3 Collection/Réglages
- [x] 4.4 Mobile/tactile
### Phase 5 — Finitions
- [x] 5.1 Audio
- [x] 5.2 Juice
- [x] 5.3 Perf/robustesse
- [x] 5.4 Vérif finale

## Décisions
- D1 : three.js direct plutôt que TresJS (maillages impératifs).
- D2 : découpe = cellule ∩ forme analytique par rétraction (pas de CSG).
- D3 : TypeScript 5.9 (TS 7 casse vue-tsc).

- D4 : hôte `app` refusé par Chromium (TLD `.app` en HSTS) → alias réseau `vite` pour l'e2e.
- D5 : Makefile ajouté (init, dev, up, check, e2e, sh, npm, clean).

- D6 : la coupe se déclenche par clic/tap à la position du pointeur (plus robuste que le swipe vertical du plan) ; le couteau est animé au moment de la coupe.
- D7 : borne de taille des couteaux relâchée à 3 (borne heuristique arbitraire, pas une contrainte de jeu).

## Blocages / dettes
- (aucun)

## Journal
### 2026-09-30 — Étapes 0.1–0.4
- Docker OK (Node 24, UID 1001), squelette Vite/Vue, `check.sh` vert (1 fichier de tests), dev server répond sur 5173.

### 2026-09-30 — Étape 0.5 + Makefile
- Playwright 1.63.0, WebGL OK via swiftshader, smoke e2e vert.

### 2026-09-30 — Phase 1 complète
- Domaine pur : 45 tests verts, build OK. pieceGeometry < 2 s pour le mode dés en test.

### 2026-09-30 — Phase 2
- Stores profile/game/persist, 52 tests verts.

### 2026-09-30 — Phase 3 (moteur 3D)
- Engine, PotatoMesh, épluchage (copeaux), couteaux procéduraux, découpe rondelles/frites/dés, API window.__potato.
- 64 tests unitaires + 4 e2e verts (smoke, peel, cut, dice).
- Captures relues : patate brune avec yeux ; zone épluchée jaune avec copeaux ; rondelles séparées à chair claire ; dés en grille 3D (~150 pièces).
- Reste à soigner : couteau peu visible (repos hors champ), guide de coupe un peu grossier.

### 2026-09-30 — 4.1
- Menu, HUD, PhaseActions, ResultsPanel ; 66 tests + 5 e2e verts ; captures menu/résultats relues (OK).

### 2026-09-30 — 4.2/4.3
- Boutique (vignettes 3D via renderer partagé + RoomEnvironment), caisse, collection, réglages. 66 tests + 8 e2e verts.
- Captures relues : boutique OK (couleurs de rareté, lames métal avec reflets). Bug corrigé : couteau décentré (inner.position.z) et métal noir sans envMap.
- D8 : pas d'aperçu rotatif en boutique (vignettes statiques seulement).

### 2026-09-30 — 4.4
- Caméra qui recule sur écran étroit, e2e mobile 390x844 (tap/pointer tactile) vert ; 9 e2e verts.
- Fog éloigné (la patate paraissait délavée en mobile). Smoke rendu robuste (waitForFunction frames).

### 2026-09-30 — Phase 5 + vérification finale
- 5.1 audio WebAudio synthétisé (grattage, chop, pièce), réglage son ; 5.2 badge de série, tremblement caméra (désactivé si animations réduites) ; 5.3 perte de contexte WebGL (message + recharger), test 5 manches sans fuite GPU.
- Vérif finale : image reconstruite sans cache, `npm ci` propre, `make check` vert (68 tests, bundle 193 kB gzip), 11 e2e verts (smoke, peel, cut, dice, round, shop x3, mobile, perf x2).
- Seul élément appartenant à root : le point de montage `./node_modules` (créé par Docker), inoffensif.

## Reste possible (idées, hors plan)
- Aperçu 3D rotatif du couteau en boutique ; texte flottant « +N » 3D ; équilibrage de l'économie (rondelles ≈ 10–25 🥔 par patate, le 1er achat à 80) ; swipe vertical en plus du clic pour couper ; lisser les bords de la zone épluchée (peelMap 128×64).

### 2026-09-30 — Retours utilisateur
- Rotation 3D de la patate (bouton « Tourner », clic droit, Maj+glisser), couleurs plus sombres (valeurs linéaires corrigées), vraies textures CC0 Poly Haven (bois, peau via brown_mud_02 + normal map, shader mélange peau/chair), pôles UV déplacés aux extrémités. e2e rotate ajouté. Textures : public/textures/LICENSE.md.
