// src/pages/Formateur/FormateurQuizzes.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Plus, Search, Filter, Edit2, Trash2,
  Eye, Copy, CheckCircle, XCircle, Clock, Users,
  Star, MessageCircle, BarChart2, Download, Upload,
  RefreshCw, AlertTriangle, BookOpen, Settings
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  getQuizzes,
  deleteQuiz,
  updateQuiz
} from '../../services/api';
import toast from 'react-hot-toast';

import NavHome from '../../components/NavHome';
const FormateurQuizzes = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [quizzes, setQuizzes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);

  useEffect(() => {
    if (!['formateur', 'admin', 'superadmin'].includes(user?.role)) {
      toast.error('Accès non autorisé');
      navigate('/');
      return;
    }
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const data = await getQuizzes({ 
        createdBy: user.id || user._id,
        limit: 100
      });
      
      const quizzesArray = Array.isArray(data) ? data : 
                          (data?.data ? (Array.isArray(data.data) ? data.data : []) : []);
      
      setQuizzes(quizzesArray);
    } catch (error) {
      console.error('Erreur chargement quiz:', error);
      toast.error('Impossible de charger vos quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedQuiz) return;
    
    try {
      await deleteQuiz(selectedQuiz.id);
      toast.success('Quiz supprimé avec succès');
      setShowDeleteModal(false);
      fetchQuizzes();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleTogglePublish = async (quiz) => {
    try {
      await updateQuiz(quiz.id, { isPublished: !quiz.isPublished });
      toast.success(quiz.isPublished ? 'Quiz dépublié' : 'Quiz publié');
      fetchQuizzes();
    } catch (error) {
      toast.error('Erreur lors de la modification');
    }
  };

  const handleDuplicate = async (quiz) => {
    try {
      await duplicateQuiz(quiz.id);
      toast.success('Quiz dupliqué avec succès');
      fetchQuizzes();
    } catch (error) {
      toast.error('Erreur lors de la duplication');
    }
  };

  const handleExport = async (quiz) => {
    try {
      await exportQuiz(quiz.id);
      toast.success('Quiz exporté avec succès');
    } catch (error) {
      toast.error('Erreur lors de l\'export');
    }
  };

  const filteredQuizzes = quizzes.filter(quiz => {
    const matchesSearch = quiz.title?.toLowerCase().includes(searchTerm.toLowerCase());
    if (filter === 'all') return matchesSearch;
    if (filter === 'published') return matchesSearch && quiz.isPublished;
    if (filter === 'draft') return matchesSearch && !quiz.isPublished;
    return matchesSearch;
  });

  const stats = {
    total: quizzes.length,
    published: quizzes.filter(q => q.isPublished).length,
    draft: quizzes.filter(q => !q.isPublished).length,
    totalAttempts: quizzes.reduce((sum, q) => sum + (q.attempts || 0), 0)
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
          <RefreshCw size={48} className="animate-spin" color="#10b981" />
          <p style={{ color: '#94a3b8', marginTop: 16 }}>Chargement de vos quiz...</p>
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

      <main style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto' }}>
        {/* En-tête */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
          <motion.button
            whileHover={{ scale: 1.05 }}
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
            }}
          >
            <ArrowLeft size={20} />
          </motion.button>

          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#f8fafc' }}>
              Mes Quiz
            </h1>
            <p style={{ color: '#94a3b8' }}>
              Gérez tous vos quiz créés
            </p>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
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

        {/* Statistiques rapides */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16,
          marginBottom: 24,
        }}>
          <div style={{
            background: 'rgba(16,185,129,0.1)',
            border: '1px solid rgba(16,185,129,0.2)',
            borderRadius: 12,
            padding: 16,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981' }}>{stats.total}</div>
            <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Total quiz</div>
          </div>
          <div style={{
            background: 'rgba(99,102,241,0.1)',
            border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: 12,
            padding: 16,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#6366f1' }}>{stats.published}</div>
            <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Publiés</div>
          </div>
          <div style={{
            background: 'rgba(245,158,11,0.1)',
            border: '1px solid rgba(245,158,11,0.2)',
            borderRadius: 12,
            padding: 16,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f59e0b' }}>{stats.draft}</div>
            <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Brouillons</div>
          </div>
          <div style={{
            background: 'rgba(139,92,246,0.1)',
            border: '1px solid rgba(139,92,246,0.2)',
            borderRadius: 12,
            padding: 16,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#8b5cf6' }}>{stats.totalAttempts}</div>
            <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Tentatives</div>
          </div>
        </div>

        {/* Barre de recherche et filtres */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          marginBottom: 24,
        }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#64748b',
            }} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher un quiz..."
              style={{
                width: '100%',
                padding: '12px 12px 12px 42px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(16,185,129,0.2)',
                borderRadius: 12,
                color: '#f8fafc',
                outline: 'none',
              }}
            />
          </div>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              padding: '12px 16px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(16,185,129,0.2)',
              borderRadius: 12,
              color: '#f8fafc',
              outline: 'none',
            }}
          >
            <option value="all">Tous les quiz</option>
            <option value="published">Publiés</option>
            <option value="draft">Brouillons</option>
          </select>
        </div>

        {/* Liste des quiz */}
        <div style={{
          background: 'rgba(15,23,42,0.7)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(16,185,129,0.2)',
          borderRadius: 24,
          overflow: 'hidden',
        }}>
          {filteredQuizzes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <BookOpen size={48} color="#1e293b" style={{ marginBottom: 16 }} />
              <p style={{ color: '#94a3b8' }}>Aucun quiz trouvé</p>
              <p style={{ color: '#64748b', fontSize: '0.8rem', marginTop: 8 }}>
                {searchTerm ? 'Essayez d\'autres termes' : 'Créez votre premier quiz !'}
              </p>
            </div>
          ) : (
            filteredQuizzes.map((quiz) => (
              <motion.div
                key={quiz.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '20px',
                  borderBottom: '1px solid rgba(16,185,129,0.1)',
                }}
                whileHover={{ background: 'rgba(16,185,129,0.05)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: quiz.isPublished ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: quiz.isPublished ? '#10b981' : '#f59e0b',
                  }}>
                    {quiz.isPublished ? <CheckCircle size={24} /> : <Clock size={24} />}
                  </div>

                  <div>
                    <h3 style={{ color: '#f8fafc', fontWeight: 600, marginBottom: 4 }}>
                      {quiz.title}
                    </h3>
                    <div style={{ display: 'flex', gap: 16, fontSize: '0.7rem', color: '#94a3b8' }}>
                      <span>{quiz.questions?.length || 0} questions</span>
                      <span>{quiz.attempts || 0} tentatives</span>
                      <span>{quiz.likes || 0} likes</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => navigate(`/formateur/quiz/${quiz.id}`)}
                    style={{
                      padding: 8,
                      background: 'rgba(99,102,241,0.1)',
                      border: '1px solid rgba(99,102,241,0.3)',
                      borderRadius: 8,
                      color: '#a5b4fc',
                      cursor: 'pointer',
                    }}
                    title="Voir"
                  >
                    <Eye size={16} />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => navigate(`/edit-quiz/${quiz.id}`)}
                    style={{
                      padding: 8,
                      background: 'rgba(16,185,129,0.1)',
                      border: '1px solid rgba(16,185,129,0.3)',
                      borderRadius: 8,
                      color: '#10b981',
                      cursor: 'pointer',
                    }}
                    title="Modifier"
                  >
                    <Edit2 size={16} />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleDuplicate(quiz)}
                    style={{
                      padding: 8,
                      background: 'rgba(139,92,246,0.1)',
                      border: '1px solid rgba(139,92,246,0.3)',
                      borderRadius: 8,
                      color: '#8b5cf6',
                      cursor: 'pointer',
                    }}
                    title="Dupliquer"
                  >
                    <Copy size={16} />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleTogglePublish(quiz)}
                    style={{
                      padding: 8,
                      background: quiz.isPublished ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
                      border: `1px solid ${quiz.isPublished ? '#f59e0b' : '#10b981'}30`,
                      borderRadius: 8,
                      color: quiz.isPublished ? '#f59e0b' : '#10b981',
                      cursor: 'pointer',
                    }}
                    title={quiz.isPublished ? 'Dépublier' : 'Publier'}
                  >
                    {quiz.isPublished ? <XCircle size={16} /> : <CheckCircle size={16} />}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setSelectedQuiz(quiz);
                      setShowDeleteModal(true);
                    }}
                    style={{
                      padding: 8,
                      background: 'rgba(239,68,68,0.1)',
                      border: '1px solid rgba(239,68,68,0.3)',
                      borderRadius: 8,
                      color: '#ef4444',
                      cursor: 'pointer',
                    }}
                    title="Supprimer"
                  >
                    <Trash2 size={16} />
                  </motion.button>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Modal de confirmation de suppression */}
        <AnimatePresence>
          {showDeleteModal && selectedQuiz && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.7)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
              }}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                style={{
                  background: 'rgba(15,23,42,0.95)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: 24,
                  padding: 32,
                  maxWidth: 400,
                  width: '90%',
                  textAlign: 'center',
                }}
              >
                <AlertTriangle size={48} color="#ef4444" style={{ marginBottom: 16 }} />
                <h2 style={{ color: '#f8fafc', fontSize: '1.2rem', fontWeight: 600, marginBottom: 8 }}>
                  Supprimer le quiz
                </h2>
                <p style={{ color: '#94a3b8', marginBottom: 24 }}>
                  Êtes-vous sûr de vouloir supprimer "{selectedQuiz.title}" ?
                </p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    style={{
                      padding: '10px 20px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(99,102,241,0.2)',
                      borderRadius: 8,
                      color: '#94a3b8',
                      cursor: 'pointer',
                    }}
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleDelete}
                    style={{
                      padding: '10px 24px',
                      background: 'rgba(239,68,68,0.1)',
                      border: '1px solid #ef4444',
                      borderRadius: 8,
                      color: '#ef4444',
                      cursor: 'pointer',
                    }}
                  >
                    Supprimer
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
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

export default FormateurQuizzes;