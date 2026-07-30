// src/config/env.js — Configuration centralisée de l'environnement
// Source unique de vérité pour les URLs backend/API.
// Utilise les variables Vite (import.meta.env) avec fallback développement.

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// BACKEND_URL = racine du serveur (sans /api) — utile pour les fichiers statiques (/uploads)
const BACKEND_URL = API_URL.replace(/\/api\/?$/, '');

const ENV_CONFIG = {
  API_URL,
  BACKEND_URL,
  UPLOADS_URL: `${BACKEND_URL}/uploads`,
  IS_PROD: import.meta.env.PROD,
  IS_DEV: import.meta.env.DEV,
  APP_NAME: 'NA2 Quiz Training',
  MAX_IMPORT_QUESTIONS: 2000,
  MAX_IMAGE_SIZE_MB: 2,
};

export default ENV_CONFIG;
