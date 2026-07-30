// src/pages/Formateur/FormateurStats.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, TrendingUp, Users, Award,
  RefreshCw
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell, Area, AreaChart
} from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api'; // Import par défaut
import toast from 'react-hot-toast';

import NavHome from '../../components/NavHome';
const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'];

const FormateurStats = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('week');
  const [stats, setStats] = useState({
    totalAttempts: 0,
    averageScore: 0,
    completionRate: 0,
    totalParticipants: 0,
    totalQuizzes: 0
  });
  
  const [dailyActivity, setDailyActivity] = useState([]);
  const [quizPerformance, setQuizPerformance] = useState([]);
  const [domainDistribution, setDomainDistribution] = useState([]);
  const [recentResults, setRecentResults] = useState([]);

  useEffect(() => {
    if (user?.role !== 'formateur' && user?.role !== 'admin') {
      toast.error('Accès non autorisé');
      navigate('/');
      return;
    }
    fetchStats();
  }, [period, user, navigate]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Récupérer les quiz du formateur
      const quizzesResponse = await api.getQuizzes({ 
        createdBy: user.id || user._id,
        limit: 100
      });
      
      const quizzesArray = Array.isArray(quizzesResponse) ? quizzesResponse : 
                          (quizzesResponse?.data ? (Array.isArray(quizzesResponse.data) ? quizzesResponse.data : []) : []);
      
      // Récupérer tous les résultats
      const resultsResponse = await api.getResults({ limit: 1000 });
      const resultsArray = Array.isArray(resultsResponse) ? resultsResponse : 
                          (resultsResponse?.data ? (Array.isArray(resultsResponse.data) ? resultsResponse.data : []) : []);
      
      // Filtrer les résultats pour les quiz du formateur
      const quizIds = new Set(quizzesArray.map(q => q.id || q._id));
      const formateurResults = resultsArray.filter(r => quizIds.has(r.quizId));
      
      // Statistiques globales
      const totalAttempts = formateurResults.length;
      const totalScore = formateurResults.reduce((sum, r) => sum + (r.score || 0), 0);
      const averageScore = totalAttempts > 0 ? Math.round(totalScore / totalAttempts) : 0;
      const completed = formateurResults.filter(r => r.completed).length;
      const completionRate = totalAttempts > 0 ? Math.round((completed / totalAttempts) * 100) : 0;
      
      // Participants uniques
      const uniqueParticipants = new Set(formateurResults.map(r => r.userId).filter(Boolean)).size;
      
      setStats({
        totalAttempts,
        averageScore,
        completionRate,
        totalParticipants: uniqueParticipants,
        totalQuizzes: quizzesArray.length
      });

      // Activité quotidienne
      const activity = generateDailyActivity(formateurResults);
      setDailyActivity(activity);

      // Performance par quiz
      const performance = generateQuizPerformance(quizzesArray, formateurResults);
      setQuizPerformance(performance);

      // Distribution par domaine
      const domains = generateDomainDistribution(quizzesArray);
      setDomainDistribution(domains);

      // Résultats récents
      setRecentResults(formateurResults.slice(0, 10));

    } catch (error) {
      console.error('Erreur chargement stats:', error);
      toast.error('Impossible de charger les statistiques');
    } finally {
      setLoading(false);
    }
  };

  const generateDailyActivity = (results) => {
    const days = period === 'week' ? 7 : period === 'month' ? 30 : 90;
    const activity = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const dateStr = date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
      
      const dayResults = results.filter(r => {
        const resultDate = new Date(r.createdAt || r.date || r.completedAt);
        resultDate.setHours(0, 0, 0, 0);
        return resultDate.getTime() === date.getTime();
      });
      
      const count = dayResults.length;
      const avgScore = count > 0 
        ? Math.round(dayResults.reduce((sum, r) => sum + (r.score || 0), 0) / count)
        : 0;
      
      activity.push({
        date: dateStr,
        tentatives: count,
        score: avgScore
      });
    }
    
    return activity;
  };

  const generateQuizPerformance = (quizzes, results) => {
    const performanceMap = new Map();
    
    // Initialiser avec tous les quizzes
    quizzes.forEach(quiz => {
      performanceMap.set(quiz.id || quiz._id, {
        name: quiz.title || 'Sans titre',
        tentatives: 0,
        score: 0,
        likes: quiz.likes || 0,
        totalScore: 0
      });
    });
    
    // Ajouter les résultats
    results.forEach(result => {
      const quizId = result.quizId;
      if (performanceMap.has(quizId)) {
        const quizData = performanceMap.get(quizId);
        quizData.tentatives += 1;
        quizData.totalScore += (result.score || 0);
      }
    });
    
    // Calculer les moyennes
    const performanceArray = Array.from(performanceMap.values()).map(quiz => ({
      ...quiz,
      score: quiz.tentatives > 0 ? Math.round(quiz.totalScore / quiz.tentatives) : 0
    }));
    
    return performanceArray
      .sort((a, b) => b.tentatives - a.tentatives)
      .slice(0, 5);
  };

  const generateDomainDistribution = (quizzes) => {
    const domains = {};
    quizzes.forEach(q => {
      const domain = q.domain || q.category || 'Général';
      domains[domain] = (domains[domain] || 0) + 1;
    });
    
    return Object.entries(domains).map(([name, value]) => ({ 
      name: name.length > 15 ? name.substring(0, 15) + '...' : name, 
      value 
    }));
  };

  const handleRefresh = () => {
    fetchStats();
    toast.success('Statistiques mises à jour');
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
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: 'center' }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <RefreshCw size={48} color="#10b981" />
          </motion.div>
          <p style={{ color: '#94a3b8', marginTop: 16, fontSize: '1.1rem' }}>
            Chargement des statistiques...
          </p>
        </motion.div>
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
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}
        >
          <motion.button
            whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.1)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/formateur/dashboard')}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(16,185,129,0.2)',
              borderRadius: 12,
              padding: 12,
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              transition: 'all 0.2s',
            }}
          >
            <ArrowLeft size={20} />
          </motion.button>

          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
              Statistiques détaillées
            </h1>
            <p style={{ color: '#94a3b8', margin: '4px 0 0' }}>
              Analysez les performances de vos quiz et suivez la progression
            </p>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              style={{
                padding: '10px 16px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(16,185,129,0.2)',
                borderRadius: 12,
                color: '#f8fafc',
                outline: 'none',
                cursor: 'pointer',
                fontSize: '0.95rem',
              }}
            >
              <option value="week">7 derniers jours</option>
              <option value="month">30 derniers jours</option>
              <option value="year">90 derniers jours</option>
            </select>
            
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(16,185,129,0.2)' }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              style={{
                padding: '10px 16px',
                background: 'rgba(16,185,129,0.1)',
                border: '1px solid rgba(16,185,129,0.3)',
                borderRadius: 12,
                color: '#10b981',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: '0.95rem',
              }}
            >
              <RefreshCw size={18} />
              Actualiser
            </motion.button>
          </div>
        </motion.div>

        {/* Cartes de statistiques */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 20,
            marginBottom: 32
          }}
        >
          <StatCard
            title="Tentatives totales"
            value={stats.totalAttempts}
            icon={<Users size={24} />}
            color="#10b981"
          />
          <StatCard
            title="Score moyen"
            value={`${stats.averageScore}%`}
            icon={<TrendingUp size={24} />}
            color="#6366f1"
          />
          <StatCard
            title="Taux de complétion"
            value={`${stats.completionRate}%`}
            icon={<Award size={24} />}
            color="#f59e0b"
          />
          <StatCard
            title="Participants uniques"
            value={stats.totalParticipants}
            icon={<Users size={24} />}
            color="#8b5cf6"
          />
          <StatCard
            title="Quiz publiés"
            value={stats.totalQuizzes}
            icon={<TrendingUp size={24} />}
            color="#ec4899"
          />
        </motion.div>

        {/* Graphiques */}
        <div style={{ display: 'grid', gap: 24, marginBottom: 32 }}>
          {/* Activité quotidienne */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{
              background: 'rgba(15,23,42,0.7)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(16,185,129,0.2)',
              borderRadius: 24,
              padding: 24,
            }}
          >
            <h3 style={{ color: '#f8fafc', fontSize: '1.2rem', fontWeight: 600, marginBottom: 20 }}>
              Activité quotidienne
            </h3>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={dailyActivity} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="tentativesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" tick={{ fill: '#94a3b8' }} />
                <YAxis yAxisId="left" tick={{ fill: '#94a3b8' }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{
                    background: '#0f172a',
                    border: '1px solid rgba(16,185,129,0.3)',
                    borderRadius: 8,
                    color: '#f8fafc'
                  }}
                  labelStyle={{ color: '#10b981' }}
                />
                <Legend />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="tentatives"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#tentativesGradient)"
                  name="Tentatives"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="score"
                  stroke="#6366f1"
                  strokeWidth={2}
                  name="Score moyen %"
                  dot={{ fill: '#6366f1', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Deuxième ligne de graphiques */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: 24 }}>
            {/* Performance par quiz */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              style={{
                background: 'rgba(15,23,42,0.7)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(16,185,129,0.2)',
                borderRadius: 24,
                padding: 24,
              }}
            >
              <h3 style={{ color: '#f8fafc', fontSize: '1.2rem', fontWeight: 600, marginBottom: 20 }}>
                Top 5 quiz les plus tentés
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={quizPerformance} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis yAxisId="left" tick={{ fill: '#94a3b8' }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fill: '#94a3b8' }} />
                  <Tooltip
                    contentStyle={{
                      background: '#0f172a',
                      border: '1px solid rgba(16,185,129,0.3)',
                      borderRadius: 8,
                      color: '#f8fafc'
                    }}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="tentatives" fill="#10b981" radius={[4, 4, 0, 0]} name="Tentatives" />
                  <Line yAxisId="right" type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} name="Score %" dot={{ fill: '#6366f1', r: 4 }} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Distribution par domaine */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              style={{
                background: 'rgba(15,23,42,0.7)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(16,185,129,0.2)',
                borderRadius: 24,
                padding: 24,
              }}
            >
              <h3 style={{ color: '#f8fafc', fontSize: '1.2rem', fontWeight: 600, marginBottom: 20 }}>
                Répartition par domaine
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={domainDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
                  >
                    {domainDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#0f172a',
                      border: '1px solid rgba(16,185,129,0.3)',
                      borderRadius: 8,
                      color: '#f8fafc'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>
          </div>
        </div>

        {/* Résultats récents */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          style={{
            background: 'rgba(15,23,42,0.7)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(16,185,129,0.2)',
            borderRadius: 24,
            padding: 24,
          }}
        >
          <h3 style={{ color: '#f8fafc', fontSize: '1.2rem', fontWeight: 600, marginBottom: 20 }}>
            Résultats récents
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {recentResults.length === 0 ? (
              <p style={{ color: '#94a3b8', textAlign: 'center', padding: 20 }}>
                Aucun résultat récent
              </p>
            ) : (
              recentResults.map((result, index) => (
                <motion.div
                  key={result.id || result._id || index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.05)',
                    transition: 'all 0.2s',
                  }}
                >
                  <div>
                    <p style={{ color: '#f8fafc', fontWeight: 500, margin: '0 0 4px' }}>
                      {result.userName || result.user?.name || 'Anonyme'}
                    </p>
                    <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>
                      {new Date(result.createdAt || result.date || result.completedAt).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{
                      padding: '6px 16px',
                      background: result.score >= 70 ? 'rgba(16,185,129,0.15)' : 
                                 result.score >= 50 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                      borderRadius: 20,
                      color: result.score >= 70 ? '#10b981' : 
                             result.score >= 50 ? '#f59e0b' : '#ef4444',
                      fontWeight: 600,
                      fontSize: '1rem',
                    }}>
                      {result.score}%
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
};

// Composant pour les cartes de statistiques
const StatCard = ({ title, value, icon, color }) => (
  <motion.div
    whileHover={{ y: -6, boxShadow: `0 10px 30px -10px ${color}` }}
    style={{
      background: 'rgba(15,23,42,0.7)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(16,185,129,0.2)',
      borderRadius: 20,
      padding: 24,
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      transition: 'all 0.2s',
    }}
  >
    <div style={{
      width: 56,
      height: 56,
      borderRadius: 16,
      background: `${color}20`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: color,
    }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#f8fafc', lineHeight: 1.2 }}>
        {value}
      </div>
      <div style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: 500 }}>
        {title}
      </div>
    </div>
  </motion.div>
);

export default FormateurStats;