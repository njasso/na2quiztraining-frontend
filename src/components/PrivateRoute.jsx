// src/components/PrivateRoute.jsx
import React from 'react'; 
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Composant de protection des routes.
 * Redirige vers /login si l'utilisateur n'est pas connecté.
 */
const PrivateRoute = ({ children }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  // 1. Pendant que le AuthContext vérifie le token (au démarrage ou refresh)
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #05071a 0%, #0a0f2e 100%)',
      }}>
        {/* Loader visuel */}
        <div className="loader-fallback" style={{
          width: 48,
          height: 48,
          border: '3px solid rgba(99,102,241,0.1)',
          borderTopColor: '#6366f1',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // 2. Si le chargement est fini et que l'utilisateur n'est pas authentifié
  if (!isAuthenticated || !user) {
    // On redirige vers /login en passant l'URL actuelle dans "state"
    // pour permettre une redirection post-connexion fluide.
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // 3. Si l'utilisateur est authentifié, on affiche les composants enfants
  return children;
};

export default PrivateRoute;