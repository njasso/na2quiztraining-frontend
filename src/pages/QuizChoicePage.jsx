// src/pages/QuizChoicePage.jsx — Page de choix entre épreuves et quiz
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import NavHome from '../components/NavHome';
import {
  BookOpen, FileText, ArrowLeft, ChevronRight,
  Sparkles, Clock, Award, Users
} from 'lucide-react';

const QuizChoicePage = () => {
  const navigate = useNavigate();

  const options = [
    {
      id: 'epreuves',
      title: 'Composer une épreuve',
      description: 'Accédez aux épreuves existantes ou composez à partir de fichiers',
      longDescription: 'Choisissez parmi les épreuves disponibles dans la bibliothèque ou importez vos propres documents',
      icon: <FileText size={32} />,
      color: '#6366f1',
      gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      path: '/exams',
      stats: '24 épreuves disponibles',
      features: ['Épreuves officielles', 'Création par fichier', 'Correction automatique']
    },
    {
      id: 'quiz',
      title: 'Commencer un quiz',
      description: 'Créez un quiz personnalisé selon vos préférences',
      longDescription: 'Générez un quiz adapté à votre niveau et à vos centres d\'intérêt',
      icon: <BookOpen size={32} />,
      color: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981, #059669)',
      path: '/start',
      stats: '15+ matières disponibles',
      features: ['Questions adaptatives', 'Timer personnalisable', 'Statistiques détaillées']
    }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #05071a 0%, #0a0f2e 60%, #05071a 100%)',
      position: 'relative',
      padding: '24px',
    }}>
      <NavHome />
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

      <main style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto' }}>
        {/* En-tête */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40 }}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/quizzes')}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: 12,
              padding: 12,
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
            }}
          >
            <ArrowLeft size={20} />
          </motion.button>

          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 12px',
              background: 'rgba(99,102,241,0.1)',
              border: '1px solid rgba(99,102,241,0.3)',
              borderRadius: 20,
              marginBottom: 8,
            }}>
              <Sparkles size={14} color="#6366f1" />
              <span style={{ color: '#a5b4fc', fontSize: '0.7rem', fontWeight: 600 }}>
                COMMENCER
              </span>
            </div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 700, color: '#f8fafc', marginBottom: 8 }}>
              Que souhaitez-vous faire ?
            </h1>
            <p style={{ fontSize: '1.1rem', color: '#94a3b8' }}>
              Choisissez entre composer une épreuve officielle ou créer un quiz personnalisé
            </p>
          </div>
        </div>

        {/* Options principales */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
          gap: 24,
          marginBottom: 40,
        }}>
          {options.map((option) => (
            <motion.div
              key={option.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: option.id === 'epreuves' ? 0.1 : 0.2 }}
              whileHover={{ y: -8 }}
              onClick={() => navigate(option.path)}
              style={{
                background: 'rgba(15,23,42,0.7)',
                backdropFilter: 'blur(12px)',
                border: `1px solid ${option.color}30`,
                borderRadius: 32,
                padding: 32,
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Accent line */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 4,
                background: option.gradient,
              }} />

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24 }}>
                {/* Icon */}
                <div style={{
                  width: 80,
                  height: 80,
                  borderRadius: 24,
                  background: `${option.color}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: option.color,
                  flexShrink: 0,
                }}>
                  {option.icon}
                </div>

                <div style={{ flex: 1 }}>
                  <h2 style={{
                    fontSize: '1.8rem',
                    fontWeight: 700,
                    color: '#f8fafc',
                    marginBottom: 8,
                  }}>
                    {option.title}
                  </h2>
                  
                  <p style={{
                    color: '#94a3b8',
                    fontSize: '1rem',
                    lineHeight: 1.6,
                    marginBottom: 16,
                  }}>
                    {option.longDescription}
                  </p>

                  {/* Stats */}
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 12px',
                    background: `${option.color}15`,
                    borderRadius: 20,
                    marginBottom: 16,
                  }}>
                    <Award size={14} color={option.color} />
                    <span style={{ color: option.color, fontSize: '0.8rem', fontWeight: 500 }}>
                      {option.stats}
                    </span>
                  </div>

                  {/* Features */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {option.features.map((feature, index) => (
                      <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: option.color,
                        }} />
                        <span style={{ color: '#a5b4fc', fontSize: '0.9rem' }}>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                marginTop: 24,
                gap: 8,
              }}>
                <span style={{
                  color: option.color,
                  fontSize: '1rem',
                  fontWeight: 600,
                }}>
                  {option.id === 'epreuves' ? 'Voir les épreuves' : 'Configurer mon quiz'}
                </span>
                <ChevronRight size={20} color={option.color} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Section d'aide */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            padding: 24,
            background: 'rgba(15,23,42,0.5)',
            border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            flexWrap: 'wrap',
          }}
        >
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: 'rgba(99,102,241,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Users size={24} color="#6366f1" />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ color: '#f8fafc', fontSize: '1rem', fontWeight: 600, marginBottom: 4 }}>
              Quelle est la différence ?
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
              <strong>Épreuves :</strong> Examens officiels, composition à partir de fichiers, correction automatique.<br />
              <strong>Quiz :</strong> Questions adaptatives, personnalisation complète, statistiques détaillées.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => navigate('/exams')}
              style={{
                padding: '8px 16px',
                background: 'rgba(99,102,241,0.1)',
                border: '1px solid rgba(99,102,241,0.3)',
                borderRadius: 8,
                color: '#a5b4fc',
                cursor: 'pointer',
              }}
            >
              Voir les épreuves
            </button>
            <button
              onClick={() => navigate('/start')}
              style={{
                padding: '8px 16px',
                background: 'rgba(16,185,129,0.1)',
                border: '1px solid #10b981',
                borderRadius: 8,
                color: '#10b981',
                cursor: 'pointer',
              }}
            >
              Créer un quiz
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default QuizChoicePage;