// src/services/http.js — Client HTTP axios configuré (indépendant de api.js)
// Utilisé par les pages admin (QCM Cleaner, Banque QCM, Créer une question)
// pour garantir un client avec .get/.post/.put/.delete quel que soit
// le format d'export de services/api.js.
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const http = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

// Jeton d'authentification sur chaque requête
http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Session expirée → retour au login
http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const msg = error.response?.data?.code;
      if (msg === 'TOKEN_EXPIRED') {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default http;