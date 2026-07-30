// src/pages/StartPage.jsx — Page de démarrage / Bienvenue
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Rocket, Sparkles, ArrowRight, BookOpen, Zap, 
  BarChart3, Users, Award, CheckCircle 
} from 'lucide-react';

const StartPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Quiz intelligents",
      description: "Générés par IA adaptés à votre niveau",
      color: "#6366f1"
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Statistiques détaillées",
      description: "Suivez votre progression en temps réel",
      color: "#10b981"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Mode collaboratif",
      description: "Étudiez en groupe et comparez vos résultats",
      color: "#8b5cf6"
    },
    {
      icon: <Award className="w-6 h-6" />,
      title: "Certifications",
      description: "Obtenez des badges et certificats",
      color: "#f59e0b"
    }
  ];

  const steps = [
    "Choisissez votre domaine",
    "Sélectionnez votre niveau",
    "Répondez aux questions",
    "Analysez vos résultats"
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #05071a 0%, #0a0f2e 60%, #05071a 100%)',
      position: 'relative',
      overflow: 'hidden',
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

      <main style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>
        
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: 80, marginTop: 60 }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              background: 'rgba(99,102,241,0.1)',
              border: '1px solid rgba(99,102,241,0.3)',
              borderRadius: 40,
              marginBottom: 24,
            }}
          >
            <Sparkles size={16} color="#6366f1" />
            <span style={{ color: '#a5b4fc', fontSize: '0.9rem' }}>Prêt à commencer votre apprentissage ?</span>
          </motion.div>

          <h1 style={{
            fontSize: 'clamp(2.5rem, 8vw, 4rem)',
            fontWeight: 800,
            lineHeight: 1.1,
            marginBottom: 24,
            background: 'linear-gradient(135deg, #fff, #a5b4fc)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
          }}>
            Bienvenue sur
            <br />
            <span style={{ color: '#6366f1' }}>NA2 Quiz</span>
          </h1>

          <p style={{
            fontSize: '1.2rem',
            color: '#94a3b8',
            maxWidth: 600,
            margin: '0 auto 40px',
            lineHeight: 1.6,
          }}>
            La plateforme d'apprentissage intelligente qui vous aide à maîtriser 
            vos connaissances grâce à des quiz personnalisés et des analyses détaillées.
          </p>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/quizzes')}
              style={{
                padding: '16px 32px',
                borderRadius: 12,
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                border: 'none',
                color: 'white',
                fontSize: '1.1rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
                boxShadow: '0 8px 20px rgba(99,102,241,0.3)',
              }}
            >
              Commencer maintenant
              <Rocket size={18} />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/onboarding')}
              style={{
                padding: '16px 32px',
                borderRadius: 12,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(99,102,241,0.3)',
                color: 'white',
                fontSize: '1.1rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              En savoir plus
            </motion.button>
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 24,
            marginBottom: 60,
          }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              whileHover={{ y: -5 }}
              style={{
                background: 'rgba(15,23,42,0.7)',
                backdropFilter: 'blur(12px)',
                border: `1px solid ${feature.color}20`,
                borderRadius: 20,
                padding: 32,
                textAlign: 'center',
              }}
            >
              <div style={{
                width: 60,
                height: 60,
                borderRadius: 16,
                background: `${feature.color}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                color: feature.color,
              }}>
                {feature.icon}
              </div>
              <h3 style={{ color: 'white', fontSize: '1.2rem', fontWeight: 600, marginBottom: 8 }}>
                {feature.title}
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{
            background: 'rgba(15,23,42,0.5)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: 32,
            padding: 48,
            marginBottom: 60,
          }}
        >
          <h2 style={{ 
            fontSize: '2rem', 
            fontWeight: 700, 
            color: '#f8fafc', 
            textAlign: 'center',
            marginBottom: 40 
          }}>
            Comment ça marche ?
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 24,
          }}>
            {steps.map((step, index) => (
              <div key={index} style={{ textAlign: 'center' }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: '#6366f1',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                  fontWeight: 600,
                  margin: '0 auto 16px',
                }}>
                  {index + 1}
                </div>
                <p style={{ color: '#f8fafc', fontSize: '1rem' }}>{step}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1))',
            border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: 32,
            padding: '60px 40px',
            textAlign: 'center',
          }}
        >
          <h2 style={{ fontSize: '2rem', fontWeight: 700, color: 'white', marginBottom: 16 }}>
            Prêt à relever le défi ?
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '1.1rem', marginBottom: 32, maxWidth: 600, margin: '0 auto 32px' }}>
            Rejoignez des milliers d'étudiants qui améliorent leurs connaissances chaque jour.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/register')}
              style={{
                padding: '16px 48px',
                borderRadius: 12,
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                border: 'none',
                color: 'white',
                fontSize: '1.1rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 8px 20px rgba(99,102,241,0.3)',
              }}
            >
              Créer un compte gratuit
              <ArrowRight size={18} style={{ marginLeft: 8, display: 'inline' }} />
            </motion.button>
          </div>
        </motion.div>

        {/* Trust indicators */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 48,
          marginTop: 40,
          flexWrap: 'wrap',
        }}>
          {['10K+ étudiants', '500+ quiz', '98% satisfaits', '24/7 support'].map((text, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle size={16} color="#10b981" />
              <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{text}</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default StartPage;