// src/pages/Dashboard/Dashboard.jsx — VERSION SANS RETOUR VERS DÉCOUVERTE
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Area, AreaChart,
} from 'recharts';
import {
  BookOpen, Play, Edit, Award, Zap, Settings,
  TrendingUp, TrendingDown, Clock, Target, Star, ChevronRight,
  Menu, X, Plus, RefreshCw, AlertCircle, Home, FileText, Users,
  BarChart2
} from 'lucide-react';

import { getDashboardData } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import SubscriptionStatusCard from '../../components/SubscriptionStatusCard';
import NavHome from '../../components/NavHome';
import './Dashboard.css';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

// ============================================
// STYLES EN LIGNE
// ============================================
const styles = {
  layout: {
    display: 'flex',
    minHeight: '100vh',
    background: 'radial-gradient(circle at 50% 0%, #0d1527 0%, #05071a 100%)',
    position: 'relative',
    color: '#f8fafc',
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  },
  backgroundGrid: {
    position: 'fixed',
    inset: 0,
    backgroundImage: `
      linear-gradient(rgba(99, 102, 241, 0.04) 1px, transparent 1px), 
      linear-gradient(90deg, rgba(99, 102, 241, 0.04) 1px, transparent 1px)
    `,
    backgroundSize: '32px 32px',
    pointerEvents: 'none',
    zIndex: 0,
  },
  sidebar: {
    width: 280,
    background: 'rgba(10, 15, 30, 0.85)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderRight: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px 16px',
    position: 'fixed',
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 100,
  },
  sidebarBrand: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '0 12px 24px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  },
  brandText: {
    fontSize: '1.4rem',
    fontWeight: 800,
    letterSpacing: '-0.02em',
    background: 'linear-gradient(135deg, #a5b4fc 0%, #6366f1 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  sidebarFooter: {
    marginTop: 'auto',
    paddingTop: 20,
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
  },
  userPill: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: 700,
    fontSize: '0.95rem',
    boxShadow: '0 0 12px rgba(99, 102, 241, 0.4)',
  },
  main: {
    flex: 1,
    marginLeft: 280,
    padding: '32px 40px',
    position: 'relative',
    zIndex: 1,
    transition: 'margin-left 0.25s ease',
  },
  mainFull: {
    flex: 1,
    marginLeft: 0,
    padding: '32px 40px',
    position: 'relative',
    zIndex: 1,
    transition: 'margin-left 0.25s ease',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
    gap: 16,
    flexWrap: 'wrap',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  menuBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#a5b4fc',
    cursor: 'pointer',
  },
  pageTitle: {
    fontSize: '1.85rem',
    fontWeight: 800,
    color: '#f8fafc',
    letterSpacing: '-0.02em',
    marginBottom: 2,
  },
  pageDate: {
    color: '#64748b',
    fontSize: '0.85rem',
    fontWeight: 500,
    textTransform: 'capitalize',
  },
  refreshBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#a5b4fc',
    cursor: 'pointer',
  },
  ctaBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 20px',
    borderRadius: 12,
    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
    boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
    border: 'none',
    color: 'white',
    fontWeight: 600,
    fontSize: '0.88rem',
    cursor: 'pointer',
    textDecoration: 'none',
  },
  errorBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 20px',
    borderRadius: 14,
    background: 'rgba(239, 68, 68, 0.08)',
    border: '1px solid rgba(239, 68, 68, 0.25)',
    color: '#f87171',
    marginBottom: 28,
    fontSize: '0.88rem',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 20,
    marginBottom: 32,
  },
  chartsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
    gap: 24,
    marginBottom: 32,
  },
  chartCard: {
    background: 'rgba(15, 23, 42, 0.65)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    padding: 24,
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)',
  },
  chartTitle: {
    color: '#f8fafc',
    fontSize: '1.05rem',
    fontWeight: 700,
    marginBottom: 20,
    letterSpacing: '-0.01em',
  },
  bottomRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
    gap: 24,
  },
  quickActionsCard: {
    background: 'rgba(15, 23, 42, 0.65)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    padding: 24,
  },
  activityCard: {
    background: 'rgba(15, 23, 42, 0.65)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    padding: 24,
  },
  pieWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  pieLegend: {
    flex: 1,
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    color: '#94a3b8',
    fontSize: '0.85rem',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
  },
  skeletonLine: {
    height: 16,
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
  },
  skeletonChart: {
    height: 200,
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
  },
  activityItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '12px 0',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
  },
  activityScore: {
    width: 44,
    height: 44,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '0.88rem',
  },
  activityDetail: {
    flex: 1,
  },
  activityTitle: {
    color: '#f8fafc',
    fontSize: '0.88rem',
    fontWeight: 600,
    marginBottom: 3,
  },
  activityDate: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    color: '#64748b',
    fontSize: '0.78rem',
  },
  seeAllLink: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    color: '#a5b4fc',
    fontSize: '0.85rem',
    fontWeight: 600,
    textDecoration: 'none',
    marginTop: 18,
  },
};

// ============================================
// COMPOSANT StatCard
// ============================================
const StatCard = ({ icon: Icon, label, value, sub, color, trend, loading }) => (
  <motion.div
    className="stat-card"
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -4, borderColor: `${color}50` }}
    transition={{ duration: 0.2 }}
    style={{
      background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: 18,
      padding: 20,
      display: 'flex',
      alignItems: 'center',
      gap: 16,
    }}
  >
    <div
      className="stat-card-icon"
      style={{
        width: 48,
        height: 48,
        borderRadius: 14,
        background: `${color}15`,
        border: `1px solid ${color}30`,
        color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Icon size={22} />
    </div>
    <div className="stat-card-body">
      <p style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </p>
      {loading ? (
        <div style={{ ...styles.skeletonLine, width: 60, height: 24, marginTop: 4 }} />
      ) : (
        <p style={{ color: '#f8fafc', fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', marginTop: 2 }}>
          {value}
        </p>
      )}
      {sub && !loading && (
        <p style={{ fontSize: '0.75rem', fontWeight: 600, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4, color: trend > 0 ? '#10b981' : trend < 0 ? '#ef4444' : '#64748b' }}>
          {trend > 0 ? <TrendingUp size={12} /> : trend < 0 ? <TrendingDown size={12} /> : null}
          {sub}
        </p>
      )}
    </div>
  </motion.div>
);

// ============================================
// COMPOSANT QuickAction
// ============================================
const QuickAction = ({ icon: Icon, label, to, color, description }) => {
  const navigate = useNavigate();
  return (
    <motion.div
      className="quick-action"
      whileHover={{ scale: 1.01, backgroundColor: 'rgba(255,255,255,0.03)' }}
      whileTap={{ scale: 0.99 }}
      onClick={() => navigate(to)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: 14,
        borderRadius: 14,
        border: '1px solid rgba(255, 255, 255, 0.05)',
        cursor: 'pointer',
        marginBottom: 10,
        transition: 'all 0.2s ease',
      }}
    >
      <div
        className="qa-icon"
        style={{
          width: 42,
          height: 42,
          borderRadius: 12,
          background: `${color}15`,
          border: `1px solid ${color}30`,
          color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={20} />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ color: '#f8fafc', fontSize: '0.9rem', fontWeight: 600 }}>{label}</p>
        <p style={{ color: '#64748b', fontSize: '0.78rem' }}>{description}</p>
      </div>
      <ChevronRight size={16} color="#64748b" />
    </motion.div>
  );
};

// ============================================
// DASHBOARD PRINCIPAL
// ============================================
const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDemo, setIsDemo] = useState(false);
  const [sideOpen, setSideOpen] = useState(true);
  const [activeNav, setActiveNav] = useState('overview');
  const navigate = useNavigate();
  const { user } = useAuth();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setIsDemo(false);
    try {
      const res = await getDashboardData();
      const dashData = res?.data ? res.data : res;
      setData(dashData);
    } catch (err) {
      console.warn('Dashboard: backend indisponible, mode démo activé');
      setIsDemo(true);
      setData({
        stats: {
          totalQuizzes: 0, totalResults: 0, averageScore: 0,
          bestScore: 0, weeklyResults: 0, monthlyResults: 0, trend: 0,
          myQuizzesTaken: 0, myAverageScore: 0, myBestScore: 0,
        },
        domainBreakdown: [],
        recentActivity: [],
      });
      if (err?.response?.status !== 401) {
        setError('Backend non connecté — affichage du mode démonstration');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const stats = data?.stats || {};
  const weekTrend = stats.trend > 0 ? `+${stats.trend}% cette semaine`
                  : stats.trend < 0 ? `${stats.trend}% cette semaine`
                  : 'Stable';

  const scoreHistory = (data?.recentActivity || []).map((r, i) => ({
    name: r.date ? new Date(r.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
                 : `J${i + 1}`,
    score: r.percentage || r.score || 0,
  }));

  const navItems = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: Home, path: '/dashboard' },
    { id: 'quiz', label: 'Mes quiz', icon: BookOpen, path: '/quizzes' },
    { id: 'create', label: 'Créer un quiz', icon: Edit, path: '/create' },
    { id: 'statistics', label: 'Statistiques', icon: TrendingUp, path: '/statistics' },
    { id: 'community', label: 'Communauté', icon: Users, path: '/community' },
    { id: 'settings', label: 'Paramètres', icon: Settings, path: '/settings' },
  ];

  return (
    <div className="dash-layout" style={styles.layout}>
      <NavHome />
      <div style={styles.backgroundGrid} />

      {/* Aura lumineuse d'arrière-plan */}
      <div style={{
        position: 'fixed', top: '-20%', left: '50%', transform: 'translateX(-50%)',
        width: '60vw', height: '40vh',
        background: 'radial-gradient(ellipse, rgba(99,102,241,0.1) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* Barre Latérale */}
      <AnimatePresence>
        {sideOpen && (
          <motion.aside
            className="dash-sidebar"
            style={styles.sidebar}
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div style={styles.sidebarBrand}>
              <Zap size={24} color="#6366f1" />
              <span style={styles.brandText}>NA2 Quiz</span>
            </div>

            <nav className="sidebar-nav" style={{ flex: 1, marginTop: 24, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {navItems.map(({ id, label, icon: Icon, path }) => (
                <motion.button
                  key={id}
                  className={`nav-item ${activeNav === id ? 'active' : ''}`}
                  whileHover={{ x: 4 }}
                  onClick={() => { setActiveNav(id); navigate(path); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 16px',
                    borderRadius: 12,
                    border: 'none',
                    background: activeNav === id ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                    color: activeNav === id ? '#a5b4fc' : '#94a3b8',
                    fontWeight: activeNav === id ? 600 : 500,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                  }}
                >
                  <Icon size={18} color={activeNav === id ? '#6366f1' : '#64748b'} />
                  <span>{label}</span>
                </motion.button>
              ))}
            </nav>

            <div style={styles.sidebarFooter}>
              <div style={styles.userPill}>
                <div style={{ ...styles.userAvatar, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                  {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <p style={{ color: '#f8fafc', fontSize: '0.88rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.email || 'Utilisateur'}
                  </p>
                  <p style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'capitalize' }}>
                    {user?.role || 'Membre'}
                  </p>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Zone Principale */}
      <div className="dash-main" style={sideOpen ? styles.main : styles.mainFull}>
        <header className="dash-header" style={styles.header}>
          <div style={styles.headerLeft}>
            <motion.button
              className="menu-btn"
              style={styles.menuBtn}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSideOpen(v => !v)}
            >
              {sideOpen ? <X size={20} /> : <Menu size={20} />}
            </motion.button>
            <div>
              <h1 style={styles.pageTitle}>Tableau de bord</h1>
              <p style={styles.pageDate}>
                {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
          </div>

          <div style={styles.headerRight}>
            <SubscriptionStatusCard />

            <motion.button
              className="refresh-btn"
              style={styles.refreshBtn}
              onClick={load}
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.3 }}
            >
              <RefreshCw size={16} />
            </motion.button>

            <Link to="/create?mode=ai" style={styles.ctaBtn}>
              <Plus size={16} /> Nouveau Quiz
            </Link>
          </div>
        </header>

        {/* Bannière d'Information / Démo */}
        {(error || isDemo) && (
          <div style={styles.errorBanner}>
            <AlertCircle size={18} />
            <span>{error || 'Mode démonstration — Connectez votre API pour synchroniser les résultats.'}</span>
          </div>
        )}

        <div className="dash-content">
          {/* Grille de Statistiques */}
          <div style={styles.statsGrid}>
            <StatCard icon={BookOpen} label="Quiz réalisés" value={stats.myQuizzesTaken || stats.totalResults || 0} color="#6366f1" loading={loading} />
            <StatCard icon={Target} label="Tentatives" value={stats.totalResults || 0} color="#10b981" loading={loading} sub={weekTrend} trend={stats.trend} />
            <StatCard icon={Star} label="Moyenne" value={`${stats.myAverageScore || stats.averageScore || 0}%`} color="#f59e0b" loading={loading} />
            <StatCard icon={Award} label="Meilleur Score" value={`${stats.myBestScore || stats.bestScore || 0}%`} color="#8b5cf6" loading={loading} />
          </div>

          {/* Zone Graphiques */}
          <div style={styles.chartsRow}>
            <motion.div style={styles.chartCard} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <h3 style={styles.chartTitle}>Évolution des performances</h3>
              {loading ? (
                <div style={styles.skeletonChart} />
              ) : scoreHistory.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '0.88rem', textAlign: 'center', padding: '40px 0' }}>Aucune donnée d'historique disponible</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={scoreHistory}>
                    <defs>
                      <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff' }} />
                    <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2.5} fill="url(#scoreGrad)" name="Score %" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </motion.div>

            <motion.div style={styles.chartCard} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <h3 style={styles.chartTitle}>Répartition par Domaine</h3>
              {loading ? (
                <div style={styles.skeletonChart} />
              ) : (data?.domainBreakdown || []).length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '0.88rem', textAlign: 'center', padding: '40px 0' }}>Aucun domaine enregistré</p>
              ) : (
                <div style={styles.pieWrapper}>
                  <ResponsiveContainer width="50%" height={220}>
                    <PieChart>
                      <Pie data={data.domainBreakdown} dataKey="count" nameKey="domain" cx="50%" cy="50%" outerRadius={75} innerRadius={45}>
                        {data.domainBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={styles.pieLegend}>
                    {data.domainBreakdown.map((d, i) => (
                      <div key={i} style={styles.legendItem}>
                        <span style={{ ...styles.legendDot, background: COLORS[i % COLORS.length] }} />
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.domain}</span>
                        <strong style={{ color: '#f8fafc' }}>{d.count}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Bottom Row */}
          <div style={styles.bottomRow}>
            <motion.div style={styles.quickActionsCard} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <h3 style={styles.chartTitle}>Actions rapides</h3>
              <div>
                <QuickAction icon={Play} label="Lancer un quiz" to="/start" color="#6366f1" description="Sélectionner un domaine et démarrer" />
                <QuickAction icon={Zap} label="Génération par IA" to="/create?mode=ai" color="#10b981" description="Créer automatiquement un quiz adapté" />
                <QuickAction icon={FileText} label="Importer un document" to="/create?mode=file" color="#f59e0b" description="Générer depuis PDF, DOCX, ou TXT" />
                <QuickAction icon={BarChart2} label="Analyse détaillée" to="/statistics" color="#8b5cf6" description="Visualiser vos rapports complets" />
              </div>
            </motion.div>

            <motion.div style={styles.activityCard} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <h3 style={styles.chartTitle}>Activité récente</h3>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} style={{ ...styles.skeletonLine, marginBottom: 12 }} />
                ))
              ) : (data?.recentActivity || []).length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '0.88rem', padding: '20px 0' }}>Aucune activité récente</p>
              ) : (
                <div>
                  {data.recentActivity.map((r, i) => (
                    <div key={r.id || i} style={styles.activityItem}>
                      <div style={{
                        ...styles.activityScore,
                        background: r.percentage >= 75 ? 'rgba(16, 185, 129, 0.12)' : r.percentage >= 50 ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                        color: r.percentage >= 75 ? '#10b981' : r.percentage >= 50 ? '#f59e0b' : '#ef4444',
                        border: `1px solid ${r.percentage >= 75 ? 'rgba(16, 185, 129, 0.2)' : r.percentage >= 50 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                      }}>
                        {r.percentage}%
                      </div>
                      <div style={styles.activityDetail}>
                        <p style={styles.activityTitle}>{r.quizTitle || r.subject || `Quiz ${i + 1}`}</p>
                        <p style={styles.activityDate}>
                          <Clock size={12} />
                          {new Date(r.date).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>{r.score}/{r.total}</span>
                    </div>
                  ))}
                </div>
              )}
              <Link to="/history" style={styles.seeAllLink}>
                Consulter l'historique <ChevronRight size={14} />
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;