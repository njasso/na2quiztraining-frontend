// src/pages/OnboardingPage.jsx
// Affiché une seule fois au premier lancement.
// Stocke na2_onboarded dans localStorage.
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Target, Award, ChevronRight, X } from 'lucide-react';

const SLIDES = [
  {
    icon: Brain,
    color: '#6366f1',
    glow: 'rgba(99,102,241,0.25)',
    title: 'IA DeepSeek à votre service',
    desc: 'Générez des quiz personnalisés en quelques secondes. L\'IA s\'adapte à votre niveau et corrige chaque réponse avec des explications détaillées.',
    visual: (
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 8 }}>
        {['Mathématiques', 'Français', 'Sciences', 'Histoire'].map((s, i) => (
          <motion.div
            key={s}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i }}
            style={{
              padding: '6px 12px', borderRadius: 99,
              background: `rgba(99,102,241,${0.08 + i * 0.04})`,
              border: '1px solid rgba(99,102,241,0.2)',
              color: '#a5b4fc', fontSize: '0.75rem',
            }}
          >
            {s}
          </motion.div>
        ))}
      </div>
    ),
  },
  {
    icon: Target,
    color: '#10b981',
    glow: 'rgba(16,185,129,0.25)',
    title: 'Suivez votre progression',
    desc: 'Tableau de bord complet avec graphiques hebdomadaires, score moyen, domaines à améliorer et streak quotidien pour rester motivé.',
    visual: (
      <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', justifyContent: 'center', height: 60 }}>
        {[40, 65, 50, 80, 60, 90, 75].map((h, i) => (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            animate={{ height: h * 0.6 }}
            transition={{ delay: 0.08 * i, duration: 0.4, ease: 'easeOut' }}
            style={{
              width: 18, borderRadius: '4px 4px 0 0',
              background: `rgba(16,185,129,${0.3 + i * 0.1})`,
            }}
          />
        ))}
      </div>
    ),
  },
  {
    icon: Award,
    color: '#f59e0b',
    glow: 'rgba(245,158,11,0.25)',
    title: 'Obtenez vos certifications',
    desc: 'Validez vos compétences avec des certificats PDF partageables. Défiez vos amis, grimpez au classement et débloquez des badges exclusifs.',
    visual: (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1,   opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring' }}
        style={{
          width: 72, height: 72, margin: '0 auto',
          borderRadius: '50%',
          background: 'rgba(245,158,11,0.12)',
          border: '2px solid rgba(245,158,11,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Award size={36} color="#f59e0b" />
      </motion.div>
    ),
  },
];

const OnboardingPage = () => {
  const navigate  = useNavigate();
  const [current, setCurrent] = useState(0);

  const finish = () => {
    localStorage.setItem('na2_onboarded', '1');
    navigate('/login');
  };

  const next = () => {
    if (current < SLIDES.length - 1) setCurrent(c => c + 1);
    else finish();
  };

  const slide = SLIDES[current];
  const Icon  = slide.icon;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #05071a 0%, #0a0f2e 60%, #05071a 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: 24, position: 'relative',
    }}>
      {/* Bouton Passer */}
      <button
        onClick={finish}
        style={{
          position: 'absolute', top: 24, right: 24,
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 99, padding: '8px 14px',
          color: '#64748b', fontSize: '0.85rem', cursor: 'pointer',
        }}
      >
        Passer <X size={14} />
      </button>

      {/* Slide */}
      <div style={{ width: '100%', maxWidth: 400 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0  }}
            exit={{   opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
          >
            {/* Icône */}
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.1 }}
                style={{
                  width: 96, height: 96, borderRadius: 28, margin: '0 auto 24px',
                  background: `${slide.color}20`,
                  border: `2px solid ${slide.color}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 0 40px ${slide.glow}`,
                }}
              >
                <Icon size={44} color={slide.color} />
              </motion.div>

              {/* Visual dynamique */}
              <div style={{ marginBottom: 24, minHeight: 72, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {slide.visual}
              </div>

              <h1 style={{
                fontSize: '1.7rem', fontWeight: 800, color: '#f8fafc',
                marginBottom: 16, lineHeight: 1.2,
              }}>
                {slide.title}
              </h1>
              <p style={{
                color: '#94a3b8', fontSize: '1rem', lineHeight: 1.7,
                marginBottom: 40,
              }}>
                {slide.desc}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Indicateurs */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 32 }}>
          {SLIDES.map((_, i) => (
            <motion.button
              key={i}
              onClick={() => setCurrent(i)}
              animate={{ width: i === current ? 24 : 8 }}
              style={{
                height: 8, borderRadius: 99, border: 'none', cursor: 'pointer',
                background: i === current ? slide.color : 'rgba(255,255,255,0.15)',
                padding: 0,
              }}
            />
          ))}
        </div>

        {/* Bouton CTA */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={next}
          style={{
            width: '100%', padding: '16px',
            background: `linear-gradient(135deg, ${slide.color}, ${slide.color}cc)`,
            border: 'none', borderRadius: 16, color: 'white',
            fontSize: '1.05rem', fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: `0 8px 24px ${slide.glow}`,
          }}
        >
          {current < SLIDES.length - 1 ? (
            <>Suivant <ChevronRight size={20} /></>
          ) : (
            <>Commencer gratuitement <ChevronRight size={20} /></>
          )}
        </motion.button>
      </div>
    </div>
  );
};

export default OnboardingPage;
