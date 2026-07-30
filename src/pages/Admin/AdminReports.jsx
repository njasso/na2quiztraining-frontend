// src/pages/Admin/AdminReports.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Download, Calendar, Filter, TrendingUp,
  Users, BookOpen, Award, Clock, Zap, Globe,
  BarChart2, PieChart, LineChart, FileText, Printer,
  Mail, Share2, ChevronDown, RefreshCw, Eye, EyeOff,
  DownloadCloud, UploadCloud, Database, HardDrive,
  Cpu, Activity, AlertTriangle, CheckCircle, XCircle
} from 'lucide-react';
import {
  LineChart as ReLineChart, Line, BarChart as ReBarChart, Bar,
  PieChart as RePieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, ComposedChart,
  Scatter
} from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import {
  getGlobalStats,
  getUsers,
  getQuizzes,
  getResults,
  getSystemHealth,
  exportData
} from '../../services/api';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

import NavHome from '../../components/NavHome';
const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const AdminReports = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // États
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [dateRange, setDateRange] = useState('30days');
  const [reportType, setReportType] = useState('overview');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCharts, setSelectedCharts] = useState(['users', 'quizzes', 'results']);
  
  // Données
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalQuizzes: 0,
    totalResults: 0,
    activeUsers: 0,
    newUsersToday: 0,
    newQuizzesToday: 0,
    averageScore: 0,
    completionRate: 0,
    avgTimePerQuiz: 0,
    totalPoints: 0
  });

  const [userGrowth, setUserGrowth] = useState([]);
  const [quizStats, setQuizStats] = useState([]);
  const [domainStats, setDomainStats] = useState([]);
  const [levelStats, setLevelStats] = useState([]);
  const [dailyActivity, setDailyActivity] = useState([]);
  const [topUsers, setTopUsers] = useState([]);
  const [popularQuizzes, setPopularQuizzes] = useState([]);
  const [systemHealth, setSystemHealth] = useState(null);
  
  // Périodes
  const [periods, setPeriods] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date()
  });

  useEffect(() => {
    if (user?.role !== 'admin') {
      toast.error('Accès non autorisé');
      navigate('/');
      return;
    }
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      // Récupérer toutes les données
      const [users, quizzes, results, health] = await Promise.all([
        getUsers({ limit: 1000 }).catch(() => []),
        getQuizzes({ limit: 1000 }).catch(() => []),
        getResults({ limit: 1000 }).catch(() => []),
        getSystemHealth().catch(() => null)
      ]);

      const usersArray = Array.isArray(users) ? users : [];
      const quizzesArray = Array.isArray(quizzes) ? quizzes : [];
      const resultsArray = Array.isArray(results) ? results : [];

      // Calculer les statistiques de base
      const today = new Date().toDateString();
      const newToday = usersArray.filter(u => 
        u.createdAt && new Date(u.createdAt).toDateString() === today
      ).length;

      const activeToday = usersArray.filter(u => 
        u.lastActive && new Date(u.lastActive).toDateString() === today
      ).length;

      const quizzesToday = quizzesArray.filter(q => 
        q.createdAt && new Date(q.createdAt).toDateString() === today
      ).length;

      const avgScore = resultsArray.length > 0
        ? Math.round(resultsArray.reduce((sum, r) => sum + (r.score || 0), 0) / resultsArray.length)
        : 0;

      const completionRate = resultsArray.length > 0
        ? Math.round((resultsArray.filter(r => r.completed).length / resultsArray.length) * 100)
        : 0;

      const avgTime = resultsArray.length > 0
        ? Math.round(resultsArray.reduce((sum, r) => sum + (r.timeSpent || 0), 0) / resultsArray.length)
        : 0;

      const totalPoints = resultsArray.reduce((sum, r) => sum + (r.points || r.score || 0), 0);

      setStats({
        totalUsers: usersArray.length,
        totalQuizzes: quizzesArray.length,
        totalResults: resultsArray.length,
        activeUsers: activeToday,
        newUsersToday: newToday,
        newQuizzesToday: quizzesToday,
        averageScore: avgScore,
        completionRate,
        avgTimePerQuiz: avgTime,
        totalPoints
      });

      // Générer données de croissance
      const growthData = generateGrowthData(usersArray, quizzesArray);
      setUserGrowth(growthData);

      // Statistiques par domaine
      const domainData = generateDomainStats(resultsArray);
      setDomainStats(domainData);

      // Statistiques par niveau
      const levelData = generateLevelStats(usersArray);
      setLevelStats(levelData);

      // Activité quotidienne
      const activityData = generateDailyActivity(resultsArray);
      setDailyActivity(activityData);

      // Top utilisateurs
      const topUsersData = generateTopUsers(resultsArray, usersArray);
      setTopUsers(topUsersData);

      // Quiz populaires
      const popularData = generatePopularQuizzes(resultsArray, quizzesArray);
      setPopularQuizzes(popularData);

      // Statistiques des quiz par catégorie
      const quizCategoryData = generateQuizCategoryStats(quizzesArray);
      setQuizStats(quizCategoryData);

      setSystemHealth(health);

    } catch (error) {
      console.error('Erreur chargement rapports:', error);
      toast.error('Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  };

  // Fonctions de génération de données
  const generateGrowthData = (users, quizzes) => {
    const data = [];
    const days = dateRange === '7days' ? 7 : dateRange === '30days' ? 30 : 90;
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
      
      const userCount = users.filter(u => 
        u.createdAt && new Date(u.createdAt).toDateString() === date.toDateString()
      ).length;
      
      const quizCount = quizzes.filter(q => 
        q.createdAt && new Date(q.createdAt).toDateString() === date.toDateString()
      ).length;
      
      data.push({
        date: dateStr,
        utilisateurs: userCount,
        quizzes: quizCount,
        totalUtilisateurs: users.filter(u => u.createdAt && new Date(u.createdAt) <= date).length,
        totalQuizzes: quizzes.filter(q => q.createdAt && new Date(q.createdAt) <= date).length
      });
    }
    return data;
  };

  const generateDomainStats = (results) => {
    const domains = {};
    results.forEach(r => {
      const domain = r.domain || 'Général';
      if (!domains[domain]) {
        domains[domain] = { count: 0, totalScore: 0, totalTime: 0 };
      }
      domains[domain].count++;
      domains[domain].totalScore += r.score || 0;
      domains[domain].totalTime += r.timeSpent || 0;
    });

    return Object.entries(domains).map(([name, data]) => ({
      name,
      value: data.count,
      score: data.count > 0 ? Math.round(data.totalScore / data.count) : 0,
      time: data.count > 0 ? Math.round(data.totalTime / data.count) : 0
    }));
  };

  const generateLevelStats = (users) => {
    const levels = { 'Débutant': 0, 'Intermédiaire': 0, 'Avancé': 0, 'Expert': 0 };
    users.forEach(u => {
      if (levels[u.niveau] !== undefined) {
        levels[u.niveau]++;
      }
    });
    return Object.entries(levels).map(([name, value]) => ({ name, value }));
  };

  const generateDailyActivity = (results) => {
    const activity = {};
    results.forEach(r => {
      if (!r.createdAt) return;
      const hour = new Date(r.createdAt).getHours();
      activity[hour] = (activity[hour] || 0) + 1;
    });

    return Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}h`,
      value: activity[i] || 0
    }));
  };

  const generateTopUsers = (results, users) => {
    const userPoints = {};
    results.forEach(r => {
      const userId = r.userId;
      if (!userId) return;
      if (!userPoints[userId]) {
        const user = users.find(u => u.id === userId || u._id === userId) || {};
        userPoints[userId] = {
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Inconnu',
          points: 0,
          quizzes: 0,
          avgScore: 0,
          totalScore: 0
        };
      }
      userPoints[userId].points += r.points || r.score || 0;
      userPoints[userId].quizzes++;
      userPoints[userId].totalScore += r.score || 0;
    });

    return Object.values(userPoints)
      .map(u => ({
        ...u,
        avgScore: u.quizzes > 0 ? Math.round(u.totalScore / u.quizzes) : 0
      }))
      .sort((a, b) => b.points - a.points)
      .slice(0, 10);
  };

  const generatePopularQuizzes = (results, quizzes) => {
    const quizCount = {};
    results.forEach(r => {
      const quizId = r.quizId;
      if (!quizId) return;
      if (!quizCount[quizId]) {
        const quiz = quizzes.find(q => q.id === quizId || q._id === quizId) || {};
        quizCount[quizId] = {
          title: quiz.title || 'Quiz sans titre',
          attempts: 0,
          avgScore: 0,
          totalScore: 0
        };
      }
      quizCount[quizId].attempts++;
      quizCount[quizId].totalScore += r.score || 0;
    });

    return Object.values(quizCount)
      .map(q => ({
        ...q,
        avgScore: q.attempts > 0 ? Math.round(q.totalScore / q.attempts) : 0
      }))
      .sort((a, b) => b.attempts - a.attempts)
      .slice(0, 10);
  };

  const generateQuizCategoryStats = (quizzes) => {
    const categories = {};
    quizzes.forEach(q => {
      const cat = q.category || q.domain || 'Général';
      if (!categories[cat]) {
        categories[cat] = { count: 0, totalQuestions: 0, avgDifficulty: 0 };
      }
      categories[cat].count++;
      categories[cat].totalQuestions += q.questions?.length || 0;
    });

    return Object.entries(categories).map(([name, data]) => ({
      name,
      value: data.count,
      questions: data.totalQuestions
    }));
  };

  // Export functions
  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const doc = new jsPDF();
      
      // Titre
      doc.setFontSize(20);
      doc.setTextColor(99, 102, 241);
      doc.text('Rapport NA2 Quiz', 105, 20, { align: 'center' });
      
      // Date
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 105, 30, { align: 'center' });
      
      // Résumé
      doc.setFontSize(14);
      doc.setTextColor(30, 41, 59);
      doc.text('Résumé général', 20, 45);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Total utilisateurs: ${stats.totalUsers}`, 20, 55);
      doc.text(`Total quiz: ${stats.totalQuizzes}`, 20, 62);
      doc.text(`Total résultats: ${stats.totalResults}`, 20, 69);
      doc.text(`Score moyen: ${stats.averageScore}%`, 20, 76);
      doc.text(`Taux de complétion: ${stats.completionRate}%`, 20, 83);
      
      // Tableau des top utilisateurs
      if (topUsers.length > 0) {
        doc.addPage();
        doc.setFontSize(14);
        doc.setTextColor(30, 41, 59);
        doc.text('Top 10 utilisateurs', 20, 20);
        
        const tableData = topUsers.map((u, i) => [
          i + 1,
          u.name,
          u.quizzes,
          u.avgScore + '%',
          u.points
        ]);
        
        doc.autoTable({
          startY: 30,
          head: [['#', 'Utilisateur', 'Quiz', 'Score moyen', 'Points']],
          body: tableData,
          theme: 'striped',
          headStyles: { fillColor: [99, 102, 241] }
        });
      }
      
      // Tableau des quiz populaires
      if (popularQuizzes.length > 0) {
        doc.addPage();
        doc.setFontSize(14);
        doc.setTextColor(30, 41, 59);
        doc.text('Quiz les plus populaires', 20, 20);
        
        const tableData = popularQuizzes.map((q, i) => [
          i + 1,
          q.title,
          q.attempts,
          q.avgScore + '%'
        ]);
        
        doc.autoTable({
          startY: 30,
          head: [['#', 'Quiz', 'Tentatives', 'Score moyen']],
          body: tableData,
          theme: 'striped',
          headStyles: { fillColor: [99, 102, 241] }
        });
      }
      
      doc.save(`rapport-na2quiz-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('Rapport PDF exporté avec succès');
    } catch (error) {
      console.error('Erreur export PDF:', error);
      toast.error('Erreur lors de l\'export PDF');
    } finally {
      setExporting(false);
    }
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const wb = XLSX.utils.book_new();
      
      // Feuille résumé
      const summaryData = [
        ['Métrique', 'Valeur'],
        ['Total utilisateurs', stats.totalUsers],
        ['Total quiz', stats.totalQuizzes],
        ['Total résultats', stats.totalResults],
        ['Utilisateurs actifs', stats.activeUsers],
        ['Nouveaux aujourd\'hui', stats.newUsersToday],
        ['Nouveaux quiz', stats.newQuizzesToday],
        ['Score moyen', stats.averageScore + '%'],
        ['Taux de complétion', stats.completionRate + '%'],
        ['Temps moyen', stats.avgTimePerQuiz + ' min'],
        ['Points totaux', stats.totalPoints]
      ];
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Résumé');
      
      // Feuille top utilisateurs
      if (topUsers.length > 0) {
        const usersData = [
          ['#', 'Utilisateur', 'Quiz', 'Score moyen', 'Points'],
          ...topUsers.map((u, i) => [i + 1, u.name, u.quizzes, u.avgScore + '%', u.points])
        ];
        const wsUsers = XLSX.utils.aoa_to_sheet(usersData);
        XLSX.utils.book_append_sheet(wb, wsUsers, 'Top utilisateurs');
      }
      
      // Feuille quiz populaires
      if (popularQuizzes.length > 0) {
        const quizzesData = [
          ['#', 'Quiz', 'Tentatives', 'Score moyen'],
          ...popularQuizzes.map((q, i) => [i + 1, q.title, q.attempts, q.avgScore + '%'])
        ];
        const wsQuizzes = XLSX.utils.aoa_to_sheet(quizzesData);
        XLSX.utils.book_append_sheet(wb, wsQuizzes, 'Quiz populaires');
      }
      
      // Feuille domaines
      if (domainStats.length > 0) {
        const domainData = [
          ['Domaine', 'Tentatives', 'Score moyen', 'Temps moyen (min)'],
          ...domainStats.map(d => [d.name, d.value, d.score + '%', d.time])
        ];
        const wsDomain = XLSX.utils.aoa_to_sheet(domainData);
        XLSX.utils.book_append_sheet(wb, wsDomain, 'Domaines');
      }
      
      XLSX.writeFile(wb, `rapport-na2quiz-${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Rapport Excel exporté avec succès');
    } catch (error) {
      console.error('Erreur export Excel:', error);
      toast.error('Erreur lors de l\'export Excel');
    } finally {
      setExporting(false);
    }
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      // Exporter les données brutes
      const data = {
        resume: stats,
        topUsers,
        popularQuizzes,
        domainStats,
        userGrowth,
        dailyActivity
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapport-na2quiz-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      
      toast.success('Données exportées avec succès');
    } catch (error) {
      console.error('Erreur export CSV:', error);
      toast.error('Erreur lors de l\'export');
    } finally {
      setExporting(false);
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
          <RefreshCw size={48} className="animate-spin" color="#6366f1" />
          <p style={{ color: '#94a3b8', marginTop: 16 }}>Génération des rapports...</p>
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

      <main style={{ position: 'relative', zIndex: 1, maxWidth: 1400, margin: '0 auto' }}>
        {/* En-tête */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/admin')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 20px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: 12,
                color: '#94a3b8',
                cursor: 'pointer',
              }}
            >
              <ArrowLeft size={16} />
              Retour
            </motion.button>
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#f8fafc' }}>
                Rapports et Analyses
              </h1>
              <p style={{ color: '#94a3b8' }}>
                Statistiques détaillées et analyses de performance
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              style={{
                padding: '10px 16px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: 12,
                color: '#f8fafc',
                outline: 'none',
              }}
            >
              <option value="7days">7 derniers jours</option>
              <option value="30days">30 derniers jours</option>
              <option value="90days">90 derniers jours</option>
              <option value="year">Cette année</option>
            </select>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={fetchReportData}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 20px',
                background: 'rgba(99,102,241,0.1)',
                border: '1px solid rgba(99,102,241,0.3)',
                borderRadius: 12,
                color: '#a5b4fc',
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={16} />
              Actualiser
            </motion.button>
          </div>
        </div>

        {/* Cartes de KPIs */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 20,
          marginBottom: 32
        }}>
          <KpiCard
            title="Utilisateurs"
            value={stats.totalUsers}
            icon={<Users size={24} />}
            color="#6366f1"
            trend={`+${stats.newUsersToday} aujourd'hui`}
          />
          <KpiCard
            title="Quiz"
            value={stats.totalQuizzes}
            icon={<BookOpen size={24} />}
            color="#10b981"
            trend={`+${stats.newQuizzesToday} aujourd'hui`}
          />
          <KpiCard
            title="Résultats"
            value={stats.totalResults}
            icon={<Award size={24} />}
            color="#f59e0b"
            trend={`${stats.averageScore}% moyen`}
          />
          <KpiCard
            title="Actifs"
            value={stats.activeUsers}
            icon={<Activity size={24} />}
            color="#8b5cf6"
            trend="aujourd'hui"
          />
          <KpiCard
            title="Complétion"
            value={`${stats.completionRate}%`}
            icon={<CheckCircle size={24} />}
            color="#ec4899"
            trend="taux de réussite"
          />
          <KpiCard
            title="Points"
            value={stats.totalPoints}
            icon={<Zap size={24} />}
            color="#14b8a6"
            trend="total"
          />
        </div>

        {/* Graphiques principaux */}
        <div style={{ display: 'grid', gap: 24, marginBottom: 24 }}>
          {/* Croissance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: 'rgba(15,23,42,0.7)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: 24,
              padding: 24,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ color: '#f8fafc', fontSize: '1.1rem', fontWeight: 600 }}>
                Croissance
              </h3>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 12, height: 12, background: '#6366f1', borderRadius: 3 }} />
                  <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Utilisateurs</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 12, height: 12, background: '#10b981', borderRadius: 3 }} />
                  <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Quiz</span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={userGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" tick={{ fill: '#94a3b8' }} />
                <YAxis yAxisId="left" tick={{ fill: '#94a3b8' }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{
                    background: '#0f172a',
                    border: '1px solid rgba(99,102,241,0.3)',
                    borderRadius: 8,
                    color: '#f8fafc'
                  }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="utilisateurs" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="left" dataKey="quizzes" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="totalUtilisateurs" stroke="#8b5cf6" strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="totalQuizzes" stroke="#f59e0b" strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Deuxième ligne de graphiques */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {/* Répartition par domaine */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              style={{
                background: 'rgba(15,23,42,0.7)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: 24,
                padding: 24,
              }}
            >
              <h3 style={{ color: '#f8fafc', fontSize: '1.1rem', fontWeight: 600, marginBottom: 20 }}>
                Tentatives par domaine
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <RePieChart>
                  <Pie
                    data={domainStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {domainStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#0f172a',
                      border: '1px solid rgba(99,102,241,0.3)',
                      borderRadius: 8,
                    }}
                  />
                </RePieChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Scores par domaine */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              style={{
                background: 'rgba(15,23,42,0.7)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: 24,
                padding: 24,
              }}
            >
              <h3 style={{ color: '#f8fafc', fontSize: '1.1rem', fontWeight: 600, marginBottom: 20 }}>
                Scores moyens par domaine
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <ReBarChart data={domainStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8' }} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8' }} />
                  <Tooltip
                    contentStyle={{
                      background: '#0f172a',
                      border: '1px solid rgba(99,102,241,0.3)',
                      borderRadius: 8,
                    }}
                  />
                  <Bar dataKey="score" fill="#6366f1" radius={[4, 4, 0, 0]}>
                    {domainStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </ReBarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* Activité horaire */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{
              background: 'rgba(15,23,42,0.7)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: 24,
              padding: 24,
            }}
          >
            <h3 style={{ color: '#f8fafc', fontSize: '1.1rem', fontWeight: 600, marginBottom: 20 }}>
              Activité par heure
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dailyActivity}>
                <defs>
                  <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="hour" tick={{ fill: '#94a3b8' }} />
                <YAxis tick={{ fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{
                    background: '#0f172a',
                    border: '1px solid rgba(99,102,241,0.3)',
                    borderRadius: 8,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="url(#activityGradient)"
                  name="Tentatives"
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Tableaux */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {/* Top utilisateurs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              style={{
                background: 'rgba(15,23,42,0.7)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: 24,
                padding: 24,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ color: '#f8fafc', fontSize: '1.1rem', fontWeight: 600 }}>
                  Top 10 utilisateurs
                </h3>
                <TrendingUp size={20} color="#6366f1" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {topUsers.map((user, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px',
                      background: 'rgba(255,255,255,0.02)',
                      borderRadius: 8,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: COLORS[index % COLORS.length],
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                      }}>
                        {index + 1}
                      </span>
                      <div>
                        <p style={{ color: '#f8fafc', fontWeight: 500 }}>{user.name}</p>
                        <p style={{ color: '#94a3b8', fontSize: '0.7rem' }}>{user.quizzes} quiz</p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ color: '#a5b4fc', fontWeight: 600 }}>{user.points} pts</p>
                      <p style={{ color: '#94a3b8', fontSize: '0.7rem' }}>{user.avgScore}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Quiz populaires */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              style={{
                background: 'rgba(15,23,42,0.7)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: 24,
                padding: 24,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ color: '#f8fafc', fontSize: '1.1rem', fontWeight: 600 }}>
                  Quiz les plus populaires
                </h3>
                <BookOpen size={20} color="#10b981" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {popularQuizzes.map((quiz, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px',
                      background: 'rgba(255,255,255,0.02)',
                      borderRadius: 8,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: COLORS[index % COLORS.length],
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                      }}>
                        {index + 1}
                      </span>
                      <div>
                        <p style={{ color: '#f8fafc', fontWeight: 500 }}>{quiz.title}</p>
                        <p style={{ color: '#94a3b8', fontSize: '0.7rem' }}>{quiz.attempts} tentatives</p>
                      </div>
                    </div>
                    <p style={{ color: '#a5b4fc', fontWeight: 600 }}>{quiz.avgScore}%</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Boutons d'export */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 16,
          marginTop: 32,
          padding: 24,
          background: 'rgba(15,23,42,0.5)',
          borderRadius: 16,
        }}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleExportPDF}
            disabled={exporting}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 24px',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 8,
              color: '#ef4444',
              cursor: exporting ? 'not-allowed' : 'pointer',
              opacity: exporting ? 0.7 : 1,
            }}
          >
            <FileText size={16} />
            {exporting ? 'Export...' : 'PDF'}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleExportExcel}
            disabled={exporting}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 24px',
              background: 'rgba(16,185,129,0.1)',
              border: '1px solid rgba(16,185,129,0.3)',
              borderRadius: 8,
              color: '#10b981',
              cursor: exporting ? 'not-allowed' : 'pointer',
              opacity: exporting ? 0.7 : 1,
            }}
          >
            <Download size={16} />
            {exporting ? 'Export...' : 'Excel'}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleExportCSV}
            disabled={exporting}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 24px',
              background: 'rgba(99,102,241,0.1)',
              border: '1px solid rgba(99,102,241,0.3)',
              borderRadius: 8,
              color: '#a5b4fc',
              cursor: exporting ? 'not-allowed' : 'pointer',
              opacity: exporting ? 0.7 : 1,
            }}
          >
            <Database size={16} />
            {exporting ? 'Export...' : 'JSON'}
          </motion.button>
        </div>
      </main>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

// Composant pour les cartes KPI
const KpiCard = ({ title, value, icon, color, trend }) => (
  <motion.div
    whileHover={{ y: -4 }}
    style={{
      background: 'rgba(15,23,42,0.7)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(99,102,241,0.2)',
      borderRadius: 20,
      padding: 20,
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
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
      {trend && (
        <span style={{
          padding: '4px 8px',
          background: 'rgba(16,185,129,0.1)',
          border: '1px solid #10b981',
          borderRadius: 12,
          color: '#10b981',
          fontSize: '0.7rem',
        }}>
          {trend}
        </span>
      )}
    </div>
    <div>
      <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#f8fafc', marginBottom: 2 }}>
        {value}
      </div>
      <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{title}</div>
    </div>
  </motion.div>
);

export default AdminReports;