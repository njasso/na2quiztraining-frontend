// src/pages/StatisticsPage.jsx — VERSION CORRIGÉE
// Corrections :
//   - getStats() et getResults() : extraction de .data (réponse API enveloppée)
//   - weeklyProgress : Math.random() remplacé par getWeeklyStats() réel
//   - Normalisation des champs (score déjà en %, timeSpent en secondes → heures)
//   - Gestion d'erreur par graphique (pas de crash global)
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Area, AreaChart,
} from 'recharts';
import {
  TrendingUp, Award, BookOpen, Target, ArrowLeft,
  Clock, Percent, Loader, RefreshCw, AlertCircle,
} from 'lucide-react';
import { getStats, getResults, getWeeklyStats, getUserStats } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

import NavHome from '../components/NavHome';
const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const StatisticsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [timeRange, setTimeRange] = useState('week');

  const fetchStatistics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // ✅ Toutes les réponses API sont enveloppées : { success, data: {...} }
      const [statsRes, resultsRes, weeklyRes, userStatsRes] = await Promise.allSettled([
        getStats(),
        getResults({ limit: 200 }),
        getWeeklyStats(),
        user?._id || user?.id ? getUserStats(user._id || user.id) : Promise.resolve(null),
      ]);

      // Extraire les données (les rejections donnent un tableau vide)
      const stats      = statsRes.status === 'fulfilled' ? (statsRes.value?.data || statsRes.value || {}) : {};
      const resultsRaw = resultsRes.status === 'fulfilled' ? (resultsRes.value?.data || resultsRes.value || []) : [];
      const weeklyRaw  = weeklyRes.status === 'fulfilled' ? (weeklyRes.value?.data || weeklyRes.value || []) : [];
      const userStats  = userStatsRes.status === 'fulfilled' ? (userStatsRes.value?.data || {}) : {};

      // ✅ S'assurer que results est bien un tableau
      const results = Array.isArray(resultsRaw) ? resultsRaw : [];

      setData(transformData(stats, results, weeklyRaw, userStats));
    } catch (err) {
      console.error('Erreur statistiques:', err);
      setError('Impossible de charger les statistiques');
      toast.error('Erreur de chargement des statistiques');
    } finally {
      setLoading(false);
    }
  }, [user, timeRange]);

  useEffect(() => { fetchStatistics(); }, [fetchStatistics]);

  const transformData = (stats, results, weekly, userStats) => {
    const totalResults  = results.length;
    const totalScore    = results.reduce((s, r) => s + (r.score || 0), 0);
    const averageScore  = totalResults > 0 ? Math.round(totalScore / totalResults) : 0;
    const bestScore     = totalResults > 0 ? Math.max(...results.map(r => r.score || 0)) : 0;
    // ✅ timeSpent est en secondes → convertir en heures
    const totalTimeSec  = results.reduce((s, r) => s + (r.timeSpent || 0), 0);
    const totalTimeH    = Math.round(totalTimeSec / 3600 * 10) / 10;

    // Grouper par domaine
    const domainMap = {};
    results.forEach(r => {
      const key = r.domain || r.subject || 'Général';
      if (!domainMap[key]) domainMap[key] = { count: 0, total: 0 };
      domainMap[key].count++;
      domainMap[key].total += r.score || 0;
    });
    const quizByDomain = Object.entries(domainMap)
      .map(([name, d]) => ({
        _id: name,
        count: d.count,
        averageScore: d.count > 0 ? Math.round(d.total / d.count) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // Historique récent (10 derniers résultats)
    const recentResults = [...results]
      .sort((a, b) => new Date(b.completedAt || b.date) - new Date(a.completedAt || a.date))
      .slice(0, 10)
      .reverse()
      .map(r => ({
        date: new Date(r.completedAt || r.date || Date.now())
          .toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
        score: r.score || 0,
        subject: r.subject || 'Général',
      }));

    // ✅ Progression hebdomadaire depuis l'API (pas de Math.random())
    const weeklyProgress = Array.isArray(weekly) && weekly.length > 0
      ? weekly.map(w => ({ week: w.day || w.week || '', score: w.average || w.score || 0 }))
      : [];

    return {
      // Globaux
      totalQuizzes: stats.totalQuizzes || 0,
      totalResults,
      averageScore,
      bestScore,
      totalTimeH,
      // Personnel (depuis getUserStats si disponible)
      myQuizzesTaken: userStats.totalQuizzes || totalResults,
      myAverageScore: userStats.averageScore || averageScore,
      myBestScore:    userStats.bestScore || bestScore,
      // Graphiques
      recentResults,
      quizByDomain,
      weeklyProgress,
    };
  };

  // ── Composants locaux ──────────────────────────────────────
  const KPI = ({ label, value, icon: Icon, color, suffix = '' }) => (
    <motion.div whileHover={{ y: -4 }} style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: 16,
          background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={24} color={color} />
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: 4 }}>{label}</div>
          <div style={{ fontSize: '1.9rem', fontWeight: 700, color: '#f8fafc' }}>
            {loading ? '—' : `${value}${suffix}`}
          </div>
        </div>
      </div>
    </motion.div>
  );

  const ChartCard = ({ title, children }) => (
    <div style={cardStyle}>
      <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc', marginBottom: 20 }}>{title}</h3>
      {children}
    </div>
  );

  const tooltipStyle = {
    contentStyle: { background: '#0f172a', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 8, color: '#f8fafc' },
  };

  if (loading) return (
    <div style={containerStyle}>
      <NavHome />
      <div style={{ textAlign: 'center' }}>
        <Loader size={48} style={{ animation: 'spin 1s linear infinite' }} color="#6366f1" />
        <p style={{ color: '#94a3b8', marginTop: 16 }}>Chargement des statistiques...</p>
      </div>
    </div>
  );

  const scoreHistory = data?.recentResults || [];
  const domainPie    = (data?.quizByDomain || []).map(d => ({ name: d._id, value: d.count }));

  return (
    <div style={containerStyle}>
      <div style={gridBgStyle} />
      <main style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto' }}>

        {/* En-tête */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)} style={btnSecStyle}>
            <ArrowLeft size={20} />
          </motion.button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#f8fafc', marginBottom: 4 }}>Statistiques</h1>
            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Analyse de vos performances depuis la base de données</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {['week', 'month', 'year'].map(r => (
              <button key={r} onClick={() => setTimeRange(r)} style={{
                padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: '0.85rem',
                background: timeRange === r ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${timeRange === r ? '#6366f1' : 'rgba(99,102,241,0.2)'}`,
                color: timeRange === r ? '#a5b4fc' : '#94a3b8',
              }}>
                {r === 'week' ? 'Semaine' : r === 'month' ? 'Mois' : 'Année'}
              </button>
            ))}
            <motion.button whileHover={{ rotate: 180 }} transition={{ duration: 0.3 }}
              onClick={fetchStatistics} style={btnSecStyle}>
              <RefreshCw size={16} />
            </motion.button>
          </div>
        </div>

        {/* Erreur */}
        {error && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '12px 16px',
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 12, marginBottom: 24, color: '#fca5a5', fontSize: '0.9rem' }}>
            <AlertCircle size={16} color="#ef4444" /> {error}
          </div>
        )}

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
          <KPI label="Quiz réalisés"  value={data?.myQuizzesTaken || 0} icon={Target}   color="#6366f1" />
          <KPI label="Score moyen"    value={data?.myAverageScore || 0} icon={Percent}  color="#10b981" suffix="%" />
          <KPI label="Meilleur score" value={data?.myBestScore || 0}    icon={Award}    color="#f59e0b" suffix="%" />
          <KPI label="Temps total"    value={data?.totalTimeH || 0}     icon={Clock}    color="#8b5cf6" suffix="h" />
          <KPI label="Quiz disponibles" value={data?.totalQuizzes || 0} icon={BookOpen} color="#06b6d4" />
        </div>

        {/* Graphiques rangée 1 */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>
          <ChartCard title="Évolution de mes scores (10 derniers)">
            {scoreHistory.length === 0 ? (
              <p style={{ color: '#64748b', textAlign: 'center', padding: '40px 0' }}>
                Aucun résultat pour le moment — passez votre premier quiz !
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={scoreHistory}>
                  <defs>
                    <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip {...tooltipStyle} />
                  <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2}
                    fill="url(#sg)" name="Score %" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Répartition par domaine">
            {domainPie.length === 0 ? (
              <p style={{ color: '#64748b', textAlign: 'center', padding: '40px 0' }}>Aucune donnée</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={domainPie} dataKey="value" nameKey="name"
                    cx="50%" cy="50%" outerRadius={90} innerRadius={50}
                    label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`}
                    labelLine={{ stroke: '#64748b', strokeWidth: 1 }}>
                    {domainPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip {...tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        {/* Progression hebdomadaire */}
        {data?.weeklyProgress?.length > 0 && (
          <ChartCard title="Progression hebdomadaire (données réelles)">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.weeklyProgress}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="week" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="score" fill="#10b981" radius={[4, 4, 0, 0]} name="Score moyen %" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Détail par domaine */}
        {(data?.quizByDomain || []).length > 0 && (
          <div style={{ ...cardStyle, marginTop: 20 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc', marginBottom: 20 }}>
              Détails par domaine (données réelles)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(data.quizByDomain).map((domain, i) => {
                const max = Math.max(...data.quizByDomain.map(d => d.count), 1);
                return (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: '0.85rem' }}>
                      <span style={{ color: '#94a3b8' }}>{domain._id}</span>
                      <span style={{ color: '#f8fafc' }}>{domain.count} quiz · {domain.averageScore}% moy.</span>
                    </div>
                    <div style={{ width: '100%', height: 7, background: '#1e293b', borderRadius: 4 }}>
                      <div style={{ width: `${(domain.count / max) * 100}%`, height: '100%',
                        background: COLORS[i % COLORS.length], borderRadius: 4 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

const containerStyle = { minHeight: '100vh', background: 'linear-gradient(135deg, #05071a 0%, #0a0f2e 60%, #05071a 100%)', padding: '24px', display: 'flex', alignItems: loading => loading ? 'center' : 'flex-start', justifyContent: loading => loading ? 'center' : 'flex-start' };
const gridBgStyle = { position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: 'linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px' };
const cardStyle = { background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(12px)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 20, padding: '20px 24px', marginBottom: 0 };
const btnSecStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12, padding: 12, color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };

export default StatisticsPage;
