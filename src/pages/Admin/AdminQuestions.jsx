// src/pages/Admin/AdminQuestions.jsx - Version COMPLÈTE avec validation groupée

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PlusCircle, Save, ArrowLeft, Trash2, Edit2, XCircle,
  CheckCircle, BookOpen, Layers, AlertCircle, Loader,
  Upload, Download, Search, Filter, RefreshCw, Eye,
  Lock, Shield, Database, Tag, Clock, Award, Sparkles,
  Bot, Settings as SettingsIcon, Zap, ChevronLeft, ChevronRight,
  Users, FileText, Check, X, AlertTriangle, Copy, EyeOff
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/http';
import { getAllDomaines, getAllSousDomaines, getAllLevels, getAllMatieres } from '../../data/domainConfig';
import toast from 'react-hot-toast';

import NavHome from '../../components/NavHome';
// ─── CONFIGURATION ───
const STATUS_CONFIG = {
  pending: { label: 'En attente', color: '#f59e0b', icon: '⏳', bg: 'rgba(245,158,11,0.1)' },
  approved: { label: 'Validée', color: '#10b981', icon: '✅', bg: 'rgba(16,185,129,0.1)' },
  rejected: { label: 'Rejetée', color: '#ef4444', icon: '❌', bg: 'rgba(239,68,68,0.1)' }
};

const QUESTION_TYPES = [
  { id: 1, nom: 'Savoir', color: '#3b82f6' },
  { id: 2, nom: 'Savoir-Faire', color: '#10b981' },
  { id: 3, nom: 'Savoir-être', color: '#8b5cf6' }
];

// ─── COMPOSANT PRINCIPAL ───
const AdminQuestions = () => {
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const isAdmin = hasRole('admin') || hasRole('superadmin');

  // ─── ÉTATS ───
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [filters, setFilters] = useState({
    domaine: '',
    sousDomaine: '',
    niveau: '',
    matiere: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  // Formulaire
  const [formData, setFormData] = useState({
    domaine: '',
    sousDomaine: '',
    niveau: '',
    matiere: '',
    question: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    points: 1,
    explanation: '',
    type: 'single',
    difficulty: 'moyen'
  });

  // ─── COMPUTED ───
  const domains = getAllDomaines();
  const fDomId = domains.find(d => d.nom === formData.domaine)?.id || '';
  const fSdId = getAllSousDomaines(fDomId).find(sd => sd.nom === formData.sousDomaine)?.id || '';
  const categories = fDomId ? getAllSousDomaines(fDomId) : [];
  const levels = fSdId ? getAllLevels(fDomId, fSdId) : [];
  const subjects = fSdId ? getAllMatieres(fDomId, fSdId) : [];

  const selectedCount = selectedQuestions.length;

  // ─── CHARGEMENT ───
  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        showAll: true
      };

      if (searchTerm) params.search = searchTerm;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (filters.domaine) params.domaine = filters.domaine;
      if (filters.sousDomaine) params.sousDomaine = filters.sousDomaine;
      if (filters.niveau) params.niveau = filters.niveau;
      if (filters.matiere) params.matiere = filters.matiere;

      console.log('📥 [AdminQuestions] Chargement avec params:', params);

      const response = await api.get('/questions', { params });
      
      let questionsList = [];
      let total = 0;

      if (response.data?.data && Array.isArray(response.data.data)) {
        questionsList = response.data.data;
        total = response.data.total || questionsList.length;
      } else if (Array.isArray(response.data)) {
        questionsList = response.data;
        total = questionsList.length;
      } else if (response.data?.questions && Array.isArray(response.data.questions)) {
        questionsList = response.data.questions;
        total = response.data.total || questionsList.length;
      }

      setQuestions(questionsList);
      setTotalCount(total);
      setTotalPages(Math.ceil(total / itemsPerPage));
      
      console.log(`✅ [AdminQuestions] ${questionsList.length} questions chargées sur ${total} total`);
      
      if (questionsList.length === 0 && total > 0) {
        console.warn('⚠️ [AdminQuestions] Aucune question affichée mais total > 0');
      }
    } catch (error) {
      console.error('❌ [AdminQuestions] Erreur chargement:', error);
      toast.error('Impossible de charger les questions');
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchTerm, statusFilter, filters]);

  useEffect(() => {
    if (isAdmin) {
      fetchQuestions();
    }
  }, [fetchQuestions, isAdmin]);

  // ─── SÉLECTION ───
  const toggleSelectAll = () => {
    if (selectedQuestions.length === questions.length) {
      setSelectedQuestions([]);
    } else {
      setSelectedQuestions(questions.map(q => q._id));
    }
  };

  const toggleSelectQuestion = (id) => {
    setSelectedQuestions(prev =>
      prev.includes(id) ? prev.filter(qid => qid !== id) : [...prev, id]
    );
  };

  const clearSelection = () => setSelectedQuestions([]);

  // ─── VALIDATION GROUPÉE ───
  const handleBulkStatusUpdate = async (status) => {
    if (selectedQuestions.length === 0) {
      toast.error('Sélectionnez au moins une question');
      return;
    }

    const statusLabel = status === 'approved' ? 'approuver' : status === 'rejected' ? 'rejeter' : 'mettre en attente';
    
    if (!window.confirm(`Voulez-vous vraiment ${statusLabel} ${selectedQuestions.length} question(s) ?`)) {
      return;
    }

    setSaving(true);
    try {
      const promises = selectedQuestions.map(id =>
        api.patch(`/questions/${id}/status`, { status })
      );
      
      const results = await Promise.allSettled(promises);
      const succeeded = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      if (succeeded > 0) {
        toast.success(`${succeeded} question(s) ${statusLabel}es avec succès`);
        clearSelection();
        fetchQuestions();
      }
      if (failed > 0) {
        toast.error(`${failed} question(s) n'ont pas pu être ${statusLabel}es`);
      }
    } catch (error) {
      console.error('❌ Erreur validation groupée:', error);
      toast.error('Erreur lors de la validation groupée');
    } finally {
      setSaving(false);
    }
  };

  // ─── SUPPRESSION GROUPÉE ───
  const handleBulkDelete = async () => {
    if (selectedQuestions.length === 0) {
      toast.error('Sélectionnez au moins une question');
      return;
    }

    if (!window.confirm(`Voulez-vous vraiment supprimer ${selectedQuestions.length} question(s) ? Cette action est irréversible.`)) {
      return;
    }

    setSaving(true);
    try {
      const promises = selectedQuestions.map(id =>
        api.delete(`/questions/${id}`)
      );
      
      const results = await Promise.allSettled(promises);
      const succeeded = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      if (succeeded > 0) {
        toast.success(`${succeeded} question(s) supprimées avec succès`);
        clearSelection();
        fetchQuestions();
      }
      if (failed > 0) {
        toast.error(`${failed} question(s) n'ont pas pu être supprimées`);
      }
    } catch (error) {
      console.error('❌ Erreur suppression groupée:', error);
      toast.error('Erreur lors de la suppression groupée');
    } finally {
      setSaving(false);
    }
  };

  // ─── ACTIONS INDIVIDUELLES ───
  const handleApprove = async (id) => {
    try {
      await api.patch(`/questions/${id}/status`, { status: 'approved' });
      toast.success('Question approuvée');
      fetchQuestions();
    } catch (error) {
      toast.error('Erreur lors de l\'approbation');
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Motif du rejet (optionnel) :');
    try {
      await api.patch(`/questions/${id}/status`, { 
        status: 'rejected',
        rejectionReason: reason || ''
      });
      toast.success('Question rejetée');
      fetchQuestions();
    } catch (error) {
      toast.error('Erreur lors du rejet');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette question ?')) return;
    try {
      await api.delete(`/questions/${id}`);
      toast.success('Question supprimée');
      fetchQuestions();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  // ─── EXPORT ───
  const handleExportCSV = () => {
    if (questions.length === 0) {
      toast.error('Aucune question à exporter');
      return;
    }

    const headers = ['ID', 'Domaine', 'Sous-domaine', 'Niveau', 'Matière', 'Chapitre', 'Question', 'Type', 'Statut', 'Points', 'Créé le'];
    const rows = questions.map(q => [
      q._id,
      q.domaine || '',
      q.sousDomaine || '',
      q.niveau || '',
      q.matiere || '',
      q.libChapitre || '',
      (q.libQuestion || q.question || '').replace(/"/g, '""'),
      QUESTION_TYPES.find(t => t.id === q.typeQuestion)?.nom || '',
      STATUS_CONFIG[q.status]?.label || q.status || 'N/A',
      q.points || 1,
      new Date(q.createdAt).toLocaleDateString('fr-FR')
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(';')).join('\n');
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `questions_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Export CSV réussi');
  };

  // ─── RÉINITIALISATION DES FILTRES ───
  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setFilters({ domaine: '', sousDomaine: '', niveau: '', matiere: '' });
    setCurrentPage(1);
  };

  // ─── FORMATAGE ───
  const getStatusBadge = (status) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 10px',
        background: config.bg,
        border: `1px solid ${config.color}30`,
        borderRadius: 12,
        color: config.color,
        fontSize: '0.7rem',
        fontWeight: 600
      }}>
        {config.icon} {config.label}
      </span>
    );
  };

  const getTypeBadge = (typeId) => {
    const type = QUESTION_TYPES.find(t => t.id === typeId);
    if (!type) return null;
    return (
      <span style={{
        padding: '2px 8px',
        background: `${type.color}20`,
        border: `1px solid ${type.color}30`,
        borderRadius: 12,
        color: type.color,
        fontSize: '0.65rem',
        fontWeight: 600
      }}>
        {type.nom}
      </span>
    );
  };

  // ─── RENDU ───
  if (!isAdmin) {
    return (
      <div style={{ minHeight: '100vh', background: '#05071a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <NavHome />
        <div style={{ textAlign: 'center', color: '#94a3b8' }}>
          <Shield size={48} style={{ marginBottom: 16, color: '#ef4444' }} />
          <h2 style={{ color: '#f8fafc' }}>Accès non autorisé</h2>
          <p>Vous devez être administrateur pour accéder à cette page.</p>
        </div>
      </div>
    );
  }

  if (loading && questions.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: '#05071a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader size={48} className="animate-spin" color="#6366f1" />
          <p style={{ color: '#94a3b8', marginTop: 16 }}>Chargement des questions...</p>
        </div>
      </div>
    );
  }

  const hasFilters = searchTerm || statusFilter !== 'all' || filters.domaine || filters.sousDomaine || filters.niveau || filters.matiere;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #05071a 0%, #0a0f2e 60%, #05071a 100%)',
      padding: '24px',
      position: 'relative'
    }}>
      {/* Grille de fond */}
      <div style={{
        position: 'fixed', inset: 0,
        backgroundImage: 'linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        pointerEvents: 'none', zIndex: 0
      }} />

      <main style={{ position: 'relative', zIndex: 1, maxWidth: 1400, margin: '0 auto' }}>
        {/* ─── HEADER ─── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/admin')}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: 12,
                padding: 10,
                color: '#94a3b8',
                cursor: 'pointer'
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
                marginBottom: 4
              }}>
                <Shield size={14} color="#6366f1" />
                <span style={{ color: '#a5b4fc', fontSize: '0.7rem', fontWeight: 600 }}>ADMINISTRATION</span>
              </div>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#f8fafc' }}>
                Banque de questions
              </h1>
              <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                {totalCount} questions · {questions.filter(q => q.status === 'pending').length} en attente · {questions.filter(q => q.status === 'approved').length} validées · {questions.filter(q => q.status === 'rejected').length} rejetées
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setShowForm(true);
                setEditingQuestion(null);
                setFormData({
                  domaine: '', sousDomaine: '', niveau: '', matiere: '',
                  question: '', options: ['', '', '', ''],
                  correctAnswer: '', points: 1, explanation: '',
                  type: 'single', difficulty: 'moyen'
                });
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                border: 'none',
                borderRadius: 10,
                color: 'white',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <PlusCircle size={18} />
              Nouvelle question
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleExportCSV}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 16px',
                background: 'rgba(16,185,129,0.1)',
                border: '1px solid rgba(16,185,129,0.3)',
                borderRadius: 10,
                color: '#10b981',
                cursor: 'pointer'
              }}
            >
              <Download size={16} />
              Exporter
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={fetchQuestions}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 16px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: 10,
                color: '#94a3b8',
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={16} />
              Rafraîchir
            </motion.button>
          </div>
        </div>

        {/* ─── BARRE DE RECHERCHE ET FILTRES ─── */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 250 }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher par libellé, domaine, matière..."
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 38px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(99,102,241,0.2)',
                  borderRadius: 10,
                  color: '#f8fafc',
                  outline: 'none'
                }}
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '10px 16px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: 10,
                color: '#f8fafc',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="all">📊 Tous les statuts</option>
              <option value="pending">⏳ En attente</option>
              <option value="approved">✅ Validées</option>
              <option value="rejected">❌ Rejetées</option>
            </select>

            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 16px',
                background: showFilters ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${showFilters ? 'rgba(99,102,241,0.5)' : 'rgba(99,102,241,0.2)'}`,
                borderRadius: 10,
                color: showFilters ? '#a5b4fc' : '#94a3b8',
                cursor: 'pointer'
              }}
            >
              <Filter size={16} />
              Filtres
            </button>

            {hasFilters && (
              <button
                onClick={resetFilters}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '10px 16px',
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: 10,
                  color: '#ef4444',
                  cursor: 'pointer'
                }}
              >
                <X size={16} />
                Réinitialiser
              </button>
            )}
          </div>

          {/* Filtres avancés */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 12,
                  marginTop: 12,
                  padding: 16,
                  background: 'rgba(15,23,42,0.7)',
                  borderRadius: 12,
                  border: '1px solid rgba(99,102,241,0.15)'
                }}>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: 4 }}>Domaine</label>
                    <select
                      value={filters.domaine}
                      onChange={(e) => setFilters(prev => ({ ...prev, domaine: e.target.value, sousDomaine: '', niveau: '', matiere: '' }))}
                      style={{
                        width: '100%',
                        padding: 8,
                        background: '#0f172a',
                        border: '1px solid rgba(99,102,241,0.2)',
                        borderRadius: 8,
                        color: '#f8fafc'
                      }}
                    >
                      <option value="">Tous</option>
                      {domains.map(d => <option key={d.id} value={d.nom}>{d.nom}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: 4 }}>Sous-domaine</label>
                    <select
                      value={filters.sousDomaine}
                      onChange={(e) => setFilters(prev => ({ ...prev, sousDomaine: e.target.value, niveau: '', matiere: '' }))}
                      disabled={!filters.domaine}
                      style={{
                        width: '100%',
                        padding: 8,
                        background: '#0f172a',
                        border: '1px solid rgba(99,102,241,0.2)',
                        borderRadius: 8,
                        color: '#f8fafc',
                        opacity: filters.domaine ? 1 : 0.5
                      }}
                    >
                      <option value="">Tous</option>
                      {getAllSousDomaines(fDomId).map(sd => <option key={sd.id} value={sd.nom}>{sd.nom}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: 4 }}>Niveau</label>
                    <select
                      value={filters.niveau}
                      onChange={(e) => setFilters(prev => ({ ...prev, niveau: e.target.value }))}
                      disabled={!filters.sousDomaine}
                      style={{
                        width: '100%',
                        padding: 8,
                        background: '#0f172a',
                        border: '1px solid rgba(99,102,241,0.2)',
                        borderRadius: 8,
                        color: '#f8fafc',
                        opacity: filters.sousDomaine ? 1 : 0.5
                      }}
                    >
                      <option value="">Tous</option>
                      {getAllLevels(fDomId, fSdId).map(l => <option key={l.id} value={l.nom}>{l.nom}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: 4 }}>Matière</label>
                    <select
                      value={filters.matiere}
                      onChange={(e) => setFilters(prev => ({ ...prev, matiere: e.target.value }))}
                      disabled={!filters.sousDomaine}
                      style={{
                        width: '100%',
                        padding: 8,
                        background: '#0f172a',
                        border: '1px solid rgba(99,102,241,0.2)',
                        borderRadius: 8,
                        color: '#f8fafc',
                        opacity: filters.sousDomaine ? 1 : 0.5
                      }}
                    >
                      <option value="">Toutes</option>
                      {getAllMatieres(fDomId, fSdId).map(m => <option key={m.id} value={m.nom}>{m.nom}</option>)}
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ─── BARRE D'ACTIONS GROUPÉES ─── */}
        {selectedQuestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 20px',
              background: 'rgba(99,102,241,0.1)',
              border: '1px solid rgba(99,102,241,0.3)',
              borderRadius: 12,
              marginBottom: 16,
              flexWrap: 'wrap'
            }}
          >
            <span style={{ color: '#f8fafc', fontWeight: 600, fontSize: '0.9rem' }}>
              {selectedQuestions.length} question(s) sélectionnée(s)
            </span>
            <button
              onClick={clearSelection}
              style={{
                padding: '4px 12px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 6,
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: '0.75rem'
              }}
            >
              Effacer
            </button>

            <div style={{ flex: 1 }} />

            <button
              onClick={() => handleBulkStatusUpdate('approved')}
              disabled={saving}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 16px',
                background: 'rgba(16,185,129,0.15)',
                border: '1px solid rgba(16,185,129,0.3)',
                borderRadius: 8,
                color: '#10b981',
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.6 : 1
              }}
            >
              <CheckCircle size={14} /> Approuver
            </button>

            <button
              onClick={() => handleBulkStatusUpdate('pending')}
              disabled={saving}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 16px',
                background: 'rgba(245,158,11,0.15)',
                border: '1px solid rgba(245,158,11,0.3)',
                borderRadius: 8,
                color: '#f59e0b',
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.6 : 1
              }}
            >
              <Clock size={14} /> En attente
            </button>

            <button
              onClick={() => handleBulkStatusUpdate('rejected')}
              disabled={saving}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 16px',
                background: 'rgba(239,68,68,0.15)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 8,
                color: '#ef4444',
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.6 : 1
              }}
            >
              <XCircle size={14} /> Rejeter
            </button>

            <button
              onClick={handleBulkDelete}
              disabled={saving}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 16px',
                background: 'rgba(239,68,68,0.2)',
                border: '1px solid rgba(239,68,68,0.4)',
                borderRadius: 8,
                color: '#ef4444',
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.6 : 1
              }}
            >
              <Trash2 size={14} /> Supprimer
            </button>
          </motion.div>
        )}

        {/* ─── LISTE DES QUESTIONS ─── */}
        <div style={{
          background: 'rgba(15,23,42,0.7)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: 16,
          overflow: 'hidden'
        }}>
          {questions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>
              <Database size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
              <p>Aucune question trouvée</p>
              {hasFilters && (
                <button
                  onClick={resetFilters}
                  style={{
                    marginTop: 12,
                    padding: '8px 20px',
                    background: 'rgba(99,102,241,0.2)',
                    border: 'none',
                    borderRadius: 8,
                    color: '#a5b4fc',
                    cursor: 'pointer'
                  }}
                >
                  Effacer les filtres
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Tableau */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(99,102,241,0.15)' }}>
                      <th style={{ padding: '12px 16px', width: 40 }}>
                        <input
                          type="checkbox"
                          checked={selectedQuestions.length === questions.length && questions.length > 0}
                          onChange={toggleSelectAll}
                          style={{ accentColor: '#6366f1', width: 16, height: 16, cursor: 'pointer' }}
                        />
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: '#94a3b8', fontSize: '0.7rem', fontWeight: 600 }}>#</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: '#94a3b8', fontSize: '0.7rem', fontWeight: 600 }}>Question</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: '#94a3b8', fontSize: '0.7rem', fontWeight: 600 }}>Domaine</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: '#94a3b8', fontSize: '0.7rem', fontWeight: 600 }}>Matière</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: '#94a3b8', fontSize: '0.7rem', fontWeight: 600 }}>Type</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: '#94a3b8', fontSize: '0.7rem', fontWeight: 600 }}>Statut</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', color: '#94a3b8', fontSize: '0.7rem', fontWeight: 600 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {questions.map((q, index) => {
                      const isSelected = selectedQuestions.includes(q._id);
                      const statusConfig = STATUS_CONFIG[q.status] || STATUS_CONFIG.pending;
                      const typeInfo = QUESTION_TYPES.find(t => t.id === q.typeQuestion);

                      return (
                        <motion.tr
                          key={q._id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          style={{
                            borderBottom: '1px solid rgba(99,102,241,0.08)',
                            background: isSelected ? 'rgba(99,102,241,0.08)' : 'transparent'
                          }}
                          whileHover={{ background: 'rgba(99,102,241,0.05)' }}
                        >
                          <td style={{ padding: '10px 16px' }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectQuestion(q._id)}
                              style={{ accentColor: '#6366f1', width: 16, height: 16, cursor: 'pointer' }}
                            />
                          </td>
                          <td style={{ padding: '10px 16px', color: '#64748b', fontSize: '0.7rem' }}>
                            {(currentPage - 1) * itemsPerPage + index + 1}
                          </td>
                          <td style={{ padding: '10px 16px' }}>
                            <div>
                              <p style={{ color: '#f8fafc', fontSize: '0.85rem', fontWeight: 500, maxWidth: 350, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {q.libQuestion || q.question || 'Sans libellé'}
                              </p>
                              <p style={{ color: '#64748b', fontSize: '0.65rem' }}>
                                {q.libChapitre || 'Sans chapitre'} · {q.niveau || 'N/A'}
                              </p>
                            </div>
                          </td>
                          <td style={{ padding: '10px 16px', color: '#94a3b8', fontSize: '0.8rem' }}>
                            {q.domaine || 'N/A'}
                          </td>
                          <td style={{ padding: '10px 16px', color: '#94a3b8', fontSize: '0.8rem' }}>
                            {q.matiere || 'N/A'}
                          </td>
                          <td style={{ padding: '10px 16px' }}>
                            {typeInfo && (
                              <span style={{
                                padding: '2px 8px',
                                background: `${typeInfo.color}20`,
                                border: `1px solid ${typeInfo.color}30`,
                                borderRadius: 12,
                                color: typeInfo.color,
                                fontSize: '0.65rem',
                                fontWeight: 600
                              }}>
                                {typeInfo.nom}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '10px 16px' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              padding: '2px 10px',
                              background: statusConfig.bg,
                              border: `1px solid ${statusConfig.color}30`,
                              borderRadius: 12,
                              color: statusConfig.color,
                              fontSize: '0.7rem',
                              fontWeight: 600
                            }}>
                              {statusConfig.icon} {statusConfig.label}
                            </span>
                          </td>
                          <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap' }}>
                              {q.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleApprove(q._id)}
                                    title="Approuver"
                                    style={{
                                      padding: 4,
                                      background: 'rgba(16,185,129,0.1)',
                                      border: '1px solid rgba(16,185,129,0.3)',
                                      borderRadius: 6,
                                      color: '#10b981',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    <CheckCircle size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleReject(q._id)}
                                    title="Rejeter"
                                    style={{
                                      padding: 4,
                                      background: 'rgba(239,68,68,0.1)',
                                      border: '1px solid rgba(239,68,68,0.3)',
                                      borderRadius: 6,
                                      color: '#ef4444',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    <XCircle size={14} />
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => {
                                  setEditingQuestion(q);
                                  setFormData({
                                    domaine: q.domaine || '',
                                    sousDomaine: q.sousDomaine || '',
                                    niveau: q.niveau || '',
                                    matiere: q.matiere || '',
                                    question: q.libQuestion || q.question || '',
                                    options: q.options || ['', '', '', ''],
                                    correctAnswer: q.correctAnswer || '',
                                    points: q.points || 1,
                                    explanation: q.explanation || '',
                                    type: q.type || 'single',
                                    difficulty: q.difficulty || 'moyen'
                                  });
                                  setShowForm(true);
                                }}
                                title="Modifier"
                                style={{
                                  padding: 4,
                                  background: 'rgba(99,102,241,0.1)',
                                  border: '1px solid rgba(99,102,241,0.3)',
                                  borderRadius: 6,
                                  color: '#a5b4fc',
                                  cursor: 'pointer'
                                }}
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => handleDelete(q._id)}
                                title="Supprimer"
                                style={{
                                  padding: 4,
                                  background: 'rgba(239,68,68,0.1)',
                                  border: '1px solid rgba(239,68,68,0.3)',
                                  borderRadius: 6,
                                  color: '#ef4444',
                                  cursor: 'pointer'
                                }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* ─── PAGINATION ─── */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderTop: '1px solid rgba(99,102,241,0.1)',
                flexWrap: 'wrap',
                gap: 8
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#64748b', fontSize: '0.8rem' }}>
                  <span>{totalCount} question(s)</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    style={{
                      padding: '4px 8px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(99,102,241,0.2)',
                      borderRadius: 6,
                      color: '#f8fafc',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    style={{
                      padding: '6px 12px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(99,102,241,0.2)',
                      borderRadius: 6,
                      color: currentPage === 1 ? '#475569' : '#94a3b8',
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      opacity: currentPage === 1 ? 0.5 : 1
                    }}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span style={{ padding: '6px 12px', color: '#94a3b8', fontSize: '0.8rem' }}>
                    Page {currentPage} / {totalPages || 1}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages || 1, prev + 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                    style={{
                      padding: '6px 12px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(99,102,241,0.2)',
                      borderRadius: 6,
                      color: currentPage === totalPages || totalPages === 0 ? '#475569' : '#94a3b8',
                      cursor: currentPage === totalPages || totalPages === 0 ? 'not-allowed' : 'pointer',
                      opacity: currentPage === totalPages || totalPages === 0 ? 0.5 : 1
                    }}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(15,23,42,0.3);
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(99,102,241,0.3);
          border-radius: 10px;
        }
        select option {
          background: #1e293b;
          color: #f8fafc;
        }
        input:focus, select:focus {
          border-color: rgba(99,102,241,0.5) !important;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
        }
      `}</style>
    </div>
  );
};

export default AdminQuestions;