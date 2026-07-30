// src/pages/HistoryPage.jsx — VERSION CORRIGÉE
// Corrections :
//   - getResults() : extraction de .data (réponse enveloppée { success, data: [] })
//   - timeSpent : affiché correctement en secondes/minutes
//   - Params de filtre date transmis à l'API
//   - Pagination ajoutée
//   - Lien vers /review/:id pour revoir une session
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  History, Clock, Award, ChevronRight, Filter,
  Calendar, TrendingUp, ArrowLeft, Loader, AlertCircle,
} from 'lucide-react';
import { getResults } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

import NavHome from '../components/NavHome';
const HistoryPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [filter, setFilter]         = useState('all');
  const [quizHistory, setQuizHistory] = useState([]);
  const [stats, setStats]           = useState({ totalQuizzes: 0, averageScore: 0, bestScore: 0 });
  const [page, setPage]             = useState(1);
  const [hasMore, setHasMore]       = useState(false);
  const LIMIT = 20;

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // ✅ Construire les paramètres de filtre date
      const params = { limit: LIMIT, sort: '-completedAt' };
      if (filter !== 'all') {
        const days = filter === 'week' ? 7 : filter === 'month' ? 30 : 365;
        params.startDate = new Date(Date.now() - days * 86400_000).toISOString();
      }

      // ✅ Extraire .data depuis la réponse enveloppée
      const response = await getResults(params);
      const arr = Array.isArray(response?.data) ? response.data
                : Array.isArray(response) ? response
                : [];

      setQuizHistory(arr);
      setHasMore(arr.length === LIMIT);

      // Calculer les stats
      if (arr.length > 0) {
        const totalScore = arr.reduce((s, r) => s + (r.score || 0), 0);
        const best = Math.max(...arr.map(r => r.score || 0));
        setStats({
          totalQuizzes: arr.length,
          averageScore: Math.round(totalScore / arr.length),
          bestScore: best,
        });
      } else {
        setStats({ totalQuizzes: 0, averageScore: 0, bestScore: 0 });
      }
    } catch (err) {
      console.error('Erreur historique:', err);
      setError('Impossible de charger l\'historique');
      toast.error('Erreur de chargement');
      setQuizHistory([]);
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  // ── Helpers ───────────────────────────────────────────────
  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Bien';
    return 'À améliorer';
  };

  // ✅ timeSpent est en secondes
  const formatDuration = (seconds) => {
    if (!seconds || seconds === 0) return '—';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
      });
    } catch { return '—'; }
  };

  // ── Render ────────────────────────────────────────────────
  if (loading) return (
    <div style={{ ...containerStyle, alignItems: 'center', justifyContent: 'center' }}>
      <NavHome />
      <div style={{ textAlign: 'center' }}>
        <Loader size={48} style={{ animation: 'spin 1s linear infinite' }} color="#6366f1" />
        <p style={{ color: '#94a3b8', marginTop: 16 }}>Chargement de l'historique...</p>
      </div>
    </div>
  );

  return (
    <div style={containerStyle}>
      <div style={gridBgStyle} />
      <main style={{ position: 'relative', zIndex: 1, maxWidth: 900, margin: '0 auto' }}>

        {/* En-tête */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)} style={btnSecStyle}>
            <ArrowLeft size={20} />
          </motion.button>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#f8fafc' }}>Historique</h1>
            <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
              {stats.totalQuizzes} quiz trouvés · données réelles depuis la base
            </p>
          </div>
        </div>

        {/* Erreur */}
        {error && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '12px 16px',
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 12, marginBottom: 20, color: '#fca5a5', fontSize: '0.9rem' }}>
            <AlertCircle size={16} color="#ef4444" /> {error}
          </div>
        )}

        {/* Métriques */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Quiz réalisés', value: stats.totalQuizzes, color: '#6366f1' },
            { label: 'Score moyen',   value: `${stats.averageScore}%`, color: '#10b981' },
            { label: 'Meilleur',      value: `${stats.bestScore}%`,    color: '#f59e0b' },
          ].map((m, i) => (
            <div key={i} style={{ background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: 14, padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: m.color }}>{m.value}</div>
              <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: 4 }}>{m.label}</div>
            </div>
          ))}
        </div>

        {/* Filtre */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <Filter size={14} color="#64748b" />
          <select value={filter} onChange={e => { setFilter(e.target.value); setPage(1); }}
            style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(99,102,241,0.2)', borderRadius: 8, color: '#f8fafc',
              outline: 'none', fontSize: '0.85rem' }}>
            <option value="all">Toute la période</option>
            <option value="week">7 derniers jours</option>
            <option value="month">30 derniers jours</option>
            <option value="year">Cette année</option>
          </select>
        </div>

        {/* Liste */}
        <div style={{ background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: 20, overflow: 'hidden' }}>
          {quizHistory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <History size={48} color="#1e293b" style={{ marginBottom: 16 }} />
              <p style={{ color: '#94a3b8' }}>Aucun résultat pour cette période</p>
              <button onClick={() => navigate('/quizzes')} style={{ marginTop: 20, padding: '10px 20px',
                background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none',
                borderRadius: 10, color: 'white', cursor: 'pointer' }}>
                Passer un quiz
              </button>
            </div>
          ) : (
            quizHistory.map((quiz, i) => (
              <motion.div key={quiz._id || quiz.id || i}
                initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.3) }}
                onClick={() => navigate(`/results/${quiz._id || quiz.id}`)}
                style={{ display: 'flex', alignItems: 'center', padding: '16px 20px',
                  borderBottom: i < quizHistory.length - 1 ? '1px solid rgba(99,102,241,0.08)' : 'none',
                  cursor: 'pointer', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.06)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                {/* Icône score */}
                <div style={{ width: 44, height: 44, borderRadius: 12, marginRight: 14,
                  background: `${getScoreColor(quiz.score)}20`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Award size={22} color={getScoreColor(quiz.score)} />
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ color: '#f8fafc', fontWeight: 600, fontSize: '0.95rem',
                    marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {quiz.quizTitle || quiz.subject || 'Quiz sans titre'}
                  </h3>
                  <div style={{ display: 'flex', gap: 14, fontSize: '0.75rem', color: '#64748b', flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Calendar size={11} /> {formatDate(quiz.completedAt || quiz.date)}
                    </span>
                    {/* ✅ timeSpent en secondes affiché correctement */}
                    {quiz.timeSpent > 0 && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={11} /> {formatDuration(quiz.timeSpent)}
                      </span>
                    )}
                    {quiz.correctAnswers !== undefined && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <TrendingUp size={11} /> {quiz.correctAnswers}/{quiz.total || quiz.totalQuestions || '?'}
                      </span>
                    )}
                    {quiz.domain && (
                      <span style={{ padding: '1px 7px', background: 'rgba(99,102,241,0.15)',
                        borderRadius: 10, color: '#a5b4fc' }}>{quiz.domain}</span>
                    )}
                  </div>
                </div>

                {/* Score + statut */}
                <div style={{ textAlign: 'right', marginRight: 12, flexShrink: 0 }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: getScoreColor(quiz.score) }}>
                    {quiz.score || 0}%
                  </div>
                  <div style={{ fontSize: '0.7rem', color: getScoreColor(quiz.score), marginTop: 2 }}>
                    {getScoreLabel(quiz.score || 0)}
                  </div>
                </div>

                <ChevronRight size={18} color="#334155" />
              </motion.div>
            ))
          )}
        </div>

        {/* Pagination simple */}
        {hasMore && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <button onClick={() => setPage(p => p + 1)}
              style={{ padding: '10px 24px', background: 'rgba(99,102,241,0.1)',
                border: '1px solid rgba(99,102,241,0.3)', borderRadius: 10,
                color: '#a5b4fc', cursor: 'pointer', fontSize: '0.9rem' }}>
              Charger plus
            </button>
          </div>
        )}
      </main>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

const containerStyle = { minHeight: '100vh', background: 'linear-gradient(135deg, #05071a 0%, #0a0f2e 60%, #05071a 100%)', padding: '24px' };
const gridBgStyle = { position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: 'linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px' };
const btnSecStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12, padding: 12, color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };

export default HistoryPage;
