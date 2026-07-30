// src/components/NavHome.jsx — Navigation de secours universelle
// Résout le problème « impossible de revenir depuis les réglages admin » :
// un bouton Accueil + Retour est disponible sur TOUTES les pages.
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, ArrowLeft, LayoutDashboard, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Barre de navigation de secours, fixée en haut à gauche.
 * <NavHome />                        → Retour + Accueil (+ Admin si admin)
 * <NavHome variant="inline" />       → version intégrée dans un en-tête de page
 * <NavHome hideBack />               → seulement Accueil
 */
const NavHome = ({ variant = 'floating', hideBack = false, homeTo, label }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth() || {};

  const isAdmin = ['admin', 'superadmin'].includes(user?.role);
  const inAdmin = location.pathname.startsWith('/admin');

  // Destination « accueil » adaptée au rôle et au contexte
  const home = homeTo
    || (inAdmin && isAdmin ? '/admin'
      : isAuthenticated ? '/dashboard'
      : '/');

  const homeLabel = label || (inAdmin && isAdmin ? 'Tableau admin' : isAuthenticated ? 'Tableau de bord' : 'Accueil');

  const btn = {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '9px 16px', borderRadius: 10, cursor: 'pointer',
    fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(99,102,241,0.28)',
    color: '#c7d2fe', backdropFilter: 'blur(8px)',
    transition: 'all .18s ease',
  };
  const primary = {
    ...btn,
    background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
    border: 'none', color: '#fff',
    boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
  };

  const wrap = variant === 'floating'
    ? {
        position: 'fixed', top: 14, left: 14, zIndex: 1200,
        display: 'flex', gap: 8, flexWrap: 'wrap', maxWidth: 'calc(100vw - 28px)',
      }
    : { display: 'flex', gap: 8, alignItems: 'center', marginBottom: 18, flexWrap: 'wrap' };

  const canGoBack = typeof window !== 'undefined' && window.history.length > 1;

  return (
    <nav style={wrap} aria-label="Navigation de secours">
      {!hideBack && canGoBack && (
        <button type="button" style={btn} onClick={() => navigate(-1)} title="Page précédente" aria-label="Retour">
          <ArrowLeft size={16} /> Retour
        </button>
      )}

      <button type="button" style={primary} onClick={() => navigate(home)} title={homeLabel} aria-label={homeLabel}>
        {inAdmin && isAdmin ? <LayoutDashboard size={16} /> : <Home size={16} />} {homeLabel}
      </button>

      {/* Depuis une page admin profonde, accès direct au site public */}
      {inAdmin && isAdmin && (
        <button type="button" style={btn} onClick={() => navigate('/dashboard')} title="Retour au site" aria-label="Retour au site">
          <Home size={16} /> Site
        </button>
      )}

      {/* Depuis le site, raccourci vers l'administration */}
      {!inAdmin && isAdmin && (
        <button type="button" style={btn} onClick={() => navigate('/admin')} title="Administration" aria-label="Administration">
          <Shield size={16} /> Admin
        </button>
      )}
    </nav>
  );
};

export default NavHome;
