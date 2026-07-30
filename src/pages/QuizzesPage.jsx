// src/pages/QuizzesPage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import NavHome from '../components/NavHome';
import {
  FiHome,
  FiPlayCircle,
  FiEdit,
  FiBarChart,
  FiClock,
  FiAward,
  FiThumbsUp,
  FiPieChart,
  FiUsers,
  FiBell,
  FiUser,
  FiZap,
  FiLayout,
  FiBookOpen
} from 'react-icons/fi';

const QuizzesPage = () => {
  const navigate = useNavigate();

  const quizCategories = [
    {
      title: 'Activités Quiz',
      items: [
        {
          title: 'Passer un quiz',
          description: 'Répondez aux questions sur différentes matières.',
          path: '/quiz-choice',
          icon: <FiPlayCircle />,
          color: '#3B82F6'
        },
        {
          title: 'Composer une épreuve',
          description: 'Créez à partir du fichier word ou Pdf.',
          path: '/create-exam', // ✅ Changé de '/compose' à '/create-exam'
          icon: <FiEdit />,
          color: '#10B981'
        },
        {
          title: 'Défis et Récompenses',
          description: 'Relevez des défis hebdomadaires avec récompenses.',
          path: '/challenges',
          icon: <FiZap />,
          color: '#F59E0B'
        }
      ]
    },
    {
      title: 'Analyses & Résultats',
      items: [
        {
          title: 'Résultats détaillés',
          description: 'Analysez vos performances avec des graphiques.',
          path: '/results',
          icon: <FiBarChart />,
          color: '#8B5CF6'
        },
        {
          title: 'Historique des Quiz',
          description: 'Retracez votre parcours et progression.',
          path: '/history',
          icon: <FiClock />,
          color: '#EC4899'
        },
        {
          title: 'Statistiques',
          description: 'Vos stats par matière et difficulté.',
          path: '/statistics',
          icon: <FiPieChart />,
          color: '#6366F1'
        }
      ]
    },
    {
      title: 'Communauté & Social',
      items: [
        {
          title: 'Classement',
          description: 'Comparez vos résultats avec la communauté.',
          path: '/leaderboard',
          icon: <FiAward />,
          color: '#F59E0B'
        },
        {
          title: 'Quiz Communautaires',
          description: 'Découvrez les créations des utilisateurs.',
          path: '/community',
          icon: <FiUsers />,
          color: '#10B981'
        },
        {
          title: 'Suggestions',
          description: 'Quiz recommandés selon vos préférences.',
          path: '/suggestions',
          icon: <FiThumbsUp />,
          color: '#3B82F6'
        }
      ]
    },
    {
      title: 'Personnalisation',
      items: [
        {
          title: 'Profil Utilisateur',
          description: 'Gérez vos informations personnelles.',
          path: '/profile',
          icon: <FiUser />,
          color: '#EC4899'
        },
        {
          title: 'Notifications',
          description: 'Restez informé des nouveautés.',
          path: '/notifications',
          icon: <FiBell />,
          color: '#8B5CF6'
        },
        {
          title: 'SIKÔLÔ',
          description: 'Plateforme d\'apprentissage numérique',
          path: '/cours',
          icon: <FiBookOpen />,
          color: '#6366F1'
        }
      ]
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
        {/* Titre principal */}
        <header style={{ marginBottom: 40, textAlign: 'center' }}>
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 120 }}
          >
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 12px',
              background: 'rgba(99,102,241,0.1)',
              border: '1px solid rgba(99,102,241,0.3)',
              borderRadius: 20,
              marginBottom: 16,
            }}>
              <FiLayout size={14} color="#6366f1" />
              <span style={{ color: '#a5b4fc', fontSize: '0.7rem', fontWeight: 600 }}>
                TABLEAU DE BORD
              </span>
            </div>
            <h1 style={{
              fontSize: '2.5rem',
              fontWeight: 700,
              color: '#f8fafc',
              marginBottom: 8,
            }}>
              Tableau de bord des Quiz
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '1rem' }}>
              Accédez à toutes les fonctionnalités de la plateforme
            </p>
          </motion.div>
        </header>

        {/* Grille des catégories */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 24,
          marginBottom: 40,
        }}>
          {quizCategories.map((category, index) => (
            <motion.section
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              style={{
                background: 'rgba(15,23,42,0.7)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: 24,
                padding: 24,
              }}
            >
              <h2 style={{
                fontSize: '1.2rem',
                fontWeight: 600,
                color: '#f8fafc',
                marginBottom: 20,
                paddingBottom: 12,
                borderBottom: '1px solid rgba(99,102,241,0.2)',
              }}>
                {category.title}
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {category.items.map((item, idx) => (
                  <motion.div
                    key={idx}
                    whileHover={{ y: -2, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(item.path)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 16px',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(99,102,241,0.1)',
                      borderRadius: 12,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: `${item.color}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: item.color,
                    }}>
                      {item.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        color: '#f8fafc',
                        marginBottom: 2,
                      }}>
                        {item.title}
                      </h3>
                      <p style={{
                        fontSize: '0.75rem',
                        color: '#64748b',
                      }}>
                        {item.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          ))}
        </div>

        {/* Bouton Accueil flottant */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate('/')}
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            border: 'none',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(99,102,241,0.3)',
            zIndex: 100,
          }}
        >
          <FiHome size={24} />
        </motion.button>
      </main>
    </div>
  );
};

export default QuizzesPage;