// src/components/NavHome.jsx - Version ultra minimaliste en bas
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, ArrowLeft, LayoutDashboard, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const NavHome = ({ 
  hideBack = false, 
  homeTo, 
  label,
  className = '',
  style = {}
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth() || {};
  const [isVisible, setIsVisible] = useState(true);

  const isAdmin = ['admin', 'superadmin'].includes(user?.role);
  const inAdmin = location.pathname.startsWith('/admin');
  const home = homeTo || (inAdmin && isAdmin ? '/admin' : isAuthenticated ? '/dashboard' : '/');
  const homeLabel = label || (inAdmin && isAdmin ? 'Admin' : isAuthenticated ? 'Dashboard' : 'Accueil');
  const canGoBack = typeof window !== 'undefined' && window.history.length > 1;

  // Cacher sur les pages de connexion
  useEffect(() => {
    const hidePages = ['/', '/home', '/login', '/register'];
    if (hidePages.includes(location.pathname)) {
      setIsVisible(false);
    }
  }, [location.pathname]);

  if (!isVisible) return null;

  return (
    <nav 
      className={className} 
      style={{
        position: 'fixed',
        bottom: '12px',
        left: '12px',
        zIndex: 9999,
        display: 'flex',
        gap: '4px',
        alignItems: 'center',
        flexWrap: 'wrap',
        padding: '4px 6px',
        borderRadius: '10px',
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(99,102,241,0.1)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        maxWidth: 'calc(100vw - 24px)',
        ...style
      }} 
      aria-label="Navigation"
    >
      {!hideBack && canGoBack && (
        <button
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            padding: '3px 8px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.65rem',
            fontWeight: 500,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(99,102,241,0.1)',
            color: '#c7d2fe',
            transition: 'all 0.2s ease',
          }}
          onClick={() => navigate(-1)}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
        >
          <ArrowLeft size={12} />
        </button>
      )}

      <button
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '3px 10px',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '0.65rem',
          fontWeight: 600,
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          border: 'none',
          color: '#fff',
          boxShadow: '0 2px 8px rgba(99,102,241,0.25)',
          transition: 'all 0.2s ease',
        }}
        onClick={() => navigate(home)}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.02)';
          e.currentTarget.style.boxShadow = '0 3px 12px rgba(99,102,241,0.35)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(99,102,241,0.25)';
        }}
      >
        {inAdmin && isAdmin ? <LayoutDashboard size={12} /> : <Home size={12} />}
        <span>{homeLabel}</span>
      </button>

      {/* Raccourcis contextuels */}
      {inAdmin && isAdmin && (
        <button
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            padding: '3px 8px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.6rem',
            fontWeight: 500,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(99,102,241,0.1)',
            color: '#c7d2fe',
            transition: 'all 0.2s ease',
          }}
          onClick={() => navigate('/dashboard')}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
        >
          <Home size={12} />
        </button>
      )}

      {!inAdmin && isAdmin && (
        <button
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            padding: '3px 8px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.6rem',
            fontWeight: 500,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(99,102,241,0.1)',
            color: '#c7d2fe',
            transition: 'all 0.2s ease',
          }}
          onClick={() => navigate('/admin')}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
        >
          <Shield size={12} />
        </button>
      )}
    </nav>
  );
};

export default NavHome;