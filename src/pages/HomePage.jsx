// src/pages/HomePage.jsx - VERSION ULTIME CORRIGÉE
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  BookOpen, Zap, Users, Award, ChevronRight, Sparkles, Target, Brain,
  Clock, Star, Shield, Rocket, Layers, CheckCircle, Play,
  UserPlus, Crown, TrendingUp, Globe,
  Smartphone, Lock, Infinity, Download, ArrowRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getStats, getPublicQuizzes, getTopCreators } from '../services/api';
import toast from 'react-hot-toast';

import NavHome from '../components/NavHome';
const HomePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [loading, setLoading] = useState(true);
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalQuizzes: 0,
    totalResults: 0,
    averageScore: 0
  });
  const [popularQuizzes, setPopularQuizzes] = useState([]);
  const [topCreators, setTopCreators] = useState([]);

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        const statsData = await getStats();
        if (statsData) {
          setStats({
            totalUsers: statsData.totalUsers || 0,
            totalQuizzes: statsData.totalQuizzes || 0,
            totalResults: statsData.totalResults || 0,
            averageScore: statsData.averageScore || 0
          });
        }

        try {
          const quizzesData = await getPublicQuizzes({ limit: 3, sort: '-plays' });
          if (Array.isArray(quizzesData)) {
            setPopularQuizzes(quizzesData.slice(0, 3));
          } else if (quizzesData?.data) {
            setPopularQuizzes(quizzesData.data.slice(0, 3));
          }
        } catch (error) {
          console.debug('Quiz publics non disponibles');
        }

        try {
          const creatorsData = await getTopCreators(3);
          if (Array.isArray(creatorsData)) {
            setTopCreators(creatorsData.slice(0, 3));
          } else if (creatorsData?.data) {
            setTopCreators(creatorsData.data.slice(0, 3));
          }
        } catch (error) {
          console.debug('Top créateurs non disponibles');
        }

      } catch (error) {
        console.error('Erreur chargement données:', error);
        toast.error('Impossible de charger les données');
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  const handleStartClick = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
      toast.success(`Bonjour ${user?.firstName || user?.email || 'Utilisateur'} !`);
    } else {
      navigate('/register');
    }
  };

  const handleTryWithoutLogin = () => {
    navigate('/quizzes');
  };

  const handlePricingClick = () => {
    navigate('/subscription');
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(0) + 'K';
    return num?.toString() || '0';
  };

  const plans = [
    {
      id: 'free',
      name: 'Gratuit',
      icon: Zap,
      price: '0',
      color: '#64748b',
      features: ['5 quiz/jour', 'Stats basiques', 'IA limitée (3/jour)'],
      cta: 'Commencer',
      action: handleStartClick
    },
    {
      id: 'premium',
      name: 'Premium',
      icon: Crown,
      price: '2 500',
      color: '#6366f1',
      popular: true,
      features: ['Quiz illimités', 'IA illimitée', 'Certificats', 'Sans pub', 'Mode hors ligne'],
      cta: 'Choisir Premium',
      action: () => navigate('/subscription?plan=premium')
    },
    {
      id: 'pro',
      name: 'Pro',
      icon: Rocket,
      price: '5 000',
      color: '#10b981',
      features: ['Tout Premium', 'Groupes d\'étude', 'API Access', 'Support 24/7', 'Formation'],
      cta: 'Choisir Pro',
      action: () => navigate('/subscription?plan=pro')
    }
  ];

  const features = [
    {
      icon: Brain,
      title: 'IA DeepSeek',
      desc: 'Quiz générés intelligemment selon votre niveau',
      color: '#6366f1',
      details: ['Adaptatif', 'Correction instantanée', 'Explications détaillées']
    },
    {
      icon: Target,
      title: 'Suivi Progression',
      desc: 'Statistiques complètes en temps réel',
      color: '#10b981',
      details: ['Graphiques', 'Historique', 'Objectifs']
    },
    {
      icon: Users,
      title: 'Mode Collaboratif',
      desc: 'Défiez vos amis et comparez vos scores',
      color: '#8b5cf6',
      details: ['Classements', 'Défis', 'Partage']
    },
    {
      icon: Award,
      title: 'Certifications',
      desc: 'Validez officiellement vos compétences',
      color: '#f59e0b',
      details: ['Certificats PDF', 'Badges', 'Partage LinkedIn']
    },
    {
      icon: Globe,
      title: 'Multi-domaines',
      desc: 'Des quiz dans toutes les matières',
      color: '#ec4899',
      details: ['Sciences', 'Langues', 'Culture G', 'Tech']
    },
    {
      icon: Smartphone,
      title: '100% Mobile',
      desc: 'Étudiez où que vous soyez',
      color: '#06b6d4',
      details: ['Responsive', 'Mode hors ligne', 'Notifications']
    }
  ];

  const steps = [
    { icon: UserPlus, title: 'Inscrivez-vous', desc: 'Créez votre compte gratuitement', color: '#6366f1' },
    { icon: BookOpen, title: 'Choisissez', desc: 'Sélectionnez un quiz ou créez le vôtre', color: '#10b981' },
    { icon: Brain, title: 'Apprenez', desc: 'Répondez aux questions générées par IA', color: '#8b5cf6' },
    { icon: Award, title: 'Progressez', desc: 'Suivez votre évolution et obtenez des certificats', color: '#f59e0b' }
  ];

  const advantages = [
    { icon: Infinity, title: 'Quiz illimités', desc: 'Accédez à des milliers de quiz' },
    { icon: Download, title: 'Export PDF', desc: 'Téléchargez vos résultats et certificats' },
    { icon: Lock, title: '100% Sécurisé', desc: 'Vos données sont protégées' },
    { icon: TrendingUp, title: 'Progression garantie', desc: 'Méthode validée par des experts' }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #05071a 0%, #0a0f2e 60%, #05071a 100%)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <NavHome />
      {/* Grille de fond animée */}
      <motion.div
        animate={{ backgroundPosition: ['0px 0px', '40px 40px'] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        style={{
          position: 'fixed', inset: 0,
          backgroundImage: 'linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          pointerEvents: 'none', zIndex: 0,
        }}
      />

      {/* Glow effects */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.12, 0.2, 0.12] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: 'fixed', top: '-15%', left: '50%', transform: 'translateX(-50%)',
          width: '70vw', height: '50vh',
          background: 'radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 70%)',
          pointerEvents: 'none', zIndex: 0,
        }}
      />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>
        
        {/* ============================================ */}
        {/* HERO SECTION */}
        {/* ============================================ */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: 80, marginTop: 40 }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '8px 16px', background: 'rgba(99,102,241,0.1)',
              border: '1px solid rgba(99,102,241,0.3)', borderRadius: 40, marginBottom: 24,
            }}
          >
            <Sparkles size={16} color="#6366f1" />
            <span style={{ color: '#a5b4fc', fontSize: '0.9rem' }}>
              🚀 {loading ? '...' : `${formatNumber(stats.totalUsers)}+ utilisateurs`} nous font confiance
            </span>
          </motion.div>

          <h1 style={{
            fontSize: 'clamp(2.5rem, 8vw, 4.5rem)', fontWeight: 800, lineHeight: 1.1,
            marginBottom: 24, background: 'linear-gradient(135deg, #fff, #a5b4fc)',
            WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
          }}>
            Maîtrisez vos
            <br />
            connaissances avec NA2 Quiz
          </h1>

          <p style={{
            fontSize: '1.2rem', color: '#94a3b8', maxWidth: 600,
            margin: '0 auto 40px', lineHeight: 1.6,
          }}>
            La plateforme de quiz intelligente propulsée par l'IA DeepSeek.
            Apprenez plus vite, retenez plus longtemps.
          </p>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={handleStartClick}
              style={{
                padding: '16px 36px', borderRadius: 14,
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                border: 'none', color: 'white', fontSize: '1.1rem', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(99,102,241,0.3)',
              }}
            >
              {isAuthenticated ? 'Accéder au tableau de bord' : 'Commencer gratuitement'} 
              <ChevronRight size={20} />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={handleTryWithoutLogin}
              style={{
                padding: '16px 36px', borderRadius: 14,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(99,102,241,0.3)', color: 'white',
                fontSize: '1.1rem', fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              <Play size={20} />
              Essayer une démo
            </motion.button>
          </div>

          {/* Statistiques en temps réel */}
          <motion.div
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ delay: 0.4 }}
            style={{
              gap: 32, 
              justifyContent: 'center', 
              marginTop: 48,
              flexWrap: 'wrap', 
              padding: '20px 32px',
              background: 'rgba(15,23,42,0.5)', 
              backdropFilter: 'blur(12px)',
              borderRadius: 60, 
              border: '1px solid rgba(99,102,241,0.15)',
              display: 'inline-flex'
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#a5b4fc' }}>
                {loading ? '...' : formatNumber(stats.totalQuizzes)}
              </div>
              <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Quiz disponibles</div>
            </div>
            <div style={{ width: 1, background: 'rgba(99,102,241,0.2)' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#a5b4fc' }}>
                {loading ? '...' : formatNumber(stats.totalResults)}
              </div>
              <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Quiz complétés</div>
            </div>
            <div style={{ width: 1, background: 'rgba(99,102,241,0.2)' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#a5b4fc' }}>
                {loading ? '...' : `${Math.round(stats.averageScore)}%`}
              </div>
              <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Score moyen</div>
            </div>
          </motion.div>
        </motion.div>

        {/* ============================================ */}
        {/* AVANTAGES */}
        {/* ============================================ */}
        <motion.div
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20,
            marginBottom: 80,
          }}
        >
          {advantages.map((item, i) => (
            <div key={i} style={{
              background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(12px)',
              border: '1px solid rgba(99,102,241,0.15)', borderRadius: 20,
              padding: 24, textAlign: 'center',
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: 'rgba(99,102,241,0.1)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
              }}>
                <item.icon size={24} color="#6366f1" />
              </div>
              <h3 style={{ color: '#f8fafc', fontSize: '1rem', marginBottom: 4 }}>{item.title}</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{item.desc}</p>
            </div>
          ))}
        </motion.div>

        {/* ============================================ */}
        {/* COMMENT ÇA MARCHE */}
        {/* ============================================ */}
        <motion.div
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{ marginBottom: 80 }}
        >
          <h2 style={{
            fontSize: '2.2rem', fontWeight: 700, color: 'white',
            textAlign: 'center', marginBottom: 48,
          }}>
            Comment ça marche ?
          </h2>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20,
          }}>
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={index} whileHover={{ y: -5 }}
                  style={{
                    background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(99,102,241,0.15)', borderRadius: 20,
                    padding: 28, textAlign: 'center', position: 'relative',
                  }}
                >
                  <div style={{
                    position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                    width: 28, height: 28, borderRadius: '50%',
                    background: step.color, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.8rem',
                  }}>
                    {index + 1}
                  </div>
                  <div style={{
                    width: 56, height: 56, borderRadius: 16,
                    background: `${step.color}20`, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    margin: '16px auto 16px',
                  }}>
                    <Icon size={28} color={step.color} />
                  </div>
                  <h3 style={{ color: 'white', fontSize: '1.1rem', fontWeight: 600, marginBottom: 6 }}>
                    {step.title}
                  </h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{step.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* ============================================ */}
        {/* FONCTIONNALITÉS */}
        {/* ============================================ */}
        <motion.div
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          style={{ marginBottom: 80 }}
        >
          <h2 style={{
            fontSize: '2.2rem', fontWeight: 700, color: 'white',
            textAlign: 'center', marginBottom: 16,
          }}>
            Tout ce dont vous avez besoin
          </h2>
          <p style={{
            color: '#94a3b8', textAlign: 'center', marginBottom: 48,
            fontSize: '1.1rem',
          }}>
            Des outils puissants pour apprendre efficacement
          </p>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24,
          }}>
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index} whileHover={{ y: -5 }}
                  style={{
                    background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(99,102,241,0.15)', borderRadius: 20,
                    padding: 28,
                  }}
                >
                  <div style={{
                    width: 52, height: 52, borderRadius: 14,
                    background: `${feature.color}20`, display: 'flex',
                    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
                  }}>
                    <Icon size={26} color={feature.color} />
                  </div>
                  <h3 style={{ color: 'white', fontSize: '1.2rem', fontWeight: 600, marginBottom: 6 }}>
                    {feature.title}
                  </h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: 16 }}>
                    {feature.desc}
                  </p>
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {feature.details.map((detail, i) => (
                      <li key={i} style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        color: '#94a3b8', fontSize: '0.85rem', marginBottom: 6,
                      }}>
                        <CheckCircle size={12} color={feature.color} />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* ============================================ */}
        {/* FORFAITS */}
        {/* ============================================ */}
        <motion.div
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          style={{ marginBottom: 80 }}
        >
          <h2 style={{
            fontSize: '2.2rem', fontWeight: 700, color: 'white',
            textAlign: 'center', marginBottom: 16,
          }}>
            Choisissez votre forfait
          </h2>
          <p style={{
            color: '#94a3b8', textAlign: 'center', marginBottom: 48,
            fontSize: '1.1rem',
          }}>
            Débloquez toutes les fonctionnalités et boostez votre apprentissage
          </p>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24,
            maxWidth: 1000, margin: '0 auto',
          }}>
            {plans.map((plan) => {
              const Icon = plan.icon;
              return (
                <motion.div
                  key={plan.id} whileHover={{ y: -8 }}
                  style={{
                    background: plan.popular ? 'rgba(99,102,241,0.1)' : 'rgba(15,23,42,0.5)',
                    backdropFilter: 'blur(12px)',
                    border: `2px solid ${plan.popular ? plan.color : 'rgba(99,102,241,0.15)'}`,
                    borderRadius: 24, padding: 28, position: 'relative',
                  }}
                >
                  {plan.popular && (
                    <div style={{
                      position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                      background: '#f59e0b', color: 'white', padding: '4px 16px',
                      borderRadius: 20, fontSize: '0.75rem', fontWeight: 600,
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                      <Sparkles size={12} /> Populaire
                    </div>
                  )}

                  <div style={{
                    width: 52, height: 52, borderRadius: 14,
                    background: `${plan.color}20`, display: 'flex',
                    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
                  }}>
                    <Icon size={26} color={plan.color} />
                  </div>

                  <h3 style={{ color: '#f8fafc', fontSize: '1.3rem', fontWeight: 700, marginBottom: 8 }}>
                    {plan.name}
                  </h3>

                  <div style={{ marginBottom: 20 }}>
                    <span style={{ color: '#f8fafc', fontSize: '1.8rem', fontWeight: 800 }}>
                      {plan.price}
                    </span>
                    <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                      {plan.price !== '0' ? ' FCFA/mois' : ' €/mois'}
                    </span>
                  </div>

                  <ul style={{ listStyle: 'none', padding: 0, marginBottom: 24 }}>
                    {plan.features.map((feature, i) => (
                      <li key={i} style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        color: '#94a3b8', fontSize: '0.85rem', marginBottom: 8,
                      }}>
                        <CheckCircle size={12} color={plan.color} />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={plan.action}
                    style={{
                      width: '100%', padding: '12px', borderRadius: 12,
                      background: plan.popular ? `linear-gradient(135deg, ${plan.color}, ${plan.color}dd)` : 'rgba(255,255,255,0.05)',
                      border: plan.popular ? 'none' : '1px solid rgba(99,102,241,0.2)',
                      color: 'white', fontWeight: 600, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}
                  >
                    {plan.cta} <ArrowRight size={16} />
                  </button>
                </motion.div>
              );
            })}
          </div>

          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <button
              onClick={handlePricingClick}
              style={{
                background: 'none', border: 'none', color: '#a5b4fc',
                fontSize: '0.95rem', cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 4,
              }}
            >
              Comparer tous les forfaits
              <ChevronRight size={14} />
            </button>
          </div>
        </motion.div>

        {/* ============================================ */}
        {/* CTA FINAL */}
        {/* ============================================ */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7 }}
          style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1))',
            border: '1px solid rgba(99,102,241,0.3)', borderRadius: 32,
            padding: '56px 40px', textAlign: 'center',
          }}
        >
          <Rocket size={48} color="#6366f1" style={{ marginBottom: 24 }} />
          <h2 style={{ fontSize: '2.2rem', fontWeight: 700, color: 'white', marginBottom: 16 }}>
            Prêt à transformer votre apprentissage ?
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '1.1rem', marginBottom: 32, maxWidth: 500, margin: '0 auto 32px' }}>
            Rejoignez des milliers d'étudiants qui progressent chaque jour avec NA2 Quiz.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={handleStartClick}
              style={{
                padding: '16px 40px', borderRadius: 14,
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                border: 'none', color: 'white', fontSize: '1.1rem', fontWeight: 600,
                cursor: 'pointer', boxShadow: '0 8px 24px rgba(99,102,241,0.3)',
              }}
            >
              {isAuthenticated ? 'Accéder au tableau de bord' : 'Créer un compte gratuit'}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={handlePricingClick}
              style={{
                padding: '16px 40px', borderRadius: 14,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(99,102,241,0.3)', color: 'white',
                fontSize: '1.1rem', fontWeight: 600, cursor: 'pointer',
              }}
            >
              Voir les forfaits
            </motion.button>
          </div>
          <p style={{ color: '#475569', fontSize: '0.8rem', marginTop: 24 }}>
            Aucune carte de crédit requise. Annulez à tout moment.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default HomePage;