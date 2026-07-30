// src/components/QuizFeedback.jsx
// Overlay de feedback immédiat après chaque réponse.
// Usage dans QuizPage :
//   import QuizFeedback from '../components/QuizFeedback';
//   <QuizFeedback
//     isOpen={showFeedback}
//     isCorrect={wasCorrect}
//     correctAnswer="La bonne réponse ici"
//     explanation="Explication générée par l'IA..."
//     onNext={() => { setShowFeedback(false); goToNextQuestion(); }}
//   />
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, ChevronRight, Lightbulb } from 'lucide-react';

const QuizFeedback = ({
  isOpen,
  isCorrect,
  correctAnswer,
  explanation,
  onNext,
  nextLabel = 'Question suivante',
  isLast = false,
}) => {
  // Raccourci clavier : Espace ou Entrée → question suivante
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onNext(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onNext]);

  const accent = isCorrect ? '#10b981' : '#ef4444';
  const bg     = isCorrect ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)';
  const border = isCorrect ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay sombre */}
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.6)',
              zIndex: 100,
              backdropFilter: 'blur(4px)',
            }}
          />

          {/* Panel bas */}
          <motion.div
            key="panel"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0,
              zIndex: 101,
              background: '#0a0f2e',
              border: `1px solid ${border}`,
              borderBottom: 'none',
              borderRadius: '24px 24px 0 0',
              padding: '28px 24px 40px',
              maxWidth: 640, margin: '0 auto',
            }}
          >
            {/* Poignée */}
            <div style={{
              width: 40, height: 4, borderRadius: 99,
              background: 'rgba(255,255,255,0.15)',
              margin: '0 auto 24px',
            }} />

            {/* Statut */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.1 }}
              >
                {isCorrect
                  ? <CheckCircle size={32} color="#10b981" />
                  : <XCircle size={32} color="#ef4444" />}
              </motion.div>
              <div>
                <p style={{
                  fontSize: '1.2rem', fontWeight: 700, margin: 0,
                  color: accent,
                }}>
                  {isCorrect ? 'Bonne réponse !' : 'Pas tout à fait…'}
                </p>
                {!isCorrect && correctAnswer && (
                  <p style={{ fontSize: '0.9rem', color: '#94a3b8', margin: '4px 0 0' }}>
                    Réponse correcte : <strong style={{ color: '#f8fafc' }}>{correctAnswer}</strong>
                  </p>
                )}
              </div>
            </div>

            {/* Fond coloré de statut */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.4 }}
              style={{
                height: 4, borderRadius: 99, marginBottom: 20,
                background: accent, transformOrigin: 'left',
              }}
            />

            {/* Explication IA */}
            {explanation && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={{
                  background: bg,
                  border: `1px solid ${border}`,
                  borderRadius: 16, padding: '16px',
                  marginBottom: 24,
                  display: 'flex', gap: 12,
                }}
              >
                <Lightbulb size={18} color={accent} style={{ flexShrink: 0, marginTop: 2 }} />
                <p style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: 1.7, margin: 0 }}>
                  {explanation}
                </p>
              </motion.div>
            )}

            {/* Bouton suivant */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={onNext}
              style={{
                width: '100%', padding: '15px',
                background: isCorrect
                  ? 'linear-gradient(135deg, #10b981, #059669)'
                  : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                border: 'none', borderRadius: 14, color: 'white',
                fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: isCorrect
                  ? '0 8px 20px rgba(16,185,129,0.3)'
                  : '0 8px 20px rgba(99,102,241,0.3)',
              }}
            >
              {isLast ? 'Voir mes résultats' : nextLabel}
              <ChevronRight size={20} />
            </motion.button>

            <p style={{ textAlign: 'center', color: '#475569', fontSize: '0.75rem', marginTop: 12 }}>
              Appuyez sur Espace ou Entrée
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default QuizFeedback;
