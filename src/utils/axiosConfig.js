import axios from 'axios';

const apiClient = axios.create({
  baseURL: `${(import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api$/, "")}/api`,
  timeout: 10000,
});

// Intercepteur pour ajouter le token JWT
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Gestion centralisée des erreurs
apiClient.interceptors.response.use(
  response => response,
  error => {
    const errorMessage = error.response?.data?.message || 
      error.message || 
      'Erreur de connexion au serveur';
    return Promise.reject(errorMessage);
  }
);

export default apiClient;