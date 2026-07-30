# NA2 Quiz Training — Frontend

Application React (Vite + PWA) de la plateforme éducative NA2 Quiz Training.

## Démarrage local
```bash
npm install
echo "VITE_API_URL=http://localhost:5000/api" > .env
npm run dev          # http://localhost:5173
npm run build        # production → dist/
```

## Structure
- `src/pages/` — écrans (apprenant, formateur, admin)
- `src/components/NavHome.jsx` — bouton Accueil/Retour présent sur toutes les pages
- `src/components/CloudImageUpload.jsx` — upload d'images vers Cloudinary
- `src/hooks/useAntiCheat.js` — surveillance anti-triche des quiz et épreuves
- `src/hooks/useReferential.js` — cascade Domaine → Sous-domaine → Niveau → Matière
- `src/data/domainConfig.js` — référentiel codifié du système éducatif camerounais
- `src/services/http.js` — client axios (jeton automatique)

## Variables d'environnement
| Variable | Rôle |
|---|---|
| `VITE_API_URL` | URL de l'API, **avec `/api`** |
| `VITE_CAMPAY_APP_ID` | widget de paiement Campay |
| `VITE_CLOUDINARY_CLOUD_NAME` | affichage optimisé des images |

Déploiement : voir **DEPLOIEMENT.md**.
