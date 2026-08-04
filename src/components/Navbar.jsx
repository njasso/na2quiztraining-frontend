// src/components/Navbar.jsx — Navigation principale NA2 Quiz
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, BarChart2, Menu, X, LayoutDashboard,
  Trophy, Users, User, Bell, Zap, Shield, GraduationCap
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// ✅ Définir NAV_LINKS avant de l'utiliser
const NAV_LINKS = [
  { to: '/quizzes',    label: 'Tableau de bord', icon: LayoutDashboard },
  { to: '/quiz-choice', label: 'Passer un quiz',  icon: BookOpen },
  { to: '/challenges',  label: 'Défis',           icon: Zap },
  { to: '/leaderboard', label: 'Classement',      icon: Trophy },
  { to: '/statistics',  label: 'Statistiques',    icon: BarChart2 },
  { to: '/cours',       label: 'SIKÔLÔ',          icon: Users },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // ✅ NE PAS AFFICHER LA NAVBAR SUR LA HOMEPAGE
  if (location.pathname === '/' || location.pathname === '/home') {
    return null;
  }

  // Ne pas afficher la navbar dans le dashboard (il a sa propre sidebar)
  if (location.pathname === '/dashboard') return null;

  // Ne pas afficher la navbar dans l'admin (il a son propre layout)
  if (location.pathname.startsWith('/admin')) return null;

  // Vérification que user existe avant d'accéder à ses propriétés
  const userRole = user?.role;

  // ✅ CORRECTION : le rôle 'superadmin' était absent de ces trois fonctions.
  // Résultat : un superadmin ne voyait AUCUN bouton d'accès à l'administration
  // dans la barre de navigation (adminLink restait null pour ce rôle).
  const getAdminLink = () => {
    if (userRole === 'admin' || userRole === 'superadmin') return '/admin';
    if (userRole === 'formateur') return '/formateur/dashboard';
    return null;
  };

  const getAdminLabel = () => {
    if (userRole === 'superadmin') return 'Administration système';
    if (userRole === 'admin') return 'Administration';
    if (userRole === 'formateur') return 'Espace Formateur';
    return null;
  };

  const getAdminIcon = () => {
    if (userRole === 'admin' || userRole === 'superadmin') return <Shield size={18} />;
    if (userRole === 'formateur') return <GraduationCap size={18} />;
    return null;
  };

  const adminLink = getAdminLink();
  const adminLabel = getAdminLabel();
  const adminIcon = getAdminIcon();

  return (
    <nav className="app-navbar">
      {/* Logo */}
      <Link to="/quizzes" className="navbar-brand">
        <div className="nav-badge">N²</div>
        <span className="nav-name">NA2 Quiz</span>
      </Link>

      {/* Desktop links */}
      <div className="nav-links-desktop">
        {NAV_LINKS.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className={`nav-link ${location.pathname === to ? 'active' : ''}`}
          >
            <Icon size={15} />
            {label}
          </Link>
        ))}
      </div>

      {/* Actions - Profil, Notifications et Admin/Formateur */}
      <div className="nav-actions">
        {/* Lien Admin/Formateur (visible selon le rôle) */}
        {adminLink && (
          <button 
            className={`nav-icon-btn ${(userRole === 'admin' || userRole === 'superadmin') ? 'admin-btn' : 'formateur-btn'}`}
            onClick={() => navigate(adminLink)}
            title={adminLabel}
          >
            {adminIcon}
          </button>
        )}
        
        <button 
          className="nav-icon-btn"
          onClick={() => navigate('/notifications')}
          title="Notifications"
        >
          <Bell size={18} />
        </button>
        <button 
          className="nav-icon-btn"
          onClick={() => navigate('/profile')}
          title="Profil"
        >
          <User size={18} />
        </button>
        <button 
          className="nav-icon-btn"
          onClick={() => navigate('/settings')}
          title="Paramètres"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>
        <button className="nav-burger" onClick={() => setOpen(v => !v)}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="nav-mobile"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {NAV_LINKS.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="nav-mobile-link"
                onClick={() => setOpen(false)}
              >
                <Icon size={16} /> {label}
              </Link>
            ))}
            
            {/* Lien Admin/Formateur dans le menu mobile */}
            {adminLink && (
              <>
                <div className="nav-mobile-divider" />
                <Link
                  to={adminLink}
                  className={`nav-mobile-link ${(userRole === 'admin' || userRole === 'superadmin') ? 'admin-mobile-link' : 'formateur-mobile-link'}`}
                  onClick={() => setOpen(false)}
                >
                  {adminIcon} {adminLabel}
                </Link>
              </>
            )}
            
            <div className="nav-mobile-divider" />
            <Link
              to="/profile"
              className="nav-mobile-link"
              onClick={() => setOpen(false)}
            >
              <User size={16} /> Profil
            </Link>
            <Link
              to="/settings"
              className="nav-mobile-link"
              onClick={() => setOpen(false)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
              Paramètres
            </Link>
            <Link
              to="/notifications"
              className="nav-mobile-link"
              onClick={() => setOpen(false)}
            >
              <Bell size={16} /> Notifications
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .app-navbar {
          position: sticky; top: 0; z-index: 200;
          display: flex; align-items: center;
          gap: 20px; padding: 0 24px;
          height: 56px;
          background: #0f172ae0;
          backdrop-filter: blur(12px);
          border-bottom: 1px solid #1e293b;
        }
        .navbar-brand {
          display: flex; align-items: center; gap: 10px;
          text-decoration: none; color: white; font-weight: 800; font-size: 1rem;
        }
        .nav-badge {
          width: 32px; height: 32px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.8rem; font-weight: 900;
        }
        .nav-name { color: #f1f5f9; }
        .nav-links-desktop {
          display: flex; align-items: center; gap: 4px; flex: 1;
        }
        .nav-link {
          display: flex; align-items: center; gap: 6px;
          padding: 6px 14px; border-radius: 8px;
          font-size: 0.85rem; font-weight: 500;
          color: #64748b; text-decoration: none;
          transition: all 0.15s;
        }
        .nav-link:hover { color: #94a3b8; background: #1e293b; }
        .nav-link.active { color: #a5b4fc; background: #6366f115; }
        .nav-actions { 
          display: flex; 
          align-items: center; 
          gap: 8px; 
          margin-left: auto; 
        }
        .nav-icon-btn {
          background: #1e293b;
          border: 1px solid #334155;
          color: #64748b;
          border-radius: 8px;
          padding: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          transition: all 0.2s;
        }
        .nav-icon-btn:hover {
          color: #a5b4fc;
          border-color: #6366f1;
          background: #6366f115;
        }
        .admin-btn {
          background: rgba(99,102,241,0.1);
          border-color: #6366f1;
          color: #a5b4fc;
        }
        .admin-btn:hover {
          background: rgba(99,102,241,0.2);
          color: #c7d2fe;
        }
        .formateur-btn {
          background: rgba(16,185,129,0.1);
          border-color: #10b981;
          color: #10b981;
        }
        .formateur-btn:hover {
          background: rgba(16,185,129,0.2);
          color: #34d399;
        }
        .nav-burger {
          background: #1e293b; border: 1px solid #334155;
          color: #64748b; border-radius: 8px;
          padding: 6px; cursor: pointer;
          display: none; align-items: center;
        }
        .nav-mobile {
          position: absolute; top: 56px; left: 0; right: 0;
          background: #0f172a; border-bottom: 1px solid #1e293b;
          padding: 8px 16px;
        }
        .nav-mobile-link {
          display: flex; align-items: center; gap: 10px;
          padding: 12px; border-radius: 8px;
          color: #94a3b8; text-decoration: none; font-size: 0.9rem;
        }
        .nav-mobile-link:hover { background: #1e293b; }
        .admin-mobile-link {
          color: #a5b4fc;
          background: rgba(99,102,241,0.1);
        }
        .formateur-mobile-link {
          color: #10b981;
          background: rgba(16,185,129,0.1);
        }
        .nav-mobile-divider {
          height: 1px;
          background: #1e293b;
          margin: 8px 0;
        }
        @media (max-width: 768px) {
          .nav-links-desktop { display: none; }
          .nav-icon-btn:not(.nav-burger) { display: none; }
          .nav-burger { display: flex; }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;