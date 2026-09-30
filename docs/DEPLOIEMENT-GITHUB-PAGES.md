# Publier Potato Cutter sur GitHub Pages (guide pour débutant)

GitHub peut héberger gratuitement le jeu (c'est un site 100 % statique : des fichiers HTML/JS/images, sans serveur).
Tout est déjà prêt dans le projet : **il n'y a qu'un seul réglage à faire sur le site de GitHub** (étape 3).
À chaque fois que tu envoies du code sur GitHub, le jeu est reconstruit et republié automatiquement.

---

## Ce dont tu as besoin

- Un compte GitHub (gratuit) : <https://github.com/signup>
- `git` installé sur ta machine (tu l'as déjà, le projet est un dépôt git).
- Un dépôt **public** (le plan gratuit de GitHub ne propose Pages que pour les dépôts publics ; les dépôts privés demandent un abonnement payant).

## Étape 1 — Créer le dépôt sur GitHub

1. Connecte-toi sur <https://github.com> puis clique sur **+** (en haut à droite) → **New repository**.
2. **Repository name** : par exemple `potato-cutter` (ce nom apparaîtra dans l'adresse du jeu).
3. Choisis **Public**.
4. **Ne coche rien** d'autre (pas de README, pas de .gitignore, pas de licence : le projet en a déjà).
5. Clique sur **Create repository**. GitHub t'affiche une page avec l'adresse du dépôt, du type
   `https://github.com/TON-PSEUDO/potato-cutter.git` : garde-la sous la main.

## Étape 2 — Envoyer le projet sur GitHub

Dans un terminal, dans le dossier du projet (`potato-cutter/`) :

```bash
# 1. relier ton dossier au dépôt GitHub (remplace TON-PSEUDO)
git remote add origin https://github.com/TON-PSEUDO/potato-cutter.git

# 2. la branche principale s'appelle « main » chez GitHub (chez toi : « master »)
git branch -M main

# 3. envoyer le code
git push -u origin main
```

**Authentification** : GitHub n'accepte plus le mot de passe du compte pour `git push`. Deux solutions simples :

- **GitHub CLI** (le plus simple) : installe <https://cli.github.com>, lance `gh auth login`, choisis *GitHub.com → HTTPS → Login with a web browser* et suis les instructions. Ensuite `git push` fonctionne.
- **Jeton (token)** : <https://github.com/settings/tokens> → *Generate new token (classic)* → coche `repo` et `workflow` → copie le jeton et colle-le à la place du mot de passe quand git le demande.

> Astuce tout-en-un avec GitHub CLI (crée le dépôt et envoie le code) :
> `gh repo create potato-cutter --public --source=. --remote=origin --push`

## Étape 3 — Activer GitHub Pages (le seul réglage à faire)

1. Sur la page de ton dépôt GitHub, clique sur l'onglet **Settings** (Paramètres).
2. Dans le menu de gauche, clique sur **Pages**.
3. Dans **Build and deployment**, à la ligne **Source**, choisis **GitHub Actions**
   (et **pas** « Deploy from a branch »).

C'est tout. Il n'y a rien à enregistrer : le choix est pris en compte tout de suite.

## Étape 4 — Lancer et vérifier la publication

1. Clique sur l'onglet **Actions** du dépôt. Tu y vois le workflow **« Déployer sur GitHub Pages »**.
   - S'il n'a pas démarré tout seul : clique dessus → **Run workflow** → **Run workflow**.
   - Si GitHub affiche un bouton « I understand my workflows, go ahead and enable them », clique dessus.
2. Attends 2 à 4 minutes. Les deux étapes `build` puis `deploy` passent au vert ✅.
3. L'adresse du jeu apparaît dans l'étape **deploy** et dans **Settings → Pages** :

   `https://TON-PSEUDO.github.io/potato-cutter/`

La première publication peut mettre quelques minutes à devenir visible. Si tu vois une erreur 404, patiente 5 minutes et rafraîchis (Ctrl+F5).

## Mettre à jour le jeu

Tu modifies le code, puis :

```bash
git add -A
git commit -m "Mon changement"
git push
```

GitHub reconstruit et republie tout seul (onglet **Actions** pour suivre).
Si les vérifications (types ou tests) échouent, rien n'est publié : la version en ligne reste intacte.

---

## Option : utiliser ton propre nom de domaine (ex. `patate.mon-site.fr`)

1. Sur GitHub : **Settings → Secrets and variables → Actions → onglet Variables → New repository variable**
   - Name : `CUSTOM_DOMAIN`
   - Value : `patate.mon-site.fr` (sans `https://`)
2. Chez ton registrar (OVH, Gandi, Cloudflare…), ajoute les enregistrements DNS :
   - pour un **sous-domaine** (`patate.mon-site.fr`) : un enregistrement **CNAME** `patate` → `TON-PSEUDO.github.io`
   - pour un **domaine nu** (`mon-site.fr`) : quatre enregistrements **A** vers
     `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
     (et, si tu veux l'IPv6, quatre **AAAA** : `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`).
3. **Settings → Pages → Custom domain** : écris ton domaine, clique **Save**, puis coche **Enforce HTTPS** quand l'option devient disponible (le certificat est gratuit et automatique, comptez jusqu'à une heure).
4. Relance le workflow (**Actions → Run workflow**) pour que le site soit reconstruit avec la bonne adresse
   (le workflow écrit le fichier `CNAME` et règle les liens SEO tout seul).

---

## Ce qui change par rapport à ta version locale

| Sujet | Sur GitHub Pages |
|---|---|
| **Sauvegarde en ligne (code de synchro)** | **Désactivée** : il n'y a pas de serveur. Le jeu l'indique dans Réglages. Utilise **Exporter / Importer (.json)** pour déplacer ta sauvegarde. |
| Sauvegarde automatique | Toujours active, dans le navigateur (localStorage) : propre à chaque appareil/navigateur. |
| Hors-ligne | Fonctionne après une première visite (service worker). |
| Adresse | `https://PSEUDO.github.io/NOM-DU-DÉPÔT/` : le jeu sait s'adapter à ce sous-dossier. |
| Référencement (SEO) | Adresse canonique, sitemap, robots.txt et image de partage sont générés avec la bonne adresse. |
| Compression | GitHub compresse en gzip ; pas de Brotli (c'est pour ça que `make prod` reste utile si tu héberges toi-même). |

Pour avoir la sauvegarde en ligne, il faut un vrai serveur (voir `make prod` dans le README : Caddy + API).

## Tester « comme GitHub Pages » sur ta machine

```bash
make pages          # construit avec le même sous-dossier et sans API, puis sert http://localhost:4173/potato-cutter/
./scripts/pages-check.sh   # idem + test automatique (aucune ressource 404, textures, manifest…)
```

## Si ça ne marche pas

| Symptôme | Cause probable et solution |
|---|---|
| Onglet **Actions** vide / le workflow ne se lance pas | Les Actions sont désactivées : **Settings → Actions → General → Allow all actions**. Vérifie aussi que tu as bien poussé sur `main` (ou `master`). |
| Étape `deploy` en erreur « Pages not enabled » / `Get Pages site failed` | L'étape 3 n'a pas été faite : **Settings → Pages → Source = GitHub Actions**, puis **Re-run jobs**. |
| Étape `build` rouge (typecheck / tests) | Lis le message dans les logs ; en local : `make check`. Rien n'est publié tant que c'est rouge. |
| Page blanche, console pleine de 404 sur `/assets/…` | Mauvais sous-dossier. Le workflow le calcule à partir du nom du dépôt : ne renomme pas le dépôt sans relancer le workflow. Pour un domaine perso, définis la variable `CUSTOM_DOMAIN`. |
| 404 GitHub tout de suite après la 1re publication | Attends quelques minutes, puis Ctrl+F5. |
| Ancienne version affichée après une mise à jour | Le service worker garde un cache : recharge avec Ctrl+F5 (ou fenêtre de navigation privée). |
| Erreur `remote: Permission denied` au `git push` | Mauvaise authentification : utilise `gh auth login` ou un jeton avec les droits `repo` + `workflow`. |
| Erreur « refusing to allow a Personal Access Token to create or update workflow » | Ton jeton n'a pas le droit `workflow` : crée-en un avec cette case cochée. |
| Le dépôt est privé et Pages est grisé | Pages gratuit = dépôts publics uniquement. Passe le dépôt en public (**Settings → General → Danger Zone → Change visibility**) ou prends un plan payant. |
| Le jeu est lent / noir | Le jeu demande WebGL 2 : active l'accélération matérielle du navigateur. En qualité « Basse » (Réglages) c'est plus léger. |

## Limites de GitHub Pages (à connaître)

- Taille du site publié : 1 Go maximum (le jeu fait environ 30 Mo). Trafic : environ 100 Go/mois. Publications : 10 par heure.
- Sites destinés à un usage non commercial raisonnable (voir les conditions d'utilisation de GitHub Pages).
- Pas de code serveur : c'est pourquoi la sauvegarde en ligne est désactivée.

## Ce qui a été ajouté au projet pour ça (pour les curieux)

- `.github/workflows/deploy.yml` : construit et publie le site à chaque push.
- `.github/workflows/ci.yml` : vérifie chaque Pull Request (types, tests, build).
- `vite.config.ts` : variable `BASE_PATH` (sous-dossier), `SITE_URL` (adresse pour le SEO).
- `VITE_CLOUD=off` : masque la sauvegarde en ligne quand il n'y a pas de serveur.
- `public/sw.js` et `public/manifest.webmanifest` : chemins relatifs au sous-dossier.
