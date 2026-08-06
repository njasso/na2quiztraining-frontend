// src/pages/Admin/AdminDashboard.jsx — VERSION CORRIGÉE
// Corrections :
//   - getUsers/getQuizzes/getResults : extraction de .data (réponses enveloppées)
//   - userGrowth : Math.random() remplacé par getWeeklyStats() réel
//   - quizStats (camembert) : données réelles depuis l'API stats
//   - Ajout totalQuestions depuis /api/questions count
//   - ✅ Import Bot corrigé (depuis lucide-react, pas recharts)

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Users, BookOpen, Award, Settings,
  RefreshCw, Activity, TrendingUp, Clock, Shield,
  AlertTriangle, Database, HelpCircle, Bot  // ✅ Bot importé depuis lucide-react
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getUsers, getQuizzes, getResults, getStats, getWeeklyStats, getQuestions } from '../../services/api';
import toast from 'react-hot-toast';
import NavHome from '../../components/NavHome';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell,
} from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0, totalQuizzes: 0, totalResults: 0,
    totalQuestions: 0, activeToday: 0, newToday: 0, avgScore: 0,
  });
  const [weeklyGrowth, setWeeklyGrowth] = useState([]);
  const [quizByDomain, setQuizByDomain] = useState([]);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, quizzesRes, resultsRes, statsRes, weeklyRes, questionsRes] = await Promise.allSettled([
        getUsers({ limit: 1000 }),
        getQuizzes({ limit: 1000 }),
        getResults({ limit: 1000 }),
        getStats(),
        getWeeklyStats(),
        getQuestions({ limit: 1 }),
      ]);

      const usersArr = usersRes.status === 'fulfilled'
        ? (Array.isArray(usersRes.value?.data) ? usersRes.value.data : []) : [];
      const quizzesArr = quizzesRes.status === 'fulfilled'
        ? (Array.isArray(quizzesRes.value?.data) ? quizzesRes.value.data : []) : [];
      const resultsArr = resultsRes.status === 'fulfilled'
        ? (Array.isArray(resultsRes.value?.data) ? resultsRes.value.data : []) : [];
      const statsData = statsRes.status === 'fulfilled'
        ? (statsRes.value?.data || statsRes.value || {}) : {};
      const weeklyData = weeklyRes.status === 'fulfilled'
        ? (weeklyRes.value?.data || []) : [];
      const questPagination = questionsRes.status === 'fulfilled'
        ? (questionsRes.value?.pagination || {}) : {};

      const today = new Date().toDateString();
      const activeToday = usersArr.filter(u =>
        u.lastActive && new Date(u.lastActive).toDateString() === today
      ).length;
      const newToday = usersArr.filter(u =>
        u.createdAt && new Date(u.createdAt).toDateString() === today
      ).length;
      const avgScore = resultsArr.length > 0
        ? Math.round(resultsArr.reduce((s, r) => s + (r.score || 0), 0) / resultsArr.length)
        : (statsData.averageScore || 0);

      setStats({
        totalUsers: usersArr.length,
        totalQuizzes: quizzesArr.length || statsData.totalQuizzes || 0,
        totalResults: resultsArr.length || statsData.totalResults || 0,
        totalQuestions: questPagination.total || 0,
        activeToday,
        newToday,
        avgScore,
      });

      if (Array.isArray(weeklyData) && weeklyData.length > 0) {
        setWeeklyGrowth(weeklyData.map(w => ({
          date: w.day || w.week || '',
          resultats: w.count || 0,
          score: w.average || 0,
        })));
      } else {
        const last7 = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dStr = d.toDateString();
          const dayResults = resultsArr.filter(r =>
            new Date(r.completedAt || r.date || 0).toDateString() === dStr
          );
          const dayAvg = dayResults.length > 0
            ? Math.round(dayResults.reduce((s, r) => s + r.score, 0) / dayResults.length)
            : 0;
          last7.push({
            date: d.toLocaleDateString('fr-FR', { weekday: 'short' }),
            resultats: dayResults.length,
            score: dayAvg,
          });
        }
        setWeeklyGrowth(last7);
      }

      const domainMap = {};
      quizzesArr.forEach(q => {
        const key = q.domain || q.subject || 'Général';
        domainMap[key] = (domainMap[key] || 0) + 1;
      });
      const domainArr = Object.entries(domainMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6);
      setQuizByDomain(domainArr.length > 0 ? domainArr : [
        { name: 'Aucun quiz', value: 1 },
      ]);

    } catch (err) {
      console.error('Erreur admin dashboard:', err);
      toast.error('Erreur de chargement des statistiques');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  // ── Carte stat ────────────────────────────────────────────
  const StatCard = ({ title, value, icon, color, sub }) => (
    <motion.div whileHover={{ y: -3 }} style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}20`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
          {icon}
        </div>
        {sub && <span style={{ fontSize: '0.7rem', padding: '3px 8px',
          background: 'rgba(16,185,129,0.1)', border: '1px solid #10b981',
          borderRadius: 12, color: '#10b981' }}>{sub}</span>}
      </div>
      <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#f8fafc' }}>
        {loading ? '—' : value}
      </div>
      <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: 4 }}>{title}</div>
    </motion.div>
  );

  const tooltipStyle = {
    contentStyle: { background: '#0f172a', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 8, color: '#f8fafc' },
  };

  // ── Actions rapides ───────────────────────────────────────
  const quickActions = [
    { title: 'Utilisateurs', icon: <Users size={20} />, path: '/admin/users', color: '#6366f1', desc: 'Gestion des comptes' },
    { title: 'Quiz', icon: <BookOpen size={20} />, path: '/admin/quizzes', color: '#10b981', desc: 'Modération des quiz' },
    { title: 'Banque questions', icon: <Database size={20} />, path: '/admin/questions', color: '#8b5cf6', desc: 'Validation des questions' },
    { title: 'Banque QCM', icon: <Database size={20} />, path: '/admin/qcm-bank', color: '#06b6d4', desc: 'Explorer & analyser la banque' },
    { title: 'Créer une question', icon: <BookOpen size={20} />, path: '/admin/create-question', color: '#22c55e', desc: 'Création guidée (référentiel)' },
    { title: 'Import massif', icon: <Database size={20} />, path: '/admin/import', color: '#f97316', desc: 'Importer CSV / JSON' },
    { title: 'QCM Cleaner', icon: <Settings size={20} />, path: '/admin/qcm-cleaner', color: '#eab308', desc: 'Nettoyer les chapitres' },
    { title: 'Rapports', icon: <TrendingUp size={20} />, path: '/admin/reports', color: '#f59e0b', desc: 'Statistiques détaillées' },
    { title: 'Configuration', icon: <Settings size={20} />, path: '/admin/config', color: '#ef4444', desc: 'Paramètres système' },
    { 
      title: 'Quiz IA DeepSeek', 
      icon: <Bot size={20} />, 
      path: '/admin/ai-quiz-creation', 
      color: '#8b5cf6', 
      desc: 'Génération de quiz par IA' 
    },
  ];

  return (
    <div style={containerStyle}>
      <NavHome />
      <div style={gridBgStyle} />
      <main style={{ position: 'relative', zIndex: 1, maxWidth: 1400, margin: '0 auto' }}>

        {/* En-tête */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
          <button onClick={() => navigate(-1)} style={btnSecStyle}>
            <ArrowLeft size={16} style={{ marginRight: 6 }} /> Retour
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#f8fafc' }}>
              Dashboard Administrateur
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
              Connecté en tant que {user?.firstName} {user?.lastName} · {user?.role}
            </p>
          </div>
          <motion.button whileHover={{ rotate: 180 }} transition={{ duration: 0.3 }}
            onClick={fetchStats} style={iconBtnStyle} title="Rafraîchir">
            <RefreshCw size={16} />
          </motion.button>
        </div>

        {/* Cartes de stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16, marginBottom: 28 }}>
          <StatCard title="Utilisateurs" value={stats.totalUsers} icon={<Users size={22} />} color="#6366f1" sub={stats.newToday > 0 ? `+${stats.newToday} aujourd'hui` : null} />
          <StatCard title="Quiz créés" value={stats.totalQuizzes} icon={<BookOpen size={22} />} color="#10b981" />
          <StatCard title="Tentatives" value={stats.totalResults} icon={<Award size={22} />} color="#f59e0b" sub={`${stats.avgScore}% moy.`} />
          <StatCard title="Questions" value={stats.totalQuestions} icon={<HelpCircle size={22} />} color="#8b5cf6" />
          <StatCard title="Actifs auj." value={stats.activeToday} icon={<Activity size={22} />} color="#06b6d4" />
        </div>

        {/* Graphiques */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 24 }}>
          {/* Activité 7 jours — données réelles */}
          <div style={cardStyle}>
            <h3 style={{ color: '#f8fafc', fontSize: '1rem', fontWeight: 600, marginBottom: 16 }}>
              Activité des 7 derniers jours (données réelles)
            </h3>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={weeklyGrowth}>
                <defs>
                  <linearGradient id="rGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="sGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip {...tooltipStyle} />
                <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
                <Area type="monotone" dataKey="resultats" stroke="#6366f1" strokeWidth={2}
                  fill="url(#rGrad)" name="Tentatives" />
                <Area type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2}
                  fill="url(#sGrad)" name="Score moyen %" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Quiz par domaine — données réelles */}
          <div style={cardStyle}>
            <h3 style={{ color: '#f8fafc', fontSize: '1rem', fontWeight: 600, marginBottom: 16 }}>
              Quiz par domaine (réel)
            </h3>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={quizByDomain} cx="50%" cy="50%"
                  innerRadius={55} outerRadius={95} paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`}
                  labelLine={{ stroke: '#64748b', strokeWidth: 1 }}>
                  {quizByDomain.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip {...tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Actions rapides */}
        <h2 style={{ color: '#f8fafc', fontSize: '1.1rem', fontWeight: 600, marginBottom: 14 }}>
          Actions rapides
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12, marginBottom: 28 }}>
          {quickActions.map((a, i) => (
            <motion.button key={i} whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}
              onClick={() => navigate(a.path)}
              style={{ background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: 14, padding: 18, cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${a.color}20`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: a.color, marginBottom: 12 }}>
                {a.icon}
              </div>
              <p style={{ color: '#f8fafc', fontWeight: 600, fontSize: '0.9rem', marginBottom: 4 }}>{a.title}</p>
              <p style={{ color: '#64748b', fontSize: '0.75rem' }}>{a.desc}</p>
            </motion.button>
          ))}
        </div>

        {/* Alerte zone admin */}
        <div style={{ padding: '16px 20px', background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.25)', borderRadius: 14,
          display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <AlertTriangle size={22} color="#ef4444" />
          <div style={{ flex: 1 }}>
            <p style={{ color: '#fca5a5', fontWeight: 600, fontSize: '0.9rem', marginBottom: 3 }}>
              Zone d'administration
            </p>
            <p style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
              Toutes les actions sont enregistrées. Faites attention lors de la modification des données.
            </p>
          </div>
          <button onClick={() => navigate('/admin/config')}
            style={{ padding: '8px 16px', background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8,
              color: '#ef4444', cursor: 'pointer', fontSize: '0.85rem' }}>
            Paramètres
          </button>
        </div>
      </main>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

const containerStyle = { 
  minHeight: '100vh', 
  background: 'linear-gradient(135deg, #05071a 0%, #0a0f2e 60%, #05071a 100%)', 
  padding: '24px' 
};

const gridBgStyle = { 
  position: 'fixed', 
  inset: 0, 
  pointerEvents: 'none', 
  zIndex: 0, 
  backgroundImage: 'linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)', 
  backgroundSize: '40px 40px' 
};

const cardStyle = { 
  background: 'rgba(15,23,42,0.7)', 
  backdropFilter: 'blur(12px)', 
  border: '1px solid rgba(99,102,241,0.2)', 
  borderRadius: 18, 
  padding: '20px 24px' 
};

const btnSecStyle = { 
  display: 'flex', 
  alignItems: 'center', 
  padding: '10px 18px', 
  background: 'rgba(255,255,255,0.05)', 
  border: '1px solid rgba(99,102,241,0.2)', 
  borderRadius: 12, 
  color: '#94a3b8', 
  cursor: 'pointer', 
  fontSize: '0.9rem' 
};

const iconBtnStyle = { 
  padding: 10, 
  background: 'rgba(99,102,241,0.1)', 
  border: '1px solid rgba(99,102,241,0.3)', 
  borderRadius: 8, 
  color: '#a5b4fc', 
  cursor: 'pointer', 
  display: 'flex' 
};

export default AdminDashboard;