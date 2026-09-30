# Règles pour l'agent (Potato Cutter)

1. **Ne jamais exécuter `node`, `npm`, `npx` ou `vite` sur l'hôte** (nvm existe mais c'est interdit). Tout passe par `./scripts/npm.sh`, `./scripts/check.sh`, `./scripts/e2e.sh` ou `docker compose run --rm app …`.
2. Boucle : lire `PROGRESS.md` → faire UNIQUEMENT la « Prochaine étape » → lancer sa validation → mettre à jour PROGRESS (case, journal, prochaine étape) → `git commit` (`feat(x.y): …`).
3. Ne pas avancer si la validation est rouge. Après 3 échecs sur un même point : plan B, noter dans « Blocages », continuer.
4. Ne pas affaiblir un test pour qu'il passe, sauf s'il est prouvé faux (justifier dans le journal).
5. `src/game/**` n'importe jamais Vue/Pinia. Aucun objet three dans un état réactif. Toujours `dispose()`.
6. Étapes 3D : relire les captures `artifacts/screens/*.png` et décrire ce qui est visible.
7. Pas de `docker compose down -v` sans raison. Après modif de `package.json` : `./scripts/npm.sh install`.
8. UI en français. Pas de vue-router. Toute nouvelle dépendance est notée dans « Décisions ».
9. TypeScript reste en 5.9 (TS 7 incompatible avec vue-tsc).
Plan complet : `/home/giga/.claude/plans/floating-dancing-moore.md`.
