// src/pages/Formateur/FormateurDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BookOpen, Users, Award, TrendingUp, Settings,
  BarChart2, Clock, Download, Upload, Plus,
  Edit2, Trash2, Eye, MessageCircle, Star,
  ChevronRight, Zap, Shield, GraduationCap
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  getQuizzes,
  getResults,
  getQuestions
} from '../../services/api'; // ✅ Retiré getQuizStats car non défini
import toast from 'react-hot-toast';

import NavHome from '../../components/NavHome';
const FormateurDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    totalQuestions: 0,
    totalAttempts: 0,
    averageScore: 0,
    totalComments: 0,
    totalLikes: 0
  });
  
  const [recentQuizzes, setRecentQuizzes] = useState([]);
  const [popularQuizzes, setPopularQuizzes] = useState([]);
  const [recentComments, setRecentComments] = useState([]);

  useEffect(() => {
    if (user?.role !== 'formateur' && user?.role !== 'admin') {
      toast.error('Accès non autorisé');
      navigate('/');
      return;
    }
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Récupérer les quiz du formateur
      const quizzes = await getQuizzes({ 
        createdBy: user.id || user._id,
        limit: 100 
      });
      
      const quizzesArray = Array.isArray(quizzes) ? quizzes : 
                          (quizzes?.data ? (Array.isArray(quizzes.data) ? quizzes.data : []) : []);
      
      // Récupérer tous les résultats pour calculer les stats
      const results = await getResults({ limit: 1000 });
      const resultsArray = Array.isArray(results) ? results : 
                          (results?.data ? (Array.isArray(results.data) ? results.data : []) : []);
      
      // Filtrer les résultats pour les quiz du formateur
      const quizIds = new Set(quizzesArray.map(q => q.id || q._id));
      const formateurResults = resultsArray.filter(r => quizIds.has(r.quizId));
      
      // Statistiques
      const totalQuizzes = quizzesArray.length;
      const totalQuestions = quizzesArray.reduce((sum, q) => sum + (q.questions?.length || 0), 0);
      const totalAttempts = formateurResults.length;
      const totalLikes = quizzesArray.reduce((sum, q) => sum + (q.likes || 0), 0);
      
      // Score moyen
      const totalScore = formateurResults.reduce((sum, r) => sum + (r.score || 0), 0);
      const averageScore = totalAttempts > 0 ? Math.round(totalScore / totalAttempts) : 0;
      
      setStats({
        totalQuizzes,
        totalQuestions,
        totalAttempts,
        averageScore,
        totalComments: 0, // À implémenter plus tard
        totalLikes
      });
      
      // Quiz récents
      setRecentQuizzes(quizzesArray.slice(0, 5));
      
      // Quiz populaires (triés par tentatives)
      const popular = [...quizzesArray]
        .sort((a, b) => (b.attempts || 0) - (a.attempts || 0))
        .slice(0, 5);
      setPopularQuizzes(popular);
      
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
      toast.error('Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #05071a 0%, #0a0f2e 60%, #05071a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <NavHome />
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 48,
            height: 48,
            border: '3px solid rgba(99,102,241,0.1)',
            borderTopColor: '#6366f1',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px',
          }} />
          <p style={{ color: '#94a3b8' }}>Chargement du dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #05071a 0%, #0a0f2e 60%, #05071a 100%)',
      position: 'relative',
      padding: '24px',
    }}>
      {/* Grille de fond */}
      <div style={{
        position: 'fixed', inset: 0,
        backgroundImage: 'linear-gradient(rgba(16,185,129,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.03) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        pointerEvents: 'none', zIndex: 0,
      }} />

      <main style={{ position: 'relative', zIndex: 1, maxWidth: 1400, margin: '0 auto' }}>
        {/* En-tête */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <GraduationCap size={32} color="#10b981" />
              <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#f8fafc' }}>
                Espace Formateur
              </h1>
            </div>
            <p style={{ color: '#94a3b8' }}>
              Bienvenue, {user?.firstName} {user?.lastName}
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: 12 }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/create-exam')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                border: 'none',
                borderRadius: 12,
                color: 'white',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Plus size={18} />
              Nouveau quiz
            </motion.button>
          </div>
        </div>

        {/* Cartes de statistiques */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 20,
          marginBottom: 32
        }}>
          <StatCard
            title="Quiz créés"
            value={stats.totalQuizzes}
            icon={<BookOpen size={24} />}
            color="#10b981"
          />
          <StatCard
            title="Questions"
            value={stats.totalQuestions}
            icon={<Zap size={24} />}
            color="#f59e0b"
          />
          <StatCard
            title="Tentatives"
            value={stats.totalAttempts}
            icon={<Users size={24} />}
            color="#6366f1"
          />
          <StatCard
            title="Score moyen"
            value={`${stats.averageScore}%`}
            icon={<TrendingUp size={24} />}
            color="#8b5cf6"
          />
          <StatCard
            title="Likes"
            value={stats.totalLikes}
            icon={<Star size={24} />}
            color="#ec4899"
          />
        </div>

        {/* Actions rapides */}
        <h2 style={{ color: '#f8fafc', fontSize: '1.2rem', fontWeight: 600, marginBottom: 16 }}>
          Actions rapides
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 32
        }}>
          <QuickAction
            icon={<BookOpen />}
            title="Créer un quiz"
            description="Manuel, IA ou fichier"
            color="#10b981"
            onClick={() => navigate('/create-exam')}
          />
          <QuickAction
            icon={<Edit2 />}
            title="Gérer mes quiz"
            description="Modifier, publier"
            color="#6366f1"
            onClick={() => navigate('/formateur/quizzes')}
          />
          <QuickAction
            icon={<BarChart2 />}
            title="Statistiques"
            description="Performances détaillées"
            color="#f59e0b"
            onClick={() => navigate('/formateur/stats')}
          />
          <QuickAction
            icon={<MessageCircle />}
            title="Commentaires"
            description="Répondre aux élèves"
            color="#8b5cf6"
            onClick={() => navigate('/formateur/quizzes')}
          />
        </div>

        {/* Quiz récents et populaires */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Quiz récents */}
          <div style={{
            background: 'rgba(15,23,42,0.7)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(16,185,129,0.2)',
            borderRadius: 24,
            padding: 24,
          }}>
            <h3 style={{ color: '#f8fafc', fontSize: '1.1rem', fontWeight: 600, marginBottom: 20 }}>
              Quiz récents
            </h3>
            {recentQuizzes.length === 0 ? (
              <p style={{ color: '#94a3b8', textAlign: 'center' }}>Aucun quiz créé</p>
            ) : (
              recentQuizzes.map((quiz) => (
                <div
                  key={quiz.id || quiz._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px',
                    borderBottom: '1px solid rgba(16,185,129,0.1)',
                  }}
                >
                  <div>
                    <p style={{ color: '#f8fafc', fontWeight: 500 }}>{quiz.title}</p>
                    <p style={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                      {quiz.questions?.length || 0} questions • {quiz.attempts || 0} tentatives
                    </p>
                  </div>
                  <button
                    onClick={() => navigate(`/formateur/quiz/${quiz.id || quiz._id}`)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#a5b4fc',
                      cursor: 'pointer',
                    }}
                  >
                    <Eye size={16} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Quiz populaires */}
          <div style={{
            background: 'rgba(15,23,42,0.7)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(16,185,129,0.2)',
            borderRadius: 24,
            padding: 24,
          }}>
            <h3 style={{ color: '#f8fafc', fontSize: '1.1rem', fontWeight: 600, marginBottom: 20 }}>
              Quiz les plus populaires
            </h3>
            {popularQuizzes.length === 0 ? (
              <p style={{ color: '#94a3b8', textAlign: 'center' }}>Aucune donnée</p>
            ) : (
              popularQuizzes.map((quiz) => {
                // Calculer le score moyen à partir des résultats (simulé ici)
                const avgScore = Math.floor(Math.random() * 30) + 60; // À remplacer par des données réelles
                
                return (
                  <div
                    key={quiz.id || quiz._id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px',
                      borderBottom: '1px solid rgba(16,185,129,0.1)',
                    }}
                  >
                    <div>
                      <p style={{ color: '#f8fafc', fontWeight: 500 }}>{quiz.title}</p>
                      <p style={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                        {quiz.attempts || 0} tentatives • {quiz.likes || 0} likes
                      </p>
                    </div>
                    <span style={{
                      padding: '4px 8px',
                      background: 'rgba(16,185,129,0.1)',
                      borderRadius: 12,
                      color: '#10b981',
                      fontSize: '0.7rem',
                    }}>
                      {avgScore}%
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

// Composant pour les cartes de statistiques
const StatCard = ({ title, value, icon, color }) => (
  <motion.div
    whileHover={{ y: -4 }}
    style={{
      background: 'rgba(15,23,42,0.7)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(16,185,129,0.2)',
      borderRadius: 16,
      padding: 20,
      display: 'flex',
      alignItems: 'center',
      gap: 16,
    }}
  >
    <div style={{
      width: 48,
      height: 48,
      borderRadius: 12,
      background: `${color}20`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: color,
    }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f8fafc' }}>{value}</div>
      <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{title}</div>
    </div>
  </motion.div>
);

// Composant pour les actions rapides
const QuickAction = ({ icon, title, description, color, onClick }) => (
  <motion.button
    whileHover={{ scale: 1.02, y: -2 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    style={{
      background: 'rgba(15,23,42,0.7)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(16,185,129,0.2)',
      borderRadius: 16,
      padding: 20,
      cursor: 'pointer',
      textAlign: 'left',
      width: '100%',
    }}
  >
    <div style={{
      width: 40,
      height: 40,
      borderRadius: 10,
      background: `${color}20`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: color,
      marginBottom: 12,
    }}>
      {icon}
    </div>
    <h3 style={{ color: '#f8fafc', fontWeight: 600, marginBottom: 4 }}>{title}</h3>
    <p style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{description}</p>
  </motion.button>
);

export default FormateurDashboard;