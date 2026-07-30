// src/pages/Dashboard/Dashboard.jsx — VERSION FINALE CORRIGÉE
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
  BarChart2,
} from 'lucide-react';
import { getDashboardData } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import './Dashboard.css';

import NavHome from '../../components/NavHome';
const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

// ============================================
// STYLES EN LIGNE
// ============================================
const styles = {
  layout: {
    display: 'flex',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #05071a 0%, #0a0f2e 60%, #05071a 100%)',
    position: 'relative',
  },
  backgroundGrid: {
    position: 'fixed',
    inset: 0,
    backgroundImage: 'linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)',
    backgroundSize: '40px 40px',
    pointerEvents: 'none',
    zIndex: 0,
  },
  sidebar: {
    width: 280,
    background: 'rgba(15, 23, 42, 0.8)',
    backdropFilter: 'blur(12px)',
    borderRight: '1px solid rgba(99, 102, 241, 0.15)',
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
    borderBottom: '1px solid rgba(99, 102, 241, 0.15)',
  },
  brandText: {
    fontSize: '1.5rem',
    fontWeight: 700,
    background: 'linear-gradient(135deg, #a5b4fc 0%, #6366f1 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  sidebarFooter: {
    marginTop: 'auto',
    paddingTop: 24,
    borderTop: '1px solid rgba(99, 102, 241, 0.15)',
  },
  userPill: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    background: 'rgba(99, 102, 241, 0.08)',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: 600,
    fontSize: '1rem',
  },
  main: {
    flex: 1,
    marginLeft: 280,
    padding: '24px 32px',
    position: 'relative',
    zIndex: 1,
  },
  mainFull: {
    flex: 1,
    marginLeft: 0,
    padding: '24px 32px',
    position: 'relative',
    zIndex: 1,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  menuBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(99, 102, 241, 0.1)',
    border: '1px solid rgba(99, 102, 241, 0.2)',
    color: '#a5b4fc',
    cursor: 'pointer',
  },
  pageTitle: {
    fontSize: '1.8rem',
    fontWeight: 700,
    color: '#f8fafc',
    marginBottom: 4,
  },
  pageDate: {
    color: '#94a3b8',
    fontSize: '0.9rem',
    textTransform: 'capitalize',
  },
  refreshBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(99, 102, 241, 0.1)',
    border: '1px solid rgba(99, 102, 241, 0.2)',
    color: '#a5b4fc',
    cursor: 'pointer',
  },
  ctaBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '12px 24px',
    borderRadius: 12,
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    border: 'none',
    color: 'white',
    fontWeight: 600,
    fontSize: '0.9rem',
    cursor: 'pointer',
    textDecoration: 'none',
    marginLeft: 12,
  },
  errorBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 20px',
    borderRadius: 12,
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#ef4444',
    marginBottom: 24,
    fontSize: '0.9rem',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 20,
    marginBottom: 32,
  },
  chartsRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 20,
    marginBottom: 32,
  },
  chartCard: {
    background: 'rgba(15, 23, 42, 0.7)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(99, 102, 241, 0.15)',
    borderRadius: 20,
    padding: 24,
  },
  chartTitle: {
    color: '#f8fafc',
    fontSize: '1.1rem',
    fontWeight: 600,
    marginBottom: 20,
  },
  bottomRow: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 0.8fr',
    gap: 20,
  },
  quickActionsCard: {
    background: 'rgba(15, 23, 42, 0.7)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(99, 102, 241, 0.15)',
    borderRadius: 20,
    padding: 24,
  },
  activityCard: {
    background: 'rgba(15, 23, 42, 0.7)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(99, 102, 241, 0.15)',
    borderRadius: 20,
    padding: 24,
  },
  pieWrapper: {
    display: 'flex',
    alignItems: 'center',
  },
  pieLegend: {
    flex: 1,
    paddingLeft: 20,
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    color: '#94a3b8',
    fontSize: '0.85rem',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
  },
  skeletonLine: {
    height: 16,
    background: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 8,
  },
  skeletonChart: {
    height: 200,
    background: 'rgba(99, 102, 241, 0.05)',
    borderRadius: 12,
  },
  activityItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 0',
    borderBottom: '1px solid rgba(99, 102, 241, 0.08)',
  },
  activityScore: {
    width: 48,
    height: 48,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '0.9rem',
  },
  activityDetail: {
    flex: 1,
  },
  activityTitle: {
    color: '#f8fafc',
    fontSize: '0.9rem',
    fontWeight: 500,
    marginBottom: 2,
  },
  activityDate: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    color: '#64748b',
    fontSize: '0.75rem',
  },
  seeAllLink: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    color: '#a5b4fc',
    fontSize: '0.85rem',
    textDecoration: 'none',
    marginTop: 16,
  },
};

// ============================================
// COMPOSANT StatCard
// ============================================
const StatCard = ({ icon: Icon, label, value, sub, color, trend, loading }) => (
  <motion.div
    className="stat-card"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -4, boxShadow: `0 20px 40px ${color}20`, borderColor: `${color}40` }}
  >
    <div className="stat-card-icon" style={{ background: `${color}15`, color }}>
      <Icon size={22} />
    </div>
    <div className="stat-card-body">
      <p className="stat-label">{label}</p>
      {loading ? (
        <div className="skeleton-line w-16 h-8" />
      ) : (
        <p className="stat-value">{value}</p>
      )}
      {sub && !loading && (
        <p className="stat-sub" style={{ color: trend > 0 ? '#10b981' : trend < 0 ? '#ef4444' : '#64748b' }}>
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
      whileHover={{ scale: 1.02, background: `${color}10`, borderColor: `${color}40` }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(to)}
    >
      <div className="qa-icon" style={{ background: `${color}15`, color }}>
        <Icon size={22} />
      </div>
      <div style={{ flex: 1 }}>
        <p className="qa-label">{label}</p>
        <p className="qa-desc">{description}</p>
      </div>
      <ChevronRight size={16} className="qa-arrow" />
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
        setError('Backend non connecté — données indisponibles');
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
      {/* Background Grid */}
      <div style={styles.backgroundGrid} />

      {/* Glow Effect */}
      <div style={{
        position: 'fixed', top: '-15%', left: '50%', transform: 'translateX(-50%)',
        width: '70vw', height: '50vh',
        background: 'radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* Sidebar */}
      <AnimatePresence>
        {sideOpen && (
          <motion.aside
            className="dash-sidebar"
            style={styles.sidebar}
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'tween', duration: 0.22 }}
          >
            <div style={styles.sidebarBrand}>
              <Zap size={24} color="#6366f1" />
              <span style={styles.brandText}>NA2 Quiz</span>
            </div>

            <nav className="sidebar-nav" style={{ flex: 1, marginTop: 24 }}>
              {navItems.map(({ id, label, icon: Icon, path }) => (
                <motion.button
                  key={id}
                  className={`nav-item ${activeNav === id ? 'active' : ''}`}
                  whileHover={{ x: 4 }}
                  onClick={() => { setActiveNav(id); navigate(path); }}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </motion.button>
              ))}
            </nav>

            <div style={styles.sidebarFooter}>
              <div style={styles.userPill}>
                <div style={{ ...styles.userAvatar, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                  {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="user-name">
                    {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.email || 'Utilisateur'}
                  </p>
                  <p className="user-role">{user?.role || 'user'}</p>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className={`dash-main ${sideOpen ? 'shifted' : ''}`} style={sideOpen ? styles.main : styles.mainFull}>
        {/* Header */}
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
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <motion.button
              className="refresh-btn"
              style={styles.refreshBtn}
              onClick={load}
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.3 }}
            >
              <RefreshCw size={16} />
            </motion.button>
            <Link to="/create?mode=ai" className="cta-btn" style={styles.ctaBtn}>
              <Plus size={16} /> Nouveau Quiz
            </Link>
          </div>
        </header>

        {/* Error/Demo Banner */}
        {(error || isDemo) && (
          <div className="error-banner" style={styles.errorBanner}>
            <AlertCircle size={16} />
            <span>{error || 'Mode démo — connectez le backend pour voir vos données réelles'}</span>
          </div>
        )}

        <div className="dash-content">
          {/* Stats Grid */}
          <div className="stats-grid" style={styles.statsGrid}>
            <StatCard icon={BookOpen} label="Quiz réalisés" value={stats.myQuizzesTaken || stats.totalResults || 0} color="#6366f1" loading={loading} />
            <StatCard icon={Target} label="Tentatives totales" value={stats.totalResults || 0} color="#10b981" loading={loading} sub={weekTrend} trend={stats.trend} />
            <StatCard icon={Star} label="Score moyen" value={`${stats.myAverageScore || stats.averageScore || 0}%`} color="#f59e0b" loading={loading} />
            <StatCard icon={Award} label="Meilleur score" value={`${stats.myBestScore || stats.bestScore || 0}%`} color="#8b5cf6" loading={loading} />
          </div>

          {/* Charts */}
          <div className="charts-row" style={styles.chartsRow}>
            <motion.div className="chart-card" style={styles.chartCard} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <h3 style={styles.chartTitle}>Évolution des scores</h3>
              {loading ? (
                <div className="skeleton-chart" style={styles.skeletonChart} />
              ) : scoreHistory.length === 0 ? (
                <p className="empty-state">Aucune activité — passez votre premier quiz !</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={scoreHistory}>
                    <defs>
                      <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" />
                    <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8 }} />
                    <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} fill="url(#scoreGrad)" name="Score %" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </motion.div>

            <motion.div className="chart-card" style={styles.chartCard} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
              <h3 style={styles.chartTitle}>Domaines</h3>
              {loading ? (
                <div className="skeleton-chart" style={styles.skeletonChart} />
              ) : (data?.domainBreakdown || []).length === 0 ? (
                <p className="empty-state">Aucun quiz disponible</p>
              ) : (
                <div className="pie-wrapper" style={styles.pieWrapper}>
                  <ResponsiveContainer width="50%" height={200}>
                    <PieChart>
                      <Pie data={data.domainBreakdown} dataKey="count" nameKey="domain"
                        cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                        {data.domainBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pie-legend" style={styles.pieLegend}>
                    {data.domainBreakdown.map((d, i) => (
                      <div key={i} className="legend-item" style={styles.legendItem}>
                        <span className="legend-dot" style={{ ...styles.legendDot, background: COLORS[i % COLORS.length] }} />
                        <span style={{ flex: 1 }}>{d.domain}</span>
                        <strong style={{ color: '#f8fafc' }}>{d.count}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Bottom Row */}
          <div className="bottom-row" style={styles.bottomRow}>
            <motion.div className="quick-actions-card" style={styles.quickActionsCard} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <h3 style={styles.chartTitle}>Actions rapides</h3>
              <div className="quick-actions-list">
                <QuickAction icon={Play} label="Passer un quiz" to="/start" color="#6366f1" description="Choisir domaine, niveau, matière" />
                <QuickAction icon={Zap} label="Générer par IA" to="/create?mode=ai" color="#10b981" description="Créer un quiz avec l'IA" />
                <QuickAction icon={FileText} label="Depuis un fichier" to="/create?mode=file" color="#f59e0b" description="Importer Word ou PDF" />
                <QuickAction icon={BarChart2} label="Statistiques" to="/statistics" color="#8b5cf6" description="Voir vos performances" />
              </div>
            </motion.div>

            <motion.div className="activity-card" style={styles.activityCard} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <h3 style={styles.chartTitle}>Activité récente</h3>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="skeleton-line mb-2" style={styles.skeletonLine} />
                ))
              ) : (data?.recentActivity || []).length === 0 ? (
                <p className="empty-state">Aucune activité récente</p>
              ) : (
                <div className="activity-list">
                  {data.recentActivity.map((r, i) => (
                    <motion.div key={r.id || i} className="activity-item" style={styles.activityItem}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
                      <div className="activity-score" style={{
                        ...styles.activityScore,
                        background: r.percentage >= 75 ? '#10b98115' : r.percentage >= 50 ? '#f59e0b15' : '#ef444415',
                        color: r.percentage >= 75 ? '#10b981' : r.percentage >= 50 ? '#f59e0b' : '#ef4444',
                      }}>
                        {r.percentage}%
                      </div>
                      <div className="activity-detail" style={styles.activityDetail}>
                        <p style={styles.activityTitle}>{r.quizTitle || r.subject || `Quiz ${i + 1}`}</p>
                        <p style={styles.activityDate}>
                          <Clock size={11} />
                          {new Date(r.date).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <span className="activity-pts">{r.score}/{r.total}</span>
                    </motion.div>
                  ))}
                </div>
              )}
              <Link to="/history" className="see-all-link" style={styles.seeAllLink}>
                Tout voir <ChevronRight size={14} />
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;