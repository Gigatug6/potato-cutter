# PROGRESS — Potato Cutter

## Statut
- Phase courante : 6 — suggestions
- **Prochaine étape : 9.1 musique (phase 9)** (commandes : `make check`, `make e2e`, `make dev`)

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

## Phase 6 — les 9 suggestions (demande utilisateur)
- [x] 6.1 Modules purs + schéma de sauvegarde : patates (1), commandes (2), améliorations (3), quêtes (6), classement (5), équilibrage (9)
- [x] 6.2 Stores : profile étendu, game (chrono, commande livrée, patate pourrie, résultats différés)
- [x] 6.3 Moteur : variétés de patates + patate pourrie/verte (8), améliorations (éplucheur auto, grosses patates), couteau visible qui suit le pointeur (4), friteuse (8), jus : particules, nombres flottants, sons (7)
- [x] 6.4 UI : choix de patate + commandes + quêtes + chrono au menu, boutique à onglets (couteaux/patates/améliorations) avec aperçu 3D rotatif (4), classement, bouton Jeter
- [x] 6.5 e2e des nouveautés + vérification finale

## Phase 9 — idées restantes (demande utilisateur : « prépare les tâches et fais-les »)
- [ ] 9.1 Musique générative lofi + ambiance sonore (volume dans Réglages, suit l'ambiance du décor)
- [ ] 9.2 Succès / trophées (toasts, vitrine dans Collection)
- [ ] 9.3 Partage : capture PNG + Web Share
- [ ] 9.4 Manette (Gamepad API : curseur virtuel, A = éplucher/trancher, etc.)
- [ ] 9.5 Clients de restaurant 3D animés liés aux commandes
- [ ] 9.6 Traduction EN (i18n FR/EN, sélecteur de langue)
- [ ] 9.7 Sauvegarde en ligne (mini-serveur Node + export/import + code de synchro)
- [ ] 9.8 Production : Caddy (Brotli/zstd/gzip, HTTPS auto) + doc CDN
- [ ] 9.9 Textures KTX2/Basis : évaluer la faisabilité (encodeur requis)

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

### 2026-09-30 — 6.1/6.2
- Modules purs (potatoes, upgrades, orders, quests, leaderboard) + schéma de sauvegarde tolérant + stores étendus (chrono, commandes, quêtes, patate pourrie, Jeter). Gains rééquilibrés (base 25/70/150). 92 tests verts. Seed e2e dés passée de 7 à 8 (7 = patate pourrie).

### 2026-09-30 — 6.3 moteur
- Variétés (teinte/chair par type), patates verte/pourrie, éplucheur auto (robot en spirale), grosses patates, couteau en survol qui suit le pointeur, friteuse (pièces en arc dans le bac), particules jus/pièces/huile, nombres flottants, sons (erreur, friture, achat). Captures relues : couteau visible, friteuse OK, patate verte OK, violette un peu trop claire (teinte assombrie).

### 2026-09-30 — 6.4/6.5 UI + vérification
- UI : choix de patate, commandes (bonus de plat livré), quêtes du jour (à récupérer), chrono 60 s enchaîné + classement local, boutique à onglets (couteaux avec aperçu 3D rotatif, patates, améliorations), bouton « Jeter » pour patate pourrie/verte, nombres flottants, sons d'achat.
- 92 tests unitaires + 18 e2e verts. Corrections de tests mal conçus : perf (graine constante, sinon le nombre de pièces varie) ; shop (un doublon « rare » rembourse exactement le prix de la caisse, donc ≤ et non <) ; workers Playwright limités à 3 (WebGL logiciel).
- Captures relues : menu (commandes + quêtes), patate verte, éplucheur robot, couteau en survol, friteuse. Aperçu boutique vérifié par e2e (canvas + nom).

## Les 9 suggestions — où les trouver
1. Variétés : `game/data/potatoes.ts`, boutique → Patates. 2. Plats : `game/orders/`. 3. Améliorations : `game/data/upgrades.ts`. 4. Aperçu 3D + couteau visible : `KnifePreview.vue`, `KnifeRig.ts`. 5. Chrono + classement : store `game` + `leaderboard.ts`. 6. Quêtes : `game/quests/`. 7. Jus : particules, flottants, sons. 8. Friteuse + patate pourrie/verte : `Kitchen.ts`, `PiecesGroup.launch`, `badKindForSeed`. 9. Équilibrage : gains de base 25/70/150.

### 2026-09-30 — Retours : éplucheur, peau sur la planche, chair
- Éplucheur 3D texturé (manche bois + acier usé metal_plate_02 CC0) qui suit le pointeur, remplace le robot de l'éplucheur auto.
- Rubans de peau (InstancedMesh, texture de peau) qui tombent et restent sur la planche jusqu'à la manche suivante.
- Chair : texture procédurale (nuages, taches, cernes) mélangée à la peau par un shader partagé (patate entière + pièces, UV planaires continus) ; fini la couleur unie.
- Pinceau d'épluchage agrandi (0,2 → 0,32 rad ; auto 0,28). 92 tests + 18 e2e verts.

### 2026-09-30 — Phase 7 : « claque visuelle », ray tracing, décors achetables
- Graphismes : HDRI Poly Haven (studio, jour, coucher de soleil, nuit), matériaux physiques (clearcoat, sheen), post-traitement (AO N8AO, bloom HDR, ACES, vignette, SMAA ; ultra : bokeh), qualité Basse/Élevée/Ultra (réglages ; `?fx=` dans l'URL ; Playwright reste en « low »).
- Décors achetables (boutique → Décors) : 5 planches (bois, noyer, marbre, ardoise, parquet), 3 murs (crépi, briques, béton), 4 ambiances (studio, jour, coucher de soleil, nuit néon), 5 objets (plante, épices, assiettes, bougies vacillantes, suspension). Sauvegarde + tests.
- Ray tracing : mode photo 📷 = path tracing GPU progressif (three-gpu-pathtracer 0.0.23, WebGL2) : éclairage global, reflets, ombres douces ; orbite caméra autorisée ; export PNG ; retour au temps réel. Particularités : pas de shaders custom en PT (couleurs peau/chair cuites dans les sommets), couleurs de sommet RGBA obligatoires, `dispose()` de la lib cassé (libération manuelle).
- Limite : le bruit « maze/points » des captures vient du rendu logiciel (SwiftShader) ; à valider sur un vrai GPU.
- 100 tests unitaires + 22 e2e verts.

### 2026-09-30 — Éplucheur aligné
- L'éplucheur se pose à plat sur la surface (axe haut = normale du triangle touché) et son manche traîne derrière le sens du mouvement (lissé par slerp) ; valable aussi pour l'éplucheur automatique. Captures relues (dessus, flanc, bord droit).

### 2026-09-30 — Phase 8 : SEO, performance, accessibilité
- **Bundle** : 1 327 Ko (434 Ko gzip) → ~780 Ko au chargement (three 619 + vue 73 + app 90) ; post-traitement (335 Ko) et path tracer (203 Ko) en chunks chargés à la demande ; écrans boutique/collection/réglages/fin de chrono lazy.
- **Assets** : textures JPEG → WebP (10,9 Mo → 1,2 Mo, `scripts/optimize-assets.mjs`), texture WebP ; HDRI chargé uniquement pour l'ambiance active ; service worker (`public/sw.js`) : cache d'abord sur les fichiers hachés, stale-while-revalidate sur les médias, jeu relançable hors-ligne.
- **Runtime** : init de la scène 3D différée après le premier rendu du menu (LCP 10,8 s → 3,3 s en simulation) ; rendu en pause sur les écrans opaques ; résolution adaptative (pixel ratio 0,6–max selon le temps d'image) ; chargement paresseux de PostFx/PathTrace.
- **SEO** : title/description/keywords, canonical, Open Graph + Twitter Card (image 1200×630 issue d'une vraie capture : `e2e/tools/og.spec.ts`), JSON-LD `VideoGame`, `robots.txt` + `sitemap.xml` générés au build (`SITE_URL`), manifest PWA + icônes, contenu HTML indexable pré-rendu dans `#app`, titre dynamique par écran.
- **Production** : `make prod` (nginx : gzip, cache immuable sur /assets, CSP + en-têtes de sécurité, SPA fallback), `SITE_URL=https://… make prod`.
- **Accessibilité** : contraste corrigé, focus visible, canvas focusable (`role=application`), **coupe au clavier** (←/→ + Entrée/Espace), résultats annoncés (dialog aria-live), `prefers-reduced-motion`.
- **Lighthouse (mobile simulé, WebGL logiciel)** : SEO 100, accessibilité 100, bonnes pratiques 78 (seulement « HTTPS » : build servi en http local), performance 39 → 58 (TBT élevé = rendu logiciel SwiftShader, non représentatif d'un vrai GPU).
- Chair de patate réchauffée (jaune crème) + sheen retiré ; 100 tests unitaires + 24 e2e verts.

## Idées d'améliorations restantes
Musique et ambiance sonore ; traduction EN (i18n) ; succès/trophées ; sauvegarde cloud ; partage de captures ; manette ; animations d'accueil ; mode « commande de restaurant » avec client animé ; KTX2/Basis pour les textures GPU ; `renderer.compileAsync` (quand l'extension parallèle est dispo) ; hébergement CDN + Brotli.
