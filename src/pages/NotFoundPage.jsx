// src/pages/NotFoundPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Search, AlertTriangle } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #05071a 0%, #0a0f2e 60%, #05071a 100%)',
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      {/* Grille de fond */}
      <div style={{
        position: 'fixed', inset: 0,
        backgroundImage: 'linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* Glow effect */}
      <div style={{
        position: 'fixed', top: '-15%', left: '50%', transform: 'translateX(-50%)',
        width: '70vw', height: '50vh',
        background: 'radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 100 }}
        style={{
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
          maxWidth: 600,
          padding: 48,
          background: 'rgba(15,23,42,0.7)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: 32,
        }}
      >
        <motion.div
          animate={{
            rotate: [0, 10, -10, 10, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: 'rgba(239,68,68,0.1)',
            border: '2px solid #ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
          }}
        >
          <AlertTriangle size={60} color="#ef4444" />
        </motion.div>

        <h1 style={{
          fontSize: '6rem',
          fontWeight: 800,
          background: 'linear-gradient(135deg, #ef4444, #f59e0b)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
          lineHeight: 1,
          marginBottom: 16,
        }}>
          404
        </h1>

        <h2 style={{
          fontSize: '2rem',
          fontWeight: 700,
          color: '#f8fafc',
          marginBottom: 16,
        }}>
          Page introuvable
        </h2>

        <p style={{
          fontSize: '1rem',
          color: '#94a3b8',
          lineHeight: 1.6,
          marginBottom: 32,
          maxWidth: 400,
          margin: '0 auto 32px',
        }}>
          Oups ! La page que vous recherchez n'existe pas ou a été déplacée.
          Vérifiez l'URL ou retournez à l'accueil.
        </p>

        <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '14px 28px',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                border: 'none',
                borderRadius: 12,
                color: 'white',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 8px 20px rgba(99,102,241,0.3)',
              }}
            >
              <Home size={18} />
              Accueil
            </motion.button>
          </Link>

          <Link to="/quizzes" style={{ textDecoration: 'none' }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '14px 28px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(99,102,241,0.3)',
                borderRadius: 12,
                color: '#a5b4fc',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Search size={18} />
              Explorer les quiz
            </motion.button>
          </Link>
        </div>

        {/* Suggestions */}
        <div style={{
          marginTop: 40,
          padding: 20,
          background: 'rgba(255,255,255,0.02)',
          borderRadius: 16,
        }}>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: 12 }}>
            Pages populaires :
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { path: '/quizzes', label: 'Quiz' },
              { path: '/generate', label: 'Générer' },
              { path: '/statistics', label: 'Statistiques' },
              { path: '/dashboard', label: 'Dashboard' },
            ].map((page) => (
              <Link
                key={page.path}
                to={page.path}
                style={{
                  padding: '6px 12px',
                  background: 'rgba(99,102,241,0.1)',
                  borderRadius: 20,
                  color: '#a5b4fc',
                  fontSize: '0.8rem',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(99,102,241,0.2)'}
                onMouseLeave={(e) => e.target.style.background = 'rgba(99,102,241,0.1)'}
              >
                {page.label}
              </Link>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFoundPage;