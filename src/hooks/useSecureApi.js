// src/hooks/useSecureApi.js
import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export const useSecureApi = () => {
  const { user, isAuthenticated, checkAuth } = useAuth();

  const secureCall = useCallback(async (apiCall, fallbackData = null, options = {}) => {
    const {
      showToast = true,
      errorMessage = 'Une erreur est survenue',
      requireAuth = true,
      retries = 2
    } = options;

    // Vérification d'authentification
    if (requireAuth && !isAuthenticated) {
      if (!checkAuth()) {
        return { success: false, error: 'Non authentifié', data: fallbackData };
      }
    }

    // Vérification token localStorage
    if (requireAuth && !localStorage.getItem('token')) {
      toast.error('Session invalide');
      return { success: false, error: 'Token manquant', data: fallbackData };
    }

    let attempts = 0;
    while (attempts <= retries) {
      try {
        const result = await apiCall();
        return { success: true, data: result };
      } catch (error) {
        attempts++;
        
        // Dernière tentative échouée
        if (attempts > retries) {
          console.error('❌ Échec après', retries, 'tentatives:', error);
          
          if (showToast) {
            toast.error(error.message || errorMessage);
          }
          
          return { 
            success: false, 
            error: error.message, 
            data: fallbackData 
          };
        }
        
        // Attente avant retry (exponential backoff)
        await new Promise(resolve => 
          setTimeout(resolve, Math.min(1000 * Math.pow(2, attempts), 5000))
        );
      }
    }
  }, [isAuthenticated, checkAuth]);

  return { secureCall };
};