# 🚀 Déploiement en production — NA2 Quiz Training

Architecture : **MongoDB Atlas** (base) → **Render** (backend API) → **Netlify** (frontend) → **Cloudinary** (images) → **Campay** (paiements).

---

## ⚠️ Avant de commencer : sécurité

Les identifiants partagés en clair doivent être régénérés :

1. **MongoDB Atlas** → Database Access → modifier le mot de passe de `efelixmagloire_db_user` → *Edit password* → *Autogenerate*.
2. **Campay** → régénérer les clés API si elles ont circulé.
3. Ne jamais committer `.env` (déjà couvert par `.gitignore`).

---

## 1️⃣ MongoDB Atlas

1. Cluster → **Connect** → *Drivers* → copier l'URI.
2. Ajouter le nom de la base **avant** le `?` :
   ```
   mongodb+srv://USER:MOTDEPASSE@cluster0.qvot8bv.mongodb.net/quizdb?retryWrites=true&w=majority
   ```
3. **Network Access** → *Add IP Address* → `0.0.0.0/0` (Render utilise des IP dynamiques).
4. Vérifier dans **Database → Browse Collections** que la base s'appelle bien `quizdb`.

---

## 2️⃣ Backend sur Render

### Pousser le code
```bash
cd Backend_NA2QUIZ_FINAL
git init
git add .
git commit -m "Backend production : Cloudinary, Campay, anti-triche, bulletins"
git branch -M main
git remote add origin https://github.com/njasso/na2quiztraining-backend.git
git push -u origin main
```

### Créer le service
1. [render.com](https://render.com) → **New +** → *Web Service* → connecter le dépôt `na2quiztraining-backend`.
2. Région **Frankfurt**, Build `npm install`, Start `npm start`, Health check `/health`.
3. **Environment** → ajouter les variables (voir `.env.example`) :

| Variable | Valeur |
|---|---|
| `NODE_ENV` | `production` |
| `MONGODB_URI` | votre URI Atlas avec `/quizdb` |
| `JWT_SECRET` | chaîne aléatoire 64+ caractères |
| `JWT_REFRESH_SECRET` | une autre chaîne aléatoire |
| `CLIENT_URL` | `https://VOTRE-SITE.netlify.app` |
| `FRONTEND_URL` | idem |
| `PUBLIC_BASE_URL` | `https://na2quiztraining-backend.onrender.com` |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | depuis le dashboard Cloudinary |
| `CAMPAY_APP_ID` / `_APP_USERNAME` / `_APP_PASSWORD` / `_ACCESS_TOKEN` / `_WEBHOOK_KEY` | depuis Campay |
| `CAMPAY_API_URL` | `https://demo.campay.net/api` (démo) |
| `CAMPAY_ENVIRONMENT` | `sandbox` puis `production` |

> Générer un secret : `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

4. Déployer, puis vérifier `https://na2quiztraining-backend.onrender.com/health` → doit afficher `"database": {"stateText": "connected"}`.

### Créer le premier administrateur
Render → onglet **Shell** :
```bash
node scripts/createAdmin.js admin@na2quiz.cm VotreMotDePasseFort "Votre Nom" superadmin
```

> ⚠️ Le plan **Free** met le service en veille après 15 min d'inactivité (premier appel ~50 s). Pour des tests avec de vrais élèves, passez au plan **Starter** (7 $/mois).

---

## 3️⃣ Frontend sur Netlify

```bash
cd Frontend_NA2QUIZ_FINAL
git init
git add .
git commit -m "Frontend production : anti-triche, Cloudinary, navigation"
git branch -M main
git remote add origin https://github.com/njasso/na2quiztraining-frontend.git
git push -u origin main
```

1. [netlify.com](https://netlify.com) → **Add new site** → *Import from Git* → dépôt `na2quiztraining-frontend`.
2. Build `npm run build`, Publish `dist` (déjà dans `netlify.toml`).
3. **Site settings → Environment variables** :

| Variable | Valeur |
|---|---|
| `VITE_API_URL` | `https://na2quiztraining-backend.onrender.com/api` ← **le `/api` est obligatoire** |
| `VITE_CAMPAY_APP_ID` | votre App ID Campay |
| `VITE_CLOUDINARY_CLOUD_NAME` | votre cloud name |

4. **Deploy site**. Puis retourner sur Render mettre `CLIENT_URL` = l'URL Netlify obtenue, et redéployer le backend.

---

## 4️⃣ Cloudinary (images des questions)

1. Créer un compte gratuit sur [cloudinary.com](https://cloudinary.com) (25 Go/mois — largement suffisant).
2. Dashboard → **Product Environment Credentials** → copier *Cloud name*, *API Key*, *API Secret*.
3. Les renseigner dans Render.
4. Vérification : `https://VOTRE-BACKEND.onrender.com/api/upload/status` doit renvoyer `"provider": "cloudinary"`.

Si Cloudinary n'est pas configuré, l'application **continue de fonctionner** avec le stockage local — mais sur Render, les fichiers locaux sont **perdus à chaque redéploiement**. Cloudinary est donc indispensable en production.

---

## 5️⃣ Campay (abonnements)

### Configurer le webhook
Dans le dashboard Campay, champ **URL de rappel** :
```
https://na2quiztraining-backend.onrender.com/api/payments/webhook
```
Copier la **App webhook key** dans la variable `CAMPAY_WEBHOOK_KEY` sur Render : sans elle, le webhook accepte toute requête ; avec elle, la signature est vérifiée.

### Tester en démo
- Numéros de test : MTN `237670000000`, Orange `237690000000`
- Code de validation : `000000`
- Suivi : `GET /api/payments/admin/transactions` (compte admin)

### Passer en production
1. `CAMPAY_API_URL` = `https://www.campay.net/api`
2. `CAMPAY_ENVIRONMENT` = `production`
3. Remplacer les clés démo par les clés live.

### Filet de sécurité
Si un webhook est perdu, un admin appelle `POST /api/payments/reconcile` : le serveur réinterroge Campay pour chaque paiement en attente et active les abonnements confirmés. À programmer en tâche planifiée (Render Cron) toutes les heures si besoin.

---

## 6️⃣ Vérifications après déploiement

| Test | Attendu |
|---|---|
| `GET /health` | `status: UP`, database `connected` |
| `GET /api/upload/status` | `provider: cloudinary` |
| `GET /api/payments/plans` | liste des 4 plans |
| Connexion sur le site | arrive sur le tableau de bord |
| Import massif (admin) | rapport « X importées » |
| Upload d'image sur une question | URL `res.cloudinary.com` |
| Quiz avec 2 comptes différents | ordres de questions différents |
| Onglet changé pendant un quiz | avertissement affiché |
| Bulletin PDF | mention, note /20, appréciation, rang remplis |

---

## 7️⃣ Après les tests

- **Sauvegardes** : Atlas → *Backup* (activé par défaut sur M0 pendant 2 jours ; passez à M2/M10 pour des sauvegardes continues).
- **Journal des sessions suspectes** : `GET /api/proctoring/flagged`.
- **Surveillance** : Render → *Logs* et *Metrics*.
- **Domaine personnalisé** : Netlify → *Domain management* (HTTPS automatique).
