// src/components/SplashScreen.jsx
// Affiché au premier rendu de l'app (0.8s min).
// Vérifie le token JWT en parallèle pour ne pas bloquer le démarrage.
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SplashScreen = ({ onDone }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // 800ms minimum — laisse l'animation se jouer
    const timer = setTimeout(() => {
      setVisible(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence onExitComplete={onDone}>
      {visible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'linear-gradient(135deg, #05071a 0%, #0a0f2e 60%, #05071a 100%)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 24,
          }}
        >
          {/* Glow de fond */}
          <div style={{
            position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
            width: '60vw', height: '40vh',
            background: 'radial-gradient(ellipse, rgba(99,102,241,0.18) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          {/* Logo animé */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1,   opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
            style={{
              width: 88, height: 88, borderRadius: 24,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 48px rgba(99,102,241,0.5)',
            }}
          >
            <motion.svg
              width="48" height="48" viewBox="0 0 48 48" fill="none"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              {/* Éclair stylisé */}
              <motion.path
                d="M28 6L14 26H24L20 42L34 22H24L28 6Z"
                stroke="white" strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round"
                fill="rgba(255,255,255,0.15)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              />
            </motion.svg>
          </motion.div>

          {/* Nom de l'app */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0  }}
            transition={{ delay: 0.35, duration: 0.4 }}
            style={{ textAlign: 'center' }}
          >
            <div style={{
              fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em',
              background: 'linear-gradient(135deg, #fff, #a5b4fc)',
              WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
            }}>
              NA2 Quiz
            </div>
            <div style={{ color: '#64748b', fontSize: '0.85rem', marginTop: 4 }}>
              Apprendre plus vite avec l'IA
            </div>
          </motion.div>

          {/* Barre de progression */}
          <motion.div
            style={{
              width: 120, height: 3, borderRadius: 99,
              background: 'rgba(99,102,241,0.15)',
              overflow: 'hidden',
            }}
          >
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 0.7, ease: 'easeInOut' }}
              style={{ height: '100%', background: '#6366f1', borderRadius: 99 }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;
