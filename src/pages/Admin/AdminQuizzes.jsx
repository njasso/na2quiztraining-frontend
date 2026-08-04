// src/pages/Admin/AdminQuizzes.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Search, Filter, MoreVertical, Edit2, Trash2,
  Plus, BookOpen, Users, Award, Clock, Star,
  ChevronLeft, ChevronRight, Download, Upload, RefreshCw,
  CheckCircle, XCircle, AlertTriangle, Eye, Copy,
  Globe, Lock, Calendar, BarChart2, MessageCircle,
  ThumbsUp, FileText, Image, Link, Settings, Share2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  getQuizzes,
  deleteQuiz,
  updateQuiz,
  getQuizById,
  getQuizComments,
  likeQuiz,
  unlikeQuiz,
  exportData,
  importData
} from '../../services/api';
import toast from 'react-hot-toast';

import NavHome from '../../components/NavHome';
const AdminQuizzes = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // États
  const [loading, setLoading] = useState(true);
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  
  // Filtres et pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [quizzesPerPage] = useState(10);
  const [totalQuizzes, setTotalQuizzes] = useState(0);
  const [selectedQuizzes, setSelectedQuizzes] = useState([]);
  
  // Statistiques
  const [quizStats, setQuizStats] = useState({
    totalAttempts: 0,
    averageScore: 0,
    totalComments: 0,
    totalLikes: 0,
    completionRate: 0
  });

  // Formulaire d'édition
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    category: '',
    difficulty: 'Moyen',
    questions: [],
    timeLimit: 30,
    passingScore: 60,
    isPublic: true,
    isPublished: false,
    tags: [],
    image: '',
    author: '',
    domain: '',
    niveau: ''
  });

  // Commentaires
  const [comments, setComments] = useState([]);

  useEffect(() => {
    // CORRECTION : le role 'superadmin' etait exclu (meme bug que Navbar.jsx) —
    // un superadmin se faisait rejeter de cette page malgre des droits superieurs.
    if (!['admin', 'superadmin'].includes(user?.role)) {
      toast.error('Accès non autorisé');
      navigate('/');
      return;
    }
    fetchQuizzes();
  }, [currentPage, searchTerm, categoryFilter, statusFilter, difficultyFilter]);

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const data = await getQuizzes({
        page: currentPage,
        limit: quizzesPerPage,
        search: searchTerm,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        difficulty: difficultyFilter !== 'all' ? difficultyFilter : undefined
      });
      
      // Adapter selon la structure des données
      const quizzesList = Array.isArray(data) ? data : data?.quizzes || [];
      const total = Array.isArray(data) ? data.length : data?.total || quizzesList.length;
      
      setQuizzes(quizzesList);
      setTotalQuizzes(total);

      // Calculer les statistiques
      if (quizzesList.length > 0) {
        const stats = {
          totalAttempts: quizzesList.reduce((sum, q) => sum + (q.attempts || 0), 0),
          averageScore: Math.round(quizzesList.reduce((sum, q) => sum + (q.avgScore || 0), 0) / quizzesList.length),
          totalComments: quizzesList.reduce((sum, q) => sum + (q.commentsCount || 0), 0),
          totalLikes: quizzesList.reduce((sum, q) => sum + (q.likes || 0), 0),
          completionRate: Math.round(quizzesList.filter(q => q.completed).length / quizzesList.length * 100) || 0
        };
        setQuizStats(stats);
      }

    } catch (error) {
      console.error('Erreur chargement quiz:', error);
      toast.error('Impossible de charger les quiz');
      setQuizzes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewQuiz = async (quiz) => {
    setSelectedQuiz(quiz);
    try {
      const fullQuiz = await getQuizById(quiz.id || quiz._id);
      setEditForm({
        title: fullQuiz.title || '',
        description: fullQuiz.description || '',
        category: fullQuiz.category || '',
        difficulty: fullQuiz.difficulty || 'Moyen',
        questions: fullQuiz.questions || [],
        timeLimit: fullQuiz.timeLimit || 30,
        passingScore: fullQuiz.passingScore || 60,
        isPublic: fullQuiz.isPublic !== false,
        isPublished: fullQuiz.isPublished || false,
        tags: fullQuiz.tags || [],
        image: fullQuiz.image || '',
        author: fullQuiz.author || '',
        domain: fullQuiz.domain || '',
        niveau: fullQuiz.niveau || ''
      });
      setShowQuizModal(true);
    } catch (error) {
      toast.error('Erreur chargement du quiz');
    }
  };

  const handleEditQuiz = (quiz) => {
    setSelectedQuiz(quiz);
    setEditForm({
      title: quiz.title || '',
      description: quiz.description || '',
      category: quiz.category || '',
      difficulty: quiz.difficulty || 'Moyen',
      questions: quiz.questions || [],
      timeLimit: quiz.timeLimit || 30,
      passingScore: quiz.passingScore || 60,
      isPublic: quiz.isPublic !== false,
      isPublished: quiz.isPublished || false,
      tags: quiz.tags || [],
      image: quiz.image || '',
      author: quiz.author || '',
      domain: quiz.domain || '',
      niveau: quiz.niveau || ''
    });
    setShowQuizModal(true);
  };

  const handleSaveQuiz = async () => {
    try {
      await updateQuiz(selectedQuiz.id || selectedQuiz._id, editForm);
      toast.success('Quiz mis à jour avec succès');
      setShowQuizModal(false);
      fetchQuizzes();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleDeleteQuiz = async () => {
    try {
      await deleteQuiz(selectedQuiz.id || selectedQuiz._id);
      toast.success('Quiz supprimé avec succès');
      setShowDeleteModal(false);
      fetchQuizzes();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleViewComments = async (quiz) => {
    setSelectedQuiz(quiz);
    try {
      const data = await getQuizComments(quiz.id || quiz._id);
      setComments(Array.isArray(data) ? data : []);
      setShowCommentsModal(true);
    } catch (error) {
      toast.error('Erreur chargement des commentaires');
    }
  };

  const handleTogglePublish = async (quiz) => {
    try {
      await updateQuiz(quiz.id || quiz._id, { isPublished: !quiz.isPublished });
      toast.success(quiz.isPublished ? 'Quiz dépublié' : 'Quiz publié');
      fetchQuizzes();
    } catch (error) {
      toast.error('Erreur lors de la modification');
    }
  };

  const handleTogglePublic = async (quiz) => {
    try {
      await updateQuiz(quiz.id || quiz._id, { isPublic: !quiz.isPublic });
      toast.success(quiz.isPublic ? 'Quiz rendu privé' : 'Quiz rendu public');
      fetchQuizzes();
    } catch (error) {
      toast.error('Erreur lors de la modification');
    }
  };

  const handleDuplicateQuiz = async (quiz) => {
    try {
      const newQuiz = {
        ...quiz,
        title: `${quiz.title} (copie)`,
        isPublished: false
      };
      delete newQuiz.id;
      delete newQuiz._id;
      
      await createQuiz(newQuiz);
      toast.success('Quiz dupliqué avec succès');
      fetchQuizzes();
    } catch (error) {
      toast.error('Erreur lors de la duplication');
    }
  };

  const handleExportQuizzes = async () => {
    try {
      const data = await exportData('quizzes', 'json');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quizzes-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      toast.success('Export réussi');
    } catch (error) {
      toast.error('Erreur lors de l\'export');
    }
  };

  const handleImportQuizzes = async (file) => {
    try {
      await importData('quizzes', file);
      toast.success('Import réussi');
      setShowImportModal(false);
      fetchQuizzes();
    } catch (error) {
      toast.error('Erreur lors de l\'import');
    }
  };

  const handleToggleSelect = (quizId) => {
    setSelectedQuizzes(prev =>
      prev.includes(quizId)
        ? prev.filter(id => id !== quizId)
        : [...prev, quizId]
    );
  };

  const handleSelectAll = () => {
    if (selectedQuizzes.length === quizzes.length) {
      setSelectedQuizzes([]);
    } else {
      setSelectedQuizzes(quizzes.map(q => q.id || q._id));
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedQuizzes.length === 0) {
      toast.error('Sélectionnez des quiz');
      return;
    }

    if (action === 'delete') {
      if (!window.confirm(`Supprimer ${selectedQuizzes.length} quiz ?`)) return;
      
      try {
        await Promise.all(selectedQuizzes.map(id => deleteQuiz(id)));
        toast.success(`${selectedQuizzes.length} quiz supprimés`);
        setSelectedQuizzes([]);
        fetchQuizzes();
      } catch (error) {
        toast.error('Erreur lors de la suppression');
      }
    }

    if (action === 'publish') {
      try {
        await Promise.all(selectedQuizzes.map(id => updateQuiz(id, { isPublished: true })));
        toast.success(`${selectedQuizzes.length} quiz publiés`);
        setSelectedQuizzes([]);
        fetchQuizzes();
      } catch (error) {
        toast.error('Erreur lors de la publication');
      }
    }

    if (action === 'unpublish') {
      try {
        await Promise.all(selectedQuizzes.map(id => updateQuiz(id, { isPublished: false })));
        toast.success(`${selectedQuizzes.length} quiz dépubliés`);
        setSelectedQuizzes([]);
        fetchQuizzes();
      } catch (error) {
        toast.error('Erreur lors de la dépublication');
      }
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch(difficulty?.toLowerCase()) {
      case 'facile': return '#10b981';
      case 'moyen': return '#f59e0b';
      case 'difficile': return '#ef4444';
      case 'expert': return '#8b5cf6';
      default: return '#64748b';
    }
  };

  const getStatusBadge = (quiz) => {
    if (quiz.isPublished) {
      return { bg: 'rgba(16,185,129,0.1)', color: '#10b981', text: 'Publié', icon: <CheckCircle size={12} /> };
    }
    return { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', text: 'Brouillon', icon: <Clock size={12} /> };
  };

  const getVisibilityBadge = (quiz) => {
    if (quiz.isPublic) {
      return { bg: 'rgba(99,102,241,0.1)', color: '#6366f1', text: 'Public', icon: <Globe size={12} /> };
    }
    return { bg: 'rgba(100,116,139,0.1)', color: '#64748b', text: 'Privé', icon: <Lock size={12} /> };
  };

  const totalPages = Math.ceil(totalQuizzes / quizzesPerPage);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #05071a 0%, #0a0f2e 60%, #05071a 100%)',
      position: 'relative',
      padding: '24px',
    }}>
      <NavHome />
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
                Gestion des Quiz
              </h1>
              <p style={{ color: '#94a3b8' }}>
                {totalQuizzes} quiz au total
              </p>
            </div>
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
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                border: 'none',
                borderRadius: 12,
                color: 'white',
                cursor: 'pointer',
              }}
            >
              <Plus size={16} />
              Nouveau quiz
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowImportModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 20px',
                background: 'rgba(16,185,129,0.1)',
                border: '1px solid rgba(16,185,129,0.3)',
                borderRadius: 12,
                color: '#10b981',
                cursor: 'pointer',
              }}
            >
              <Upload size={16} />
              Importer
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleExportQuizzes}
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
              <Download size={16} />
              Exporter
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={fetchQuizzes}
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
              <RefreshCw size={16} />
              Rafraîchir
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
          <StatsCard
            title="Tentatives"
            value={quizStats.totalAttempts}
            icon={<Users size={20} />}
            color="#6366f1"
          />
          <StatsCard
            title="Score moyen"
            value={`${quizStats.averageScore}%`}
            icon={<Award size={20} />}
            color="#10b981"
          />
          <StatsCard
            title="Commentaires"
            value={quizStats.totalComments}
            icon={<MessageCircle size={20} />}
            color="#f59e0b"
          />
          <StatsCard
            title="Likes"
            value={quizStats.totalLikes}
            icon={<ThumbsUp size={20} />}
            color="#8b5cf6"
          />
          <StatsCard
            title="Taux complétion"
            value={`${quizStats.completionRate}%`}
            icon={<CheckCircle size={20} />}
            color="#ec4899"
          />
        </div>

        {/* Barre de recherche et filtres */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          marginBottom: 24,
          flexWrap: 'wrap',
        }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 300 }}>
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
                border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: 12,
                color: '#f8fafc',
                outline: 'none',
              }}
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              padding: '12px 16px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: 12,
              color: '#f8fafc',
              outline: 'none',
            }}
          >
            <option value="all">Toutes catégories</option>
            <option value="maths">Mathématiques</option>
            <option value="sciences">Sciences</option>
            <option value="francais">Français</option>
            <option value="histoire">Histoire</option>
            <option value="anglais">Anglais</option>
          </select>

          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            style={{
              padding: '12px 16px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: 12,
              color: '#f8fafc',
              outline: 'none',
            }}
          >
            <option value="all">Toutes difficultés</option>
            <option value="facile">Facile</option>
            <option value="moyen">Moyen</option>
            <option value="difficile">Difficile</option>
            <option value="expert">Expert</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '12px 16px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: 12,
              color: '#f8fafc',
              outline: 'none',
            }}
          >
            <option value="all">Tous statuts</option>
            <option value="published">Publiés</option>
            <option value="draft">Brouillons</option>
          </select>

          {selectedQuizzes.length > 0 && (
            <div style={{ display: 'flex', gap: 8 }}>
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                onClick={() => handleBulkAction('publish')}
                style={{
                  padding: '12px 20px',
                  background: 'rgba(16,185,129,0.1)',
                  border: '1px solid rgba(16,185,129,0.3)',
                  borderRadius: 12,
                  color: '#10b981',
                  cursor: 'pointer',
                }}
              >
                Publier ({selectedQuizzes.length})
              </motion.button>
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                onClick={() => handleBulkAction('unpublish')}
                style={{
                  padding: '12px 20px',
                  background: 'rgba(245,158,11,0.1)',
                  border: '1px solid rgba(245,158,11,0.3)',
                  borderRadius: 12,
                  color: '#f59e0b',
                  cursor: 'pointer',
                }}
              >
                Dépublier ({selectedQuizzes.length})
              </motion.button>
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                onClick={() => handleBulkAction('delete')}
                style={{
                  padding: '12px 20px',
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: 12,
                  color: '#ef4444',
                  cursor: 'pointer',
                }}
              >
                Supprimer ({selectedQuizzes.length})
              </motion.button>
            </div>
          )}
        </div>

        {/* Tableau des quiz */}
        <div style={{
          background: 'rgba(15,23,42,0.7)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: 24,
          overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(99,102,241,0.2)' }}>
                <th style={{ padding: '16px', width: '40px' }}>
                  <input
                    type="checkbox"
                    checked={selectedQuizzes.length === quizzes.length && quizzes.length > 0}
                    onChange={handleSelectAll}
                    style={{ accentColor: '#6366f1', width: 18, height: 18 }}
                  />
                </th>
                <th style={{ padding: '16px', textAlign: 'left', color: '#94a3b8' }}>Titre</th>
                <th style={{ padding: '16px', textAlign: 'left', color: '#94a3b8' }}>Catégorie</th>
                <th style={{ padding: '16px', textAlign: 'left', color: '#94a3b8' }}>Difficulté</th>
                <th style={{ padding: '16px', textAlign: 'left', color: '#94a3b8' }}>Statut</th>
                <th style={{ padding: '16px', textAlign: 'left', color: '#94a3b8' }}>Visibilité</th>
                <th style={{ padding: '16px', textAlign: 'left', color: '#94a3b8' }}>Questions</th>
                <th style={{ padding: '16px', textAlign: 'left', color: '#94a3b8' }}>Tentatives</th>
                <th style={{ padding: '16px', textAlign: 'center', color: '#94a3b8' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" style={{ padding: '60px', textAlign: 'center' }}>
                    <RefreshCw size={32} className="animate-spin" color="#6366f1" />
                    <p style={{ color: '#94a3b8', marginTop: 16 }}>Chargement des quiz...</p>
                  </td>
                </tr>
              ) : quizzes.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ padding: '60px', textAlign: 'center' }}>
                    <BookOpen size={48} color="#1e293b" />
                    <p style={{ color: '#94a3b8', marginTop: 16 }}>Aucun quiz trouvé</p>
                  </td>
                </tr>
              ) : (
                quizzes.map((quiz) => {
                  const statusBadge = getStatusBadge(quiz);
                  const visibilityBadge = getVisibilityBadge(quiz);
                  const difficultyColor = getDifficultyColor(quiz.difficulty);
                  
                  return (
                    <motion.tr
                      key={quiz.id || quiz._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      style={{
                        borderBottom: '1px solid rgba(99,102,241,0.1)',
                        cursor: 'pointer',
                      }}
                      whileHover={{ background: 'rgba(99,102,241,0.05)' }}
                    >
                      <td style={{ padding: '16px' }} onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedQuizzes.includes(quiz.id || quiz._id)}
                          onChange={() => handleToggleSelect(quiz.id || quiz._id)}
                          style={{ accentColor: '#6366f1', width: 18, height: 18 }}
                        />
                      </td>
                      <td style={{ padding: '16px' }} onClick={() => handleViewQuiz(quiz)}>
                        <div>
                          <p style={{ color: '#f8fafc', fontWeight: 600 }}>{quiz.title}</p>
                          <p style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                            {quiz.description?.substring(0, 50)}...
                          </p>
                        </div>
                      </td>
                      <td style={{ padding: '16px', color: '#f8fafc' }}>
                        {quiz.category || quiz.domain || 'Général'}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          padding: '4px 8px',
                          background: `${difficultyColor}20`,
                          border: `1px solid ${difficultyColor}`,
                          borderRadius: 12,
                          color: difficultyColor,
                          fontSize: '0.7rem',
                        }}>
                          {quiz.difficulty || 'Moyen'}
                        </span>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '4px 8px',
                          background: statusBadge.bg,
                          border: `1px solid ${statusBadge.color}30`,
                          borderRadius: 12,
                          color: statusBadge.color,
                          fontSize: '0.7rem',
                        }}>
                          {statusBadge.icon}
                          {statusBadge.text}
                        </span>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '4px 8px',
                          background: visibilityBadge.bg,
                          border: `1px solid ${visibilityBadge.color}30`,
                          borderRadius: 12,
                          color: visibilityBadge.color,
                          fontSize: '0.7rem',
                        }}>
                          {visibilityBadge.icon}
                          {visibilityBadge.text}
                        </span>
                      </td>
                      <td style={{ padding: '16px', color: '#f8fafc' }}>
                        {quiz.questions?.length || 0}
                      </td>
                      <td style={{ padding: '16px', color: '#f8fafc' }}>
                        {quiz.attempts || 0}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditQuiz(quiz);
                            }}
                            style={{
                              padding: 6,
                              background: 'rgba(99,102,241,0.1)',
                              border: '1px solid rgba(99,102,241,0.3)',
                              borderRadius: 6,
                              color: '#a5b4fc',
                              cursor: 'pointer',
                            }}
                            title="Modifier"
                          >
                            <Edit2 size={14} />
                          </motion.button>
                          
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewComments(quiz);
                            }}
                            style={{
                              padding: 6,
                              background: 'rgba(16,185,129,0.1)',
                              border: '1px solid rgba(16,185,129,0.3)',
                              borderRadius: 6,
                              color: '#10b981',
                              cursor: 'pointer',
                            }}
                            title="Commentaires"
                          >
                            <MessageCircle size={14} />
                          </motion.button>

                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTogglePublish(quiz);
                            }}
                            style={{
                              padding: 6,
                              background: quiz.isPublished ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
                              border: `1px solid ${quiz.isPublished ? '#f59e0b' : '#10b981'}30`,
                              borderRadius: 6,
                              color: quiz.isPublished ? '#f59e0b' : '#10b981',
                              cursor: 'pointer',
                            }}
                            title={quiz.isPublished ? 'Dépublier' : 'Publier'}
                          >
                            {quiz.isPublished ? <XCircle size={14} /> : <CheckCircle size={14} />}
                          </motion.button>

                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDuplicateQuiz(quiz);
                            }}
                            style={{
                              padding: 6,
                              background: 'rgba(139,92,246,0.1)',
                              border: '1px solid rgba(139,92,246,0.3)',
                              borderRadius: 6,
                              color: '#8b5cf6',
                              cursor: 'pointer',
                            }}
                            title="Dupliquer"
                          >
                            <Copy size={14} />
                          </motion.button>

                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedQuiz(quiz);
                              setShowDeleteModal(true);
                            }}
                            style={{
                              padding: 6,
                              background: 'rgba(239,68,68,0.1)',
                              border: '1px solid rgba(239,68,68,0.3)',
                              borderRadius: 6,
                              color: '#ef4444',
                              cursor: 'pointer',
                            }}
                            title="Supprimer"
                          >
                            <Trash2 size={14} />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 16,
            marginTop: 24,
          }}>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{
                padding: '8px 16px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: 8,
                color: currentPage === 1 ? '#4b5563' : '#94a3b8',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                opacity: currentPage === 1 ? 0.5 : 1,
              }}
            >
              <ChevronLeft size={16} />
            </button>
            <span style={{ color: '#94a3b8' }}>
              Page {currentPage} sur {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{
                padding: '8px 16px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: 8,
                color: currentPage === totalPages ? '#4b5563' : '#94a3b8',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                opacity: currentPage === totalPages ? 0.5 : 1,
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </main>

      {/* MODAL ÉDITION QUIZ */}
      <AnimatePresence>
        {showQuizModal && (
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
              overflowY: 'auto',
              padding: '20px',
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              style={{
                background: 'rgba(15,23,42,0.95)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(99,102,241,0.3)',
                borderRadius: 24,
                padding: 32,
                maxWidth: 600,
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
              }}
            >
              <h2 style={{ color: '#f8fafc', fontSize: '1.2rem', fontWeight: 600, marginBottom: 20 }}>
                {selectedQuiz ? 'Modifier le quiz' : 'Créer un quiz'}
              </h2>

              <div style={{ display: 'grid', gap: 16 }}>
                <div>
                  <label style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'block', marginBottom: 4 }}>
                    Titre
                  </label>
                  <input
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    style={{
                      width: '100%',
                      padding: 10,
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(99,102,241,0.2)',
                      borderRadius: 8,
                      color: '#f8fafc',
                    }}
                  />
                </div>

                <div>
                  <label style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'block', marginBottom: 4 }}>
                    Description
                  </label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: 10,
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(99,102,241,0.2)',
                      borderRadius: 8,
                      color: '#f8fafc',
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'block', marginBottom: 4 }}>
                      Catégorie
                    </label>
                    <select
                      value={editForm.category}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      style={{
                        width: '100%',
                        padding: 10,
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(99,102,241,0.2)',
                        borderRadius: 8,
                        color: '#f8fafc',
                      }}
                    >
                      <option value="">Sélectionner</option>
                      <option value="maths">Mathématiques</option>
                      <option value="sciences">Sciences</option>
                      <option value="francais">Français</option>
                      <option value="histoire">Histoire</option>
                      <option value="anglais">Anglais</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'block', marginBottom: 4 }}>
                      Difficulté
                    </label>
                    <select
                      value={editForm.difficulty}
                      onChange={(e) => setEditForm({ ...editForm, difficulty: e.target.value })}
                      style={{
                        width: '100%',
                        padding: 10,
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(99,102,241,0.2)',
                        borderRadius: 8,
                        color: '#f8fafc',
                      }}
                    >
                      <option value="Facile">Facile</option>
                      <option value="Moyen">Moyen</option>
                      <option value="Difficile">Difficile</option>
                      <option value="Expert">Expert</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'block', marginBottom: 4 }}>
                      Temps limite (minutes)
                    </label>
                    <input
                      type="number"
                      value={editForm.timeLimit}
                      onChange={(e) => setEditForm({ ...editForm, timeLimit: parseInt(e.target.value) })}
                      style={{
                        width: '100%',
                        padding: 10,
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(99,102,241,0.2)',
                        borderRadius: 8,
                        color: '#f8fafc',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'block', marginBottom: 4 }}>
                      Score de passage (%)
                    </label>
                    <input
                      type="number"
                      value={editForm.passingScore}
                      onChange={(e) => setEditForm({ ...editForm, passingScore: parseInt(e.target.value) })}
                      style={{
                        width: '100%',
                        padding: 10,
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(99,102,241,0.2)',
                        borderRadius: 8,
                        color: '#f8fafc',
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 24, marginTop: 8 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={editForm.isPublic}
                      onChange={(e) => setEditForm({ ...editForm, isPublic: e.target.checked })}
                      style={{ accentColor: '#6366f1', width: 16, height: 16 }}
                    />
                    <span style={{ color: '#f8fafc' }}>Public</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={editForm.isPublished}
                      onChange={(e) => setEditForm({ ...editForm, isPublished: e.target.checked })}
                      style={{ accentColor: '#6366f1', width: 16, height: 16 }}
                    />
                    <span style={{ color: '#f8fafc' }}>Publié</span>
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
                <button
                  onClick={() => setShowQuizModal(false)}
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
                  onClick={handleSaveQuiz}
                  style={{
                    padding: '10px 24px',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    border: 'none',
                    borderRadius: 8,
                    color: 'white',
                    cursor: 'pointer',
                  }}
                >
                  Sauvegarder
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL COMMENTAIRES */}
      <AnimatePresence>
        {showCommentsModal && selectedQuiz && (
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
                border: '1px solid rgba(99,102,241,0.3)',
                borderRadius: 24,
                padding: 32,
                maxWidth: 500,
                width: '90%',
                maxHeight: '80vh',
                overflowY: 'auto',
              }}
            >
              <h2 style={{ color: '#f8fafc', fontSize: '1.2rem', fontWeight: 600, marginBottom: 20 }}>
                Commentaires - {selectedQuiz.title}
              </h2>

              {comments.length === 0 ? (
                <p style={{ color: '#94a3b8', textAlign: 'center', padding: 40 }}>
                  Aucun commentaire pour ce quiz
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {comments.map((comment, index) => (
                    <div
                      key={index}
                      style={{
                        padding: 16,
                        background: 'rgba(255,255,255,0.02)',
                        borderRadius: 12,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                        <div style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                        }}>
                          {comment.author?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p style={{ color: '#f8fafc', fontWeight: 500 }}>{comment.author || 'Anonyme'}</p>
                          <p style={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                            {new Date(comment.createdAt).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                      <p style={{ color: '#f8fafc', marginLeft: 44 }}>{comment.text}</p>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
                <button
                  onClick={() => setShowCommentsModal(false)}
                  style={{
                    padding: '10px 20px',
                    background: 'rgba(99,102,241,0.1)',
                    border: '1px solid rgba(99,102,241,0.3)',
                    borderRadius: 8,
                    color: '#a5b4fc',
                    cursor: 'pointer',
                  }}
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL SUPPRESSION */}
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
                Cette action est irréversible.
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
                  onClick={handleDeleteQuiz}
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

      {/* MODAL IMPORT */}
      <AnimatePresence>
        {showImportModal && (
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
                border: '1px solid rgba(99,102,241,0.3)',
                borderRadius: 24,
                padding: 32,
                maxWidth: 400,
                width: '90%',
                textAlign: 'center',
              }}
            >
              <Upload size={48} color="#10b981" style={{ marginBottom: 16 }} />
              <h2 style={{ color: '#f8fafc', fontSize: '1.2rem', fontWeight: 600, marginBottom: 8 }}>
                Importer des quiz
              </h2>
              <p style={{ color: '#94a3b8', marginBottom: 24 }}>
                Sélectionnez un fichier JSON contenant les données des quiz
              </p>

              <input
                type="file"
                accept=".json"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleImportQuizzes(e.target.files[0]);
                  }
                }}
                style={{
                  marginBottom: 20,
                  color: '#f8fafc',
                }}
              />

              <button
                onClick={() => setShowImportModal(false)}
                style={{
                  padding: '10px 20px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(99,102,241,0.2)',
                  borderRadius: 8,
                  color: '#94a3b8',
                  cursor: 'pointer',
                }}
              >
                Fermer
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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

// Composant pour les cartes de statistiques
const StatsCard = ({ title, value, icon, color }) => (
  <motion.div
    whileHover={{ y: -4 }}
    style={{
      background: 'rgba(15,23,42,0.7)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(99,102,241,0.2)',
      borderRadius: 16,
      padding: 16,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
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
    }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc' }}>{value}</div>
      <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{title}</div>
    </div>
  </motion.div>
);

export default AdminQuizzes;