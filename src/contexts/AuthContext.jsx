// frontend/src/contexts/AuthContext.jsx — VERSION CORRIGÉE
import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { login as apiLogin, verifyToken as apiVerify, logout as apiLogout } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans un AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const initDone = useRef(false);

  // ── Gestion réseau ─────────────────────────────────────────
  useEffect(() => {
    const onOnline = () => { 
      setIsOnline(true); 
      toast.success('Connexion rétablie'); 
    };
    const onOffline = () => { 
      setIsOnline(false); 
      toast.error('Mode hors-ligne activé'); 
    };
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  // ── Helpers localStorage ───────────────────────────────────
  const saveAuth = (token, refreshToken, userData) => {
    localStorage.setItem('token', token);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const clearAuth = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  };

  const getCachedUser = () => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  // ── Init au démarrage ──────────────────────────────────────
  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;

    const init = async () => {
      const storedToken = localStorage.getItem('token');
      
      // ✅ Si pas de token, on skip complètement l'appel API
      if (!storedToken) {
        console.log('🔍 Pas de token, skip verification');
        setLoading(false);
        return;
      }

      // ✅ Mode hors-ligne : utiliser le cache sans appel réseau
      if (!navigator.onLine) {
        const cached = getCachedUser();
        if (cached) {
          console.log('📱 Mode hors-ligne, utilisation du cache');
          setUser(cached);
        }
        setLoading(false);
        return;
      }

      try {
        console.log('🔍 Vérification du token...');
        const res = await apiVerify();
        
        if (res?.success && res.user) {
          console.log('✅ Token valide, utilisateur chargé');
          setUser(res.user);
          localStorage.setItem('user', JSON.stringify(res.user));
        } else {
          console.log('❌ Token invalide, déconnexion');
          clearAuth();
          setUser(null);
        }
      } catch (err) {
        console.log('⚠️ Erreur lors de la vérification:', err?.response?.status);
        // ✅ Ne pas déconnecter sur des erreurs réseau temporaires
        if (err?.response?.status === 401) {
          console.log('❌ Token invalide (401), déconnexion');
          clearAuth();
          setUser(null);
        } else {
          // Erreur réseau ou serveur → garder le cache si disponible
          console.log('⚠️ Erreur réseau, utilisation du cache si disponible');
          const cached = getCachedUser();
          if (cached) {
            setUser(cached);
          } else {
            // Pas de cache, on laisse user à null
            setUser(null);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  // ── Login ──────────────────────────────────────────────────
  const login = async (email, password, revokeDeviceId) => {
    if (!isOnline) {
      toast.error('Pas de connexion internet');
      return { success: false, error: 'Hors-ligne' };
    }

    try {
      console.log('🔐 Tentative de connexion...');
      const response = await apiLogin({ email, password }, revokeDeviceId);
      console.log('📦 Réponse login:', response);

      if (response?.success && response.token && response.user) {
        saveAuth(response.token, response.refreshToken, response.user);
        setUser(response.user);
        toast.success('Connexion réussie !');
        return { success: true };
      }

      const errorMsg = response?.error || 'Erreur de connexion';
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    } catch (err) {
      console.error('❌ Erreur login:', err);

      // ✅ NOUVEAU : blocage explicite du 3e appareil — remonte la liste des
      // appareils actifs pour que l'écran de connexion propose d'en libérer un,
      // plutôt qu'un simple message d'erreur sans action possible.
      if (err?.response?.status === 409 && err?.response?.data?.code === 'DEVICE_LIMIT_REACHED') {
        return {
          success: false,
          deviceLimitReached: true,
          devices: err.response.data.devices || [],
          error: err.response.data.error,
        };
      }

      let msg = 'Erreur de connexion au serveur';
      if (err?.response?.status === 401) msg = 'Email ou mot de passe incorrect';
      else if (err?.response?.status === 429) msg = err?.response?.data?.error || 'Trop de tentatives';
      else if (!err?.response) msg = 'Serveur inaccessible';
      toast.error(msg);
      return { success: false, error: msg };
    }
  };

  // ── Logout ─────────────────────────────────────────────────
  const logout = useCallback(async (silent = false) => {
    try {
      await apiLogout();
    } catch (error) {
      console.error('Erreur logout API:', error);
    } finally {
      clearAuth();
      setUser(null);
      if (!silent) toast.success('Déconnexion réussie');
    }
  }, []);

  // ── updateUser ─────────────────────────────────────────────
  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  }, []);

  // ✅ isAuthenticated - vérifie token ET user
  const isAuthenticated = !!user && !!localStorage.getItem('token');

  // ── hasRole ────────────────────────────────────────────────
  const hasRole = useCallback((role) => {
    if (!user?.role) return false;
    const r = user.role;
    switch (String(role).toUpperCase()) {
      case 'ADMIN_SYSTEME':
      case 'SUPERADMIN':
        return r === 'superadmin';
      case 'ADMIN_DELEGUE':
      case 'ADMIN':
        return r === 'admin' || r === 'superadmin';
      case 'FORMATEUR':
        return r === 'formateur' || r === 'admin' || r === 'superadmin';
      case 'MODERATEUR':
      case 'MODERATOR':
        return r === 'moderator' || r === 'admin' || r === 'superadmin';
      case 'USER':
        return true;
      default:
        return r === role;
    }
  }, [user]);

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  // Écouter les événements logout depuis l'intercepteur Axios
  useEffect(() => {
    const handler = () => logout(true);
    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, [logout]);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isOnline,
      isAuthenticated,
      hasRole,
      isAdmin,
      login,
      logout,
      updateUser,
      checkAuth: () => {
        if (!isAuthenticated) {
          toast.error('Veuillez vous connecter');
          return false;
        }
        return true;
      },
    }}>
      {children}
    </AuthContext.Provider>
  );
};