// src/pages/ChallengesPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Trophy, Award, Star, Target, Zap, Clock, 
  ChevronRight, Medal, Gift, Flame, ArrowLeft, Loader
} from 'lucide-react';
import { getResults, getStats } from '../services/api';
import toast from 'react-hot-toast';

import NavHome from '../components/NavHome';
const ChallengesPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState({
    points: 0,
    challengesCompleted: 0,
    badges: 0,
    streak: 0
  });
  const [weeklyChallenges, setWeeklyChallenges] = useState([]);
  const [achievements, setAchievements] = useState([]);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      // Récupérer les résultats de l'utilisateur
      const results = await getResults();
      
      // Récupérer les statistiques
      const stats = await getStats();
      
      // ✅ S'assurer que results est un tableau
      const resultsArray = Array.isArray(results) ? results : [];
      const statsData = stats || {};
      
      // Calculer les points (basés sur les scores)
      const points = resultsArray.reduce((total, r) => total + (r.score || 0), 0);
      
      // Calculer les défis complétés (scores >= 80)
      const challengesCompleted = resultsArray.filter(r => r.score >= 80).length;
      
      // Calculer la série de jours consécutifs
      const streak = calculateStreak(resultsArray);
      
      setUserStats({
        points,
        challengesCompleted,
        badges: statsData?.badges?.length || 0,
        streak
      });

      // Générer les défis basés sur les données réelles
      setWeeklyChallenges(generateChallenges(resultsArray, statsData));
      
      // Générer les accomplissements
      setAchievements(generateAchievements(resultsArray, statsData, streak));

    } catch (error) {
      console.error('Erreur chargement défis:', error);
      toast.error('Impossible de charger les défis');
    } finally {
      setLoading(false);
    }
  };

  const calculateStreak = (results) => {
    if (!results || !Array.isArray(results) || results.length === 0) return 0;
    
    // Extraire les dates uniques
    const dates = results
      .map(r => new Date(r.date || r.createdAt || Date.now()).toDateString())
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort((a, b) => new Date(a) - new Date(b));
    
    if (dates.length === 0) return 0;
    
    let streak = 1;
    let maxStreak = 1;
    
    for (let i = 1; i < dates.length; i++) {
      const prevDate = new Date(dates[i-1]);
      const currDate = new Date(dates[i]);
      const diffDays = Math.floor((currDate - prevDate) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        streak++;
        maxStreak = Math.max(maxStreak, streak);
      } else if (diffDays > 1) {
        streak = 1;
      }
    }
    
    // Vérifier si la série est toujours active
    const lastDate = new Date(dates[dates.length - 1]);
    const today = new Date();
    const daysSinceLast = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
    
    return daysSinceLast <= 1 ? maxStreak : 0;
  };

  const generateChallenges = (results, stats) => {
    const quizzesTaken = results?.length || 0;
    const perfectScores = results?.filter(r => r.score === 100).length || 0;
    const domains = new Set(results?.map(r => r.domain)).size || 0;
    
    // Calculer les quiz rapides (temps < 5 min)
    const quickQuizzes = results?.filter(r => (r.timeSpent || 0) < 5).length || 0;

    return [
      {
        id: 1,
        title: "Série de 5 quiz",
        description: "Complétez 5 quiz cette semaine",
        reward: "500 points",
        progress: Math.min(quizzesTaken, 5),
        total: 5,
        icon: <Zap className="w-6 h-6" />,
        color: "#6366f1",
        expires: "2 jours restants"
      },
      {
        id: 2,
        title: "Score parfait",
        description: "Obtenez 100% à un quiz",
        reward: "Badge Expert",
        progress: Math.min(perfectScores, 1),
        total: 1,
        icon: <Trophy className="w-6 h-6" />,
        color: "#f59e0b",
        expires: "5 jours restants"
      },
      {
        id: 3,
        title: "Rapide et précis",
        description: "Terminez un quiz en moins de 5 min",
        reward: "200 points",
        progress: Math.min(quickQuizzes, 1),
        total: 1,
        icon: <Clock className="w-6 h-6" />,
        color: "#10b981",
        expires: "3 jours restants"
      },
      {
        id: 4,
        title: "Multi-disciplines",
        description: "Quiz dans 3 matières différentes",
        reward: "Badge Polyvalent",
        progress: Math.min(domains, 3),
        total: 3,
        icon: <Star className="w-6 h-6" />,
        color: "#8b5cf6",
        expires: "4 jours restants"
      }
    ];
  };

  const generateAchievements = (results, stats, streak) => {
    const quizzesTaken = results?.length || 0;
    const mathQuizzes = results?.filter(r => r.domain === 'Mathématiques').length || 0;
    const createdQuizzes = stats?.createdQuizzes || 0;
    const perfectScores = results?.filter(r => r.score === 100).length || 0;
    
    // Calculer le nombre de badges débloqués
    const unlockedCount = [
      quizzesTaken >= 1,
      mathQuizzes >= 10,
      createdQuizzes >= 5,
      streak >= 7,
      perfectScores >= 1
    ].filter(Boolean).length;
    
    return [
      {
        id: 1,
        title: "Débutant",
        description: "Premier quiz complété",
        unlocked: quizzesTaken >= 1,
        icon: <Medal className="w-5 h-5" />,
        date: results?.length ? new Date(results[0]?.date || results[0]?.createdAt).toLocaleDateString('fr-FR') : null
      },
      {
        id: 2,
        title: "Expert Mathématiques",
        description: "10 quiz en mathématiques",
        unlocked: mathQuizzes >= 10,
        icon: <Trophy className="w-5 h-5" />,
        date: null,
        progress: Math.min(mathQuizzes, 10),
        total: 10
      },
      {
        id: 3,
        title: "Série de 7 jours",
        description: "Quiz tous les jours pendant une semaine",
        unlocked: streak >= 7,
        icon: <Flame className="w-5 h-5" />,
        progress: Math.min(streak, 7),
        total: 7
      },
      {
        id: 4,
        title: "Collectionneur",
        description: "Obtenir 10 badges",
        unlocked: false,
        icon: <Award className="w-5 h-5" />,
        progress: unlockedCount,
        total: 10
      },
      {
        id: 5,
        title: "Créateur",
        description: "Créer 5 quiz",
        unlocked: createdQuizzes >= 5,
        icon: <Star className="w-5 h-5" />,
        progress: Math.min(createdQuizzes, 5),
        total: 5
      }
    ];
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
          <Loader size={48} className="animate-spin" color="#6366f1" />
          <p style={{ color: '#94a3b8', marginTop: 16 }}>Chargement des défis...</p>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
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
              <Trophy size={14} color="#f59e0b" />
              <span style={{ color: '#a5b4fc', fontSize: '0.7rem', fontWeight: 600 }}>
                DÉFIS & RÉCOMPENSES
              </span>
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#f8fafc', marginBottom: 4 }}>
              Défis et Récompenses
            </h1>
            <p style={{ color: '#94a3b8' }}>
              Relevez des défis et gagnez des récompenses exclusives
            </p>
          </div>
        </div>

        {/* Stats rapides */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16,
          marginBottom: 32,
        }}>
          <div style={{
            background: 'rgba(15,23,42,0.7)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: 16,
            padding: 16,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#6366f1' }}>{userStats.points}</div>
            <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Points</div>
          </div>
          <div style={{
            background: 'rgba(15,23,42,0.7)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: 16,
            padding: 16,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981' }}>{userStats.challengesCompleted}</div>
            <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Défis relevés</div>
          </div>
          <div style={{
            background: 'rgba(15,23,42,0.7)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: 16,
            padding: 16,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f59e0b' }}>{userStats.badges}</div>
            <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Badges</div>
          </div>
          <div style={{
            background: 'rgba(15,23,42,0.7)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: 16,
            padding: 16,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#8b5cf6' }}>{userStats.streak}</div>
            <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Série actuelle</div>
          </div>
        </div>

        {/* Défis de la semaine */}
        <h2 style={{ fontSize: '1.3rem', fontWeight: 600, color: '#f8fafc', marginBottom: 16 }}>
          Défis de la semaine
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 20,
          marginBottom: 40,
        }}>
          {weeklyChallenges.map((challenge) => (
            <motion.div
              key={challenge.id}
              whileHover={{ y: -4 }}
              style={{
                background: 'rgba(15,23,42,0.7)',
                backdropFilter: 'blur(12px)',
                border: `1px solid ${challenge.color}30`,
                borderRadius: 20,
                padding: 20,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: `${challenge.color}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: challenge.color,
                }}>
                  {challenge.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ color: '#f8fafc', fontWeight: 600, marginBottom: 2 }}>
                    {challenge.title}
                  </h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{challenge.description}</p>
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Progression</span>
                  <span style={{ color: challenge.color, fontSize: '0.8rem' }}>
                    {challenge.progress}/{challenge.total}
                  </span>
                </div>
                <div style={{
                  width: '100%',
                  height: 6,
                  background: '#1e293b',
                  borderRadius: 3,
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${(challenge.progress / challenge.total) * 100}%`,
                    height: '100%',
                    background: challenge.color,
                    borderRadius: 3,
                  }} />
                </div>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: 12,
                borderTop: '1px solid rgba(255,255,255,0.05)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Gift size={14} color="#f59e0b" />
                  <span style={{ color: '#f59e0b', fontSize: '0.8rem' }}>{challenge.reward}</span>
                </div>
                <span style={{ color: '#64748b', fontSize: '0.7rem' }}>{challenge.expires}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Badges et accomplissements */}
        <h2 style={{ fontSize: '1.3rem', fontWeight: 600, color: '#f8fafc', marginBottom: 16 }}>
          Accomplissements
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: 16,
        }}>
          {achievements.map((achievement) => (
            <motion.div
              key={achievement.id}
              whileHover={{ scale: 1.02 }}
              style={{
                background: 'rgba(15,23,42,0.7)',
                backdropFilter: 'blur(12px)',
                border: `1px solid ${achievement.unlocked ? '#10b981' : 'rgba(99,102,241,0.2)'}`,
                borderRadius: 16,
                padding: 16,
                opacity: achievement.unlocked ? 1 : 0.7,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: achievement.unlocked ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: achievement.unlocked ? '#10b981' : '#64748b',
                }}>
                  {achievement.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ color: '#f8fafc', fontWeight: 600, marginBottom: 2 }}>
                    {achievement.title}
                  </h4>
                  <p style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{achievement.description}</p>
                </div>
              </div>
              {!achievement.unlocked && achievement.progress !== undefined && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>Progression</span>
                    <span style={{ color: '#a5b4fc', fontSize: '0.7rem' }}>
                      {achievement.progress}/{achievement.total}
                    </span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: 4,
                    background: '#1e293b',
                    borderRadius: 2,
                  }}>
                    <div style={{
                      width: `${(achievement.progress / achievement.total) * 100}%`,
                      height: '100%',
                      background: '#6366f1',
                      borderRadius: 2,
                    }} />
                  </div>
                </div>
              )}
              {achievement.unlocked && achievement.date && (
                <p style={{ color: '#10b981', fontSize: '0.7rem', marginTop: 8 }}>
                  Obtenu le {achievement.date}
                </p>
              )}
            </motion.div>
          ))}
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

export default ChallengesPage;