# GUIDE DE MIGRATION — NA2 Quiz
# Appliquer dans cet ordre exact

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## ÉTAPE 0 — SÉCURITÉ IMMÉDIATE (avant tout)
## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 0a. Révoquer toutes les clés API exposées
# Aller sur chaque console et révoquer/régénérer :
# - OpenAI      : https://platform.openai.com/api-keys
# - Anthropic   : https://console.anthropic.com/settings/keys
# - DeepSeek    : https://platform.deepseek.com/api_keys
# - Google/Gemini: https://aistudio.google.com/app/apikey
# - Firebase    : https://console.firebase.google.com → Paramètres projet
# - Email Gmail : Générer un nouveau "mot de passe d'application"

### 0b. Ajouter .env au .gitignore MAINTENANT
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
git rm --cached backend/.env frontend/.env 2>/dev/null || true
git add .gitignore
git commit -m "fix: remove .env from tracking"

### 0c. Créer les nouveaux .env depuis les .env.example
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
# Puis remplir les valeurs réelles dans ces fichiers

### 0d. Générer un vrai JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Copier la sortie dans backend/.env comme JWT_SECRET

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## ÉTAPE 1 — BACKEND : nettoyer les fichiers
## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 1a. Supprimer les fichiers dupliqués/inutiles
rm backend/app.js              # doublon de server.js (ES modules partiel)
rm backend/index.js            # doublon en CommonJS
rm backend/middleware/authMiddleware.js  # copie exacte de middleware/auth.js

### 1b. Vérifier que package.json pointe sur server.js
# backend/package.json doit avoir :
# "main": "server.js"
# "scripts": { "start": "node server.js", "dev": "nodemon server.js" }

### 1c. Mettre à jour les imports middleware dans toutes les routes
# Remplacer partout :
#   import { protect } from '../middleware/authMiddleware.js';
# par :
#   import { protect } from '../middleware/auth.js';
#
# Commande pour trouver tous les fichiers à modifier :
grep -rl "authMiddleware" backend/routes/ backend/controllers/

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## ÉTAPE 2 — REMPLACER LES FICHIERS BACKEND
## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Copier les fichiers corrigés depuis ce dossier :

# MODÈLES (changements structurels — migration DB requise)
cp corrections/backend/models/Quiz.js      backend/models/Quiz.js
cp corrections/backend/models/Result.js    backend/models/Result.js

# MIDDLEWARE (unifié)
cp corrections/backend/middleware/auth.js  backend/middleware/auth.js

# CONTROLLERS
cp corrections/backend/controllers/quizController.js   backend/controllers/quizController.js
cp corrections/backend/controllers/authController.js   backend/controllers/authController.js

# ROUTES
cp corrections/backend/routes/authRoutes.js   backend/routes/authRoutes.js
cp corrections/backend/routes/users.js        backend/routes/users.js
cp corrections/backend/routes/results.js      backend/routes/results.js
cp corrections/backend/routes/dashboard.js    backend/routes/dashboard.js
cp corrections/backend/routes/statsRoutes.js  backend/routes/statsRoutes.js

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## ÉTAPE 3 — MIGRATION BASE DE DONNÉES
## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Le modèle Quiz a changé : 'createdBy' → 'author'
# Exécuter ce script de migration MongoDB une seule fois :

# Dans mongo shell ou Compass :
# db.quizzes.updateMany(
#   { createdBy: { $exists: true }, author: { $exists: false } },
#   [{ $set: { author: "$createdBy" } }]
# )
#
# Vérifier :
# db.quizzes.find({ author: { $exists: false } }).count()
# → doit retourner 0

# Le modèle Result a changé : userId → user (+ alias userId conservé)
# Pas de migration nécessaire grâce au hook pre-save qui synchronise

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## ÉTAPE 4 — FRONTEND : nettoyer les fichiers
## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 4a. Supprimer les doublons frontend
rm frontend/src/routes/AppRoutes.js      # version cassée avec pages fantômes
rm frontend/src/QuizGenerator.jsx        # doublon
rm frontend/src/components/QuizGenerator.js   # doublon .js
rm frontend/src/components/ui/QuizGenerator.jsx  # doublon ui/
# Garder : frontend/src/components/QuizGenerator.jsx

# Fichiers backend qui ont glissé dans le frontend (à supprimer)
rm frontend/conf/db.js
rm frontend/conf/jwt.js
rm frontend/config/db.js
rm frontend/config/jwt.js
rm frontend/index.js
rm frontend/api/admin/users/Node.js
rm "frontend/scripts/checkQuestionsFormat.mjs "   # le nom avec espace !

# Fichiers Firebase en double
rm frontend/src/services/servicesfirebase.config.js
# Garder un seul : src/services/firebase.config.js

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## ÉTAPE 5 — REMPLACER LES FICHIERS FRONTEND
## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

cp corrections/frontend/src/App.jsx                     frontend/src/App.jsx
cp corrections/frontend/src/contexts/AuthContext.jsx    frontend/src/contexts/AuthContext.jsx
cp corrections/frontend/src/services/api.js             frontend/src/services/api.js
cp corrections/frontend/src/services/quizData.js        frontend/src/services/quizData.js
cp corrections/frontend/src/pages/QuizPage.jsx          frontend/src/pages/QuizPage.jsx
cp corrections/frontend/.env.example                    frontend/.env.example
cp corrections/.gitignore                               .gitignore

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## ÉTAPE 6 — VÉRIFICATIONS FINALES
## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 6a. Démarrer le backend et tester
cd backend && npm run dev
# Vérifier : http://localhost:5000/health → { status: "UP" }
# Vérifier : http://localhost:5000/api/routes → liste toutes les routes

### 6b. Tester les routes critiques
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Test","lastName":"User","email":"test@test.com","password":"Test1234"}'

### 6c. Vérifier que les routes protégées retournent 401 sans token
curl http://localhost:5000/api/dashboard
# → { "success": false, "error": "Accès refusé — token manquant" }

curl http://localhost:5000/api/stats
# → { "success": false, "error": "Accès refusé — token manquant" }

### 6d. Démarrer le frontend
cd frontend && npm run dev
# Vérifier : http://localhost:5173

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## RÉSUMÉ DES FICHIERS MODIFIÉS
## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# BACKEND — 9 fichiers modifiés :
# backend/models/Quiz.js            ← +isPublic, +likes, +author, +category...
# backend/models/Result.js          ← required:false, cohérence user/userId
# backend/middleware/auth.js        ← unifié (authMiddleware.js supprimé)
# backend/controllers/quizController.js  ← ownership, score%, submitQuiz correct
# backend/controllers/authController.js  ← validation, refresh token
# backend/routes/authRoutes.js      ← POST /refresh ajouté, rate limiting
# backend/routes/users.js           ← calculateLeaderboard implémentée
# backend/routes/results.js         ← cohérence user/userId, propriété
# backend/routes/dashboard.js       ← protect ajouté
# backend/routes/statsRoutes.js     ← protect ajouté, vrais modèles

# BACKEND — 3 fichiers supprimés :
# backend/app.js
# backend/index.js
# backend/middleware/authMiddleware.js

# FRONTEND — 5 fichiers modifiés :
# frontend/src/App.jsx              ← routes rationalisées (34→20)
# frontend/src/contexts/AuthContext.jsx  ← refresh, offline, events
# frontend/src/services/api.js      ← fallback supprimé, refresh corrigé
# frontend/src/services/quizData.js ← double return, this invalide
# frontend/src/pages/QuizPage.jsx   ← score%, champs Result corrects, revue

# FRONTEND — ~8 fichiers supprimés (doublons) :
# AppRoutes.js, QuizGenerator.js/.jsx (x3), conf/db.js, conf/jwt.js...
