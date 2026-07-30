// src/components/HomeNavbar.jsx — Navbar spécifique pour la page d'accueil
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, X, LogIn, UserPlus, Sparkles, ChevronDown, Home, BookOpen, Zap, BarChart2 } from 'lucide-react';

const HomeNavbar = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);

  const navItems = [
    { label: 'Accueil', path: '/', icon: <Home size={16} /> },
    { 
      label: 'Fonctionnalités', 
      icon: <Zap size={16} />,
      dropdown: [
        { label: 'Quiz IA', path: '/generate-quiz', icon: '🤖' },
        { label: 'Création manuelle', path: '/manual', icon: '✍️' },
        { label: 'Base de données', path: '/database', icon: '📚' },
        { label: 'Statistiques', path: '/statistics', icon: '📊' },
      ]
    },
    { label: 'Quiz', path: '/quizzes', icon: <BookOpen size={16} /> },
    { label: 'Statistiques', path: '/statistics', icon: <BarChart2 size={16} /> },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        background: 'rgba(5,7,26,0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(99,102,241,0.2)',
        boxShadow: '0 4px 30px rgba(0,0,0,0.1)',
      }}
    >
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
          <motion.div
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.3 }}
            style={{
              width: 44,
              height: 44,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              color: 'white',
              boxShadow: '0 8px 16px rgba(99,102,241,0.3)',
            }}
          >
            N²
          </motion.div>
          <span style={{
            fontSize: '1.3rem',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #f8fafc, #a5b4fc)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
          }}>
            NA2 Quiz
          </span>
        </Link>

        {/* Navigation Desktop */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          {navItems.map((item, index) => (
            <div
              key={index}
              style={{ position: 'relative' }}
              onMouseEnter={() => item.dropdown && setActiveDropdown(index)}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              {item.dropdown ? (
                <button
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    fontSize: '0.95rem',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer',
                    padding: '8px 0',
                  }}
                >
                  <span style={{ color: '#a5b4fc' }}>{item.icon}</span>
                  {item.label}
                  <ChevronDown size={14} />
                </button>
              ) : (
                <Link
                  to={item.path}
                  style={{
                    color: '#94a3b8',
                    textDecoration: 'none',
                    fontSize: '0.95rem',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#a5b4fc'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                >
                  <span style={{ color: '#a5b4fc' }}>{item.icon}</span>
                  {item.label}
                </Link>
              )}

              {/* Dropdown */}
              {item.dropdown && activeDropdown === index && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    minWidth: 200,
                    background: '#0f172a',
                    border: '1px solid rgba(99,102,241,0.2)',
                    borderRadius: 12,
                    padding: 8,
                    marginTop: 8,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                  }}
                >
                  {item.dropdown.map((subItem, subIndex) => (
                    <Link
                      key={subIndex}
                      to={subItem.path}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '10px 12px',
                        color: '#94a3b8',
                        textDecoration: 'none',
                        fontSize: '0.9rem',
                        borderRadius: 8,
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(99,102,241,0.1)';
                        e.currentTarget.style.color = '#a5b4fc';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = '#94a3b8';
                      }}
                    >
                      <span style={{ fontSize: '1rem' }}>{subItem.icon}</span>
                      {subItem.label}
                    </Link>
                  ))}
                </motion.div>
              )}
            </div>
          ))}
        </div>

        {/* Boutons d'authentification */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/login')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(99,102,241,0.3)',
              borderRadius: 10,
              color: '#a5b4fc',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <LogIn size={16} />
            Connexion
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/register')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              border: 'none',
              borderRadius: 10,
              color: 'white',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 8px 16px rgba(99,102,241,0.3)',
            }}
          >
            <UserPlus size={16} />
            S'inscrire
          </motion.button>

          {/* Menu Burger pour mobile */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            style={{
              display: 'none',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: 8,
              padding: 8,
              color: '#94a3b8',
              cursor: 'pointer',
            }}
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Menu Mobile */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          style={{
            background: '#0f172a',
            borderTop: '1px solid rgba(99,102,241,0.2)',
            padding: '16px 24px',
          }}
        >
          {navItems.map((item, index) => (
            <Link
              key={index}
              to={item.path}
              onClick={() => setIsOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                color: '#94a3b8',
                textDecoration: 'none',
                fontSize: '0.95rem',
                borderBottom: index < navItems.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              }}
            >
              <span style={{ color: '#a5b4fc' }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </motion.div>
      )}
    </motion.nav>
  );
};

export default HomeNavbar;