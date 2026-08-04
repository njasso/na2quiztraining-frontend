// src/pages/DatabaseQuizCreation.jsx - Version complète et corrigée
// ✅ CORRECTION: Publication directe des examens (status: 'published')
// ✅ CORRECTION: Gestion des erreurs améliorée
// ✅ CORRECTION: Validation des données avant envoi

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Database, Save, Trash2, ArrowLeft, Search, BookOpen, BookMarked, 
  Loader, AlertCircle, CheckCircle, XCircle, Info, Plus, Minus,
  Clock, Award, Users, FileText, ChevronDown, ChevronUp
} from 'lucide-react';
import DOMAIN_DATA, { 
  getAllDomaines, 
  getAllSousDomaines, 
  getAllLevels, 
  getAllMatieres,
  getLevelNom,
  getMatiereNom,
  getDomainNom,
  getSousDomaineNom,
  getDomainCode,
  getMatiereCode
} from '../data/domainConfig';
import { getQuestions, createExam } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import {
  hasEducationScope,
  isScopeExemptRole,
  getVisibleSousDomaines,
  getVisibleLevels,
  getAllowedMatieres,
} from '../utils/educationScope';
import { EXAM_VISIBILITY, generateExamCode, parseAssignedList } from '../utils/examVisibility';
import ExamVisibilityPicker from '../components/ExamVisibilityPicker';
import toast from 'react-hot-toast';

import NavHome from '../components/NavHome';
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

const DatabaseQuizCreation = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { canCreateQuiz, recordQuizCreated } = useSubscription();
  const scopeLocked = hasEducationScope(user) && !isScopeExemptRole(user);
  
  // État des filtres — pré-rempli et verrouillé au niveau de l'utilisateur
  const [selectedDomain, setSelectedDomain] = useState(scopeLocked ? user.education.domainId : '');
  const [selectedSousDomaine, setSelectedSousDomaine] = useState(scopeLocked ? user.education.sousDomaineId : '');
  const [selectedLevel, setSelectedLevel] = useState(scopeLocked ? user.education.levelId : '');
  const [selectedMatiere, setSelectedMatiere] = useState('');
  
  // État du formulaire
  const [examTitle, setExamTitle] = useState('');
  const [examDescription, setExamDescription] = useState('');
  const [examDuration, setExamDuration] = useState(60);
  const [examPassingScore, setExamPassingScore] = useState(70);
  
  // État des questions
  const [availableQuestions, setAvailableQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // État de chargement
  const [isLoading, setIsLoading] = useState(false);
  const [fetchingQuestions, setFetchingQuestions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [visibility, setVisibility] = useState(EXAM_VISIBILITY.PUBLIC);
  const [assignedToRaw, setAssignedToRaw] = useState('');
  
  // Options dynamiques depuis DOMAIN_DATA — restreintes au périmètre
  const domains = getAllDomaines();
  const sousDomaines = selectedDomain ? getVisibleSousDomaines(user, selectedDomain) : [];
  const levels = selectedSousDomaine ? getVisibleLevels(user, selectedDomain, selectedSousDomaine) : [];
  const matieres = selectedSousDomaine ? getAllowedMatieres(user, selectedDomain, selectedSousDomaine) : [];

  // Helpers pour les noms
  const getLevelName = (levelId) => {
    return getLevelNom(selectedDomain, selectedSousDomaine, levelId);
  };

  const getMatiereName = (matiereId) => {
    return getMatiereNom(selectedDomain, selectedSousDomaine, matiereId);
  };

  const getDomainName = (domainId) => {
    return getDomainNom(domainId);
  };

  const getSousDomaineName = (sousDomaineId) => {
    return getSousDomaineNom(selectedDomain, sousDomaineId);
  };

  // Charger les questions depuis l'API
  const loadAvailableQuestions = async () => {
    if (!selectedDomain || !selectedSousDomaine || !selectedLevel || !selectedMatiere) return;
    
    setFetchingQuestions(true);
    setError(null);
    
    try {
      console.log('🔍 Filtres envoyés à l\'API:', {
        domainId: selectedDomain,
        sousDomaineId: selectedSousDomaine,
        levelId: selectedLevel,
        matiereId: selectedMatiere
      });
      
      const response = await getQuestions({ 
        domainId: selectedDomain,
        sousDomaineId: selectedSousDomaine,
        levelId: selectedLevel,
        matiereId: selectedMatiere,
        limit: 1000 
      });
      
      let allQuestions = [];
      if (Array.isArray(response)) {
        allQuestions = response;
      } else if (response?.data && Array.isArray(response.data)) {
        allQuestions = response.data;
      } else if (response?.questions && Array.isArray(response.questions)) {
        allQuestions = response.questions;
      }
      
      console.log(`📦 ${allQuestions.length} questions reçues de l'API`);
      
      // Normaliser les questions
      const normalized = allQuestions.map((q, index) => ({
        id: q._id || q.id || `q-${index}`,
        text: q.question || q.text || q.libQuestion || '',
        options: Array.isArray(q.options) ? q.options : 
                 (q.options ? String(q.options).split('|').map(o => o.trim()) : []),
        correctAnswer: q.correctAnswer || q.answer || q.bonOpRep || '',
        points: q.points || q.point || 1,
        explanation: q.explanation || q.explication || '',
        type: q.type || q.typeQuestion || 'single',
        level: q.level || q.niveau || selectedLevel,
        niveau: q.niveau || q.level || selectedLevel,
        matiere: q.matiere || q.subject || selectedMatiere,
        domaine: q.domaine || q.domain || selectedDomain,
        sousDomaine: q.sousDomaine || q.subDomain || selectedSousDomaine,
        chapter: q.chapter || q.chapitre || q.libChapitre || 'Général',
        selectedDomaine: q.selectedDomaine || q.domaine || 'Éducatif'
      }));
      
      console.log(`✅ ${normalized.length} questions normalisées`);
      
      const matiereNom = getMatiereName(selectedMatiere);
      const levelNom = getLevelName(selectedLevel);
      
      if (normalized.length === 0) {
        toast.error(`Aucune question trouvée pour ${matiereNom || 'la matière'} (niveau ${levelNom || selectedLevel})`, {
          duration: 5000,
          icon: '📚'
        });
      } else {
        toast.success(`${normalized.length} questions disponibles`, {
          icon: '✅',
          duration: 2000
        });
      }
      
      setAvailableQuestions(normalized);
      
    } catch (error) {
      console.error("❌ Erreur lors du chargement des questions:", error);
      
      if (error?.response?.status === 429) {
        setError('Trop de requêtes. Veuillez patienter quelques instants.');
        toast.error('Rate limit atteint, veuillez patienter');
      } else {
        setError('Impossible de charger les questions. Vérifiez votre connexion.');
        toast.error('Erreur de chargement des questions');
      }
      
      setAvailableQuestions([]);
    } finally {
      setFetchingQuestions(false);
    }
  };

  // Charger les questions quand les filtres changent
  useEffect(() => {
    if (selectedDomain && selectedSousDomaine && selectedLevel && selectedMatiere) {
      // Debounce pour éviter les appels multiples
      const timer = setTimeout(() => {
        loadAvailableQuestions();
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setAvailableQuestions([]);
    }
  }, [selectedDomain, selectedSousDomaine, selectedLevel, selectedMatiere]);

  // Filtrer les questions par recherche
  const filteredQuestions = availableQuestions.filter(question =>
    question.text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    question.chapter?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Ajouter une question
  const addQuestion = (question) => {
    if (!selectedQuestions.some(q => q.id === question.id)) {
      setSelectedQuestions([...selectedQuestions, question]);
      toast.success('Question ajoutée', { icon: '➕' });
    } else {
      toast.error('Question déjà sélectionnée');
    }
  };

  // Supprimer une question
  const removeQuestion = (questionId) => {
    setSelectedQuestions(selectedQuestions.filter(q => q.id !== questionId));
    toast.success('Question retirée', { icon: '➖' });
  };

  // Supprimer toutes les questions
  const clearAllQuestions = () => {
    if (selectedQuestions.length > 0) {
      setSelectedQuestions([]);
      toast.success('Toutes les questions ont été retirées');
    }
  };

  // Ajouter toutes les questions disponibles
  const addAllQuestions = () => {
    const newQuestions = filteredQuestions.filter(
      q => !selectedQuestions.some(sq => sq.id === q.id)
    );
    if (newQuestions.length > 0) {
      setSelectedQuestions([...selectedQuestions, ...newQuestions]);
      toast.success(`${newQuestions.length} questions ajoutées`);
    } else {
      toast.info('Toutes les questions sont déjà sélectionnées');
    }
  };

  // ✅ Sauvegarder l'examen - VERSION CORRIGÉE AVEC PUBLICATION DIRECTE
  const saveExam = async () => {
    // Validation
    if (!examTitle || examTitle.trim() === '') {
      toast.error('Veuillez donner un titre à l\'épreuve');
      return;
    }

    if (selectedQuestions.length === 0) {
      toast.error('Veuillez sélectionner au moins une question');
      return;
    }

    if (!selectedDomain || !selectedSousDomaine || !selectedLevel || !selectedMatiere) {
      toast.error('Veuillez sélectionner tous les filtres (domaine, sous-domaine, niveau, matière)');
      return;
    }

    // 🔒 Garde anti-contournement du périmètre éducatif
    if (scopeLocked) {
      const stillAllowed =
        String(selectedDomain) === String(user.education.domainId) &&
        String(selectedSousDomaine) === String(user.education.sousDomaineId) &&
        String(selectedLevel) === String(user.education.levelId);
      if (!stillAllowed) {
        toast.error("Cette sélection ne correspond pas à votre niveau d'étude.");
        return;
      }
    }

    // 🔒 Limite du plan d'abonnement (ex: 5 quiz/jour en Gratuit)
    if (!canCreateQuiz()) return;

    setSaving(true);
    setError(null);

    try {
      // Récupérer les noms pour les métadonnées
      const levelNom = getLevelName(selectedLevel);
      const matiereNom = getMatiereName(selectedMatiere);
      const domainNom = getDomainName(selectedDomain);
      const sousDomaineNom = getSousDomaineName(selectedSousDomaine);

      // Formater les questions pour l'API
      const formattedQuestions = selectedQuestions.map(q => ({
        question: q.text || q.question,
        text: q.text || q.question,
        options: Array.isArray(q.options) ? q.options : [],
        answer: q.correctAnswer || q.answer || '',
        correctAnswer: q.correctAnswer || q.answer || '',
        points: q.points || 1,
        explanation: q.explanation || '',
        type: q.type || 'single',
        chapter: q.chapter || 'Général'
      }));

      // Calculer le total des points
      const totalPoints = formattedQuestions.reduce((sum, q) => sum + (q.points || 1), 0);

      // ✅ CORRECTION: Status 'published' pour que l'examen soit visible immédiatement
      const examData = {
        title: examTitle.trim(),
        description: examDescription || `Examen de ${matiereNom || 'la matière'}`,
        domain: selectedDomain,
        sousDomaine: selectedSousDomaine,
        level: selectedLevel,
        matiere: selectedMatiere,
        domainNom: domainNom || selectedDomain,
        sousDomaineNom: sousDomaineNom || selectedSousDomaine,
        levelNom: levelNom || selectedLevel,
        matiereNom: matiereNom || selectedMatiere,
        subject: matiereNom || selectedMatiere,
        questions: formattedQuestions,
        duration: examDuration || 60,
        passingScore: examPassingScore || 70,
        totalPoints: totalPoints,
        questionCount: formattedQuestions.length,
        createdBy: user?._id || user?.id,
        generationMode: 'Manuel',
        status: 'published', // ✅ PUBLIÉ DIRECTEMENT
        source: 'database',
        // ✅ Destinataires de l'épreuve (document de recommandations §7)
        visibility,
        isPublic: visibility === EXAM_VISIBILITY.PUBLIC,
        assignedTo: visibility === EXAM_VISIBILITY.ASSIGNED ? parseAssignedList(assignedToRaw) : [],
        code: generateExamCode(
          getDomainCode(selectedDomain),
          getMatiereCode(selectedDomain, selectedSousDomaine, selectedMatiere),
          levelNom
        ),
        metadata: {
          createdAt: new Date().toISOString(),
          questionCount: formattedQuestions.length,
          type: 'database'
        }
      };

      console.log('📦 Envoi de l\'examen (publié directement):', examData);
      
      const response = await createExam(examData);

      if (response.success) {
        recordQuizCreated();
        toast.success('✅ Épreuve publiée avec succès!', {
          duration: 4000,
          icon: '🎉'
        });
        if (visibility !== EXAM_VISIBILITY.PRIVATE) {
          toast(`Code de partage : ${examData.code}`, { icon: '🔗', duration: 8000 });
        }

        // Rediriger vers la page des examens après un court délai
        setTimeout(() => {
          navigate('/exams');
        }, 1500);
      } else {
        throw new Error(response.error || 'Erreur lors de la création');
      }
    } catch (error) {
      console.error("❌ Erreur lors de l'enregistrement:", error);
      
      let errorMessage = "Une erreur est survenue lors de l'enregistrement";
      
      if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Réinitialiser les filtres
  const resetFilters = () => {
    setSelectedDomain('');
    setSelectedSousDomaine('');
    setSelectedLevel('');
    setSelectedMatiere('');
    setAvailableQuestions([]);
    setSearchTerm('');
  };

  // ─── Rendu ──────────────────────────────────────────────────────────────────────

  return (
    <div style={{
      minHeight: '100vh',
      fontFamily: "'DM Sans', sans-serif",
      background: 'linear-gradient(135deg, #05071a 0%, #0a0f2e 60%, #05071a 100%)',
      position: 'relative',
      overflow: 'hidden',
      padding: '24px',
    }}>
      <NavHome />
      {/* Fond décoratif */}
      <div style={{
        position: 'fixed', inset: 0,
        backgroundImage: 'linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px)',
        backgroundSize: '40px 40px', pointerEvents: 'none', zIndex: 0,
      }} />

      <div style={{
        position: 'fixed', top: '-15%', left: '50%', transform: 'translateX(-50%)',
        width: '70vw', height: '50vh',
        background: 'radial-gradient(ellipse, rgba(37,99,235,0.12) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(5,7,26,0.88)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(59,130,246,0.12)',
        padding: '0 32px',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
        borderRadius: '12px',
      }}>
        <div style={{
          fontFamily: "'Sora', sans-serif",
          fontWeight: 800, fontSize: '1.125rem',
          letterSpacing: '-0.02em',
          background: 'linear-gradient(135deg, #60a5fa, #a78bfa)',
          WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <Database size={20} color="#60a5fa" />
          NA²QUIZ · BASE DE DONNÉES
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{
            fontSize: '0.75rem',
            color: '#94a3b8',
            background: 'rgba(255,255,255,0.05)',
            padding: '4px 12px',
            borderRadius: '20px',
          }}>
            {selectedQuestions.length} questions sélectionnées
          </span>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/create-exam')}
            style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              padding: '8px 16px', borderRadius: '8px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#cbd5e1', fontSize: '0.875rem', fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={15} />
            Retour
          </motion.button>
        </div>
      </header>

      <main style={{ position: 'relative', zIndex: 1, maxWidth: '1400px', margin: '0 auto' }}>
        {/* Titre */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          style={{ marginBottom: '32px', textAlign: 'center' }}
        >
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '5px 14px', marginBottom: '16px',
            background: 'rgba(37,99,235,0.12)',
            border: '1px solid rgba(59,130,246,0.25)',
            borderRadius: '999px',
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3b82f6', boxShadow: '0 0 8px #3b82f6' }} />
            <span style={{ fontSize: '0.75rem', color: '#93c5fd', fontWeight: 600, letterSpacing: '0.08em' }}>
              CRÉATION DE QUESTIONNAIRE
            </span>
          </div>
          <h1 style={{
            fontFamily: "'Sora', sans-serif",
            fontSize: '2rem',
            fontWeight: 700,
            color: '#f8fafc',
            marginBottom: '8px',
          }}>
            Créer un Questionnaire
          </h1>
          <p style={{ fontSize: '0.9375rem', color: 'rgba(203,213,225,0.7)' }}>
            Sélectionnez des questions depuis notre catalogue
          </p>
        </motion.div>

        {/* Message d'erreur */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px 20px',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '12px',
              marginBottom: '24px',
            }}
          >
            <AlertCircle size={20} color="#ef4444" />
            <span style={{ color: '#fca5a5', flex: 1 }}>{error}</span>
            <button
              onClick={() => setError(null)}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
              }}
            >
              <XCircle size={18} />
            </button>
          </motion.div>
        )}

        {/* Grille principale */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '320px 1fr 320px', 
          gap: '20px',
          alignItems: 'start'
        }}>
          {/* Panel 1: Configuration */}
          <motion.div variants={itemVariants} style={{
            background: 'rgba(15,23,42,0.7)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(59,130,246,0.15)',
            borderRadius: '20px',
            padding: '24px',
            position: 'sticky',
            top: '80px',
          }}>
            <h2 style={{
              fontFamily: "'Sora', sans-serif",
              fontSize: '1.1rem',
              fontWeight: 600,
              color: '#f8fafc',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <Database size={18} color="#3b82f6" />
              Configuration
            </h2>

            {/* Titre */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>
                Titre de l'épreuve *
              </label>
              <input
                type="text"
                value={examTitle}
                onChange={(e) => setExamTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(59,130,246,0.2)',
                  borderRadius: '10px',
                  color: '#f8fafc',
                  fontSize: '0.9rem',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                placeholder="Ex: Épreuve de Management de Projet"
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(59,130,246,0.2)'}
              />
            </div>

            {/* Description */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>
                Description
              </label>
              <textarea
                value={examDescription}
                onChange={(e) => setExamDescription(e.target.value)}
                rows={2}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(59,130,246,0.2)',
                  borderRadius: '10px',
                  color: '#f8fafc',
                  fontSize: '0.9rem',
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                }}
                placeholder="Description de l'épreuve (optionnel)"
              />
            </div>

            {/* Durée */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>
                <Clock size={14} style={{ display: 'inline', marginRight: '4px' }} />
                Durée (minutes)
              </label>
              <input
                type="number"
                value={examDuration}
                onChange={(e) => setExamDuration(Math.max(1, parseInt(e.target.value) || 60))}
                min="1"
                max="300"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(59,130,246,0.2)',
                  borderRadius: '10px',
                  color: '#f8fafc',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
            </div>

            {/* Score de réussite */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>
                <Award size={14} style={{ display: 'inline', marginRight: '4px' }} />
                Score de réussite (%)
              </label>
              <input
                type="number"
                value={examPassingScore}
                onChange={(e) => setExamPassingScore(Math.min(100, Math.max(0, parseInt(e.target.value) || 70)))}
                min="0"
                max="100"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(59,130,246,0.2)',
                  borderRadius: '10px',
                  color: '#f8fafc',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
            </div>

            <ExamVisibilityPicker
              visibility={visibility}
              onVisibilityChange={setVisibility}
              assignedToRaw={assignedToRaw}
              onAssignedToChange={setAssignedToRaw}
            />

            <div style={{ borderTop: '1px solid rgba(59,130,246,0.1)', paddingTop: '16px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '12px' }}>
                Filtres de recherche
              </h3>

              {/* Domaine */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>
                  Domaine
                </label>
                <select
                  value={selectedDomain}
                  onChange={(e) => {
                    setSelectedDomain(e.target.value);
                    setSelectedSousDomaine('');
                    setSelectedLevel('');
                    setSelectedMatiere('');
                  }}
                  disabled={scopeLocked}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(59,130,246,0.2)',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '0.85rem',
                    outline: 'none',
                    opacity: scopeLocked ? 0.6 : 1,
                  }}
                >
                  <option value="">Sélectionnez...</option>
                  {domains.map((domain) => (
                    <option key={domain.id} value={domain.id}>{domain.nom}</option>
                  ))}
                </select>
              </div>

              {/* Sous-domaine */}
              {selectedDomain && (
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>
                    Sous-domaine
                  </label>
                  <select
                    value={selectedSousDomaine}
                    onChange={(e) => {
                      setSelectedSousDomaine(e.target.value);
                      setSelectedLevel('');
                      setSelectedMatiere('');
                    }}
                    disabled={scopeLocked}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(59,130,246,0.2)',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      fontSize: '0.85rem',
                      outline: 'none',
                      opacity: scopeLocked ? 0.6 : 1,
                    }}
                  >
                    <option value="">Sélectionnez...</option>
                    {sousDomaines.map((sd) => (
                      <option key={sd.id} value={sd.id}>{sd.nom}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Niveau */}
              {selectedSousDomaine && (
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>
                    Niveau
                  </label>
                  <select
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value)}
                    disabled={scopeLocked}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(59,130,246,0.2)',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      fontSize: '0.85rem',
                      outline: 'none',
                      opacity: scopeLocked ? 0.6 : 1,
                    }}
                  >
                    <option value="">Sélectionnez...</option>
                    {levels.map((level) => (
                      <option key={level.id} value={level.id}>{level.nom}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Matière */}
              {selectedLevel && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>
                    Matière
                  </label>
                  <select
                    value={selectedMatiere}
                    onChange={(e) => setSelectedMatiere(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(59,130,246,0.2)',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  >
                    <option value="">Sélectionnez...</option>
                    {matieres.map((matiere) => (
                      <option key={matiere.id} value={matiere.id}>{matiere.nom}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Bouton réinitialiser */}
              {(selectedDomain || selectedSousDomaine || selectedLevel || selectedMatiere) && (
                <button
                  onClick={resetFilters}
                  style={{
                    fontSize: '0.75rem',
                    color: '#64748b',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    padding: '4px 0',
                  }}
                >
                  Réinitialiser les filtres
                </button>
              )}
            </div>

            {/* ✅ Bouton Enregistrer - avec statut 'published' */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={saveExam}
              disabled={saving || !selectedMatiere || selectedQuestions.length === 0}
              style={{
                width: '100%',
                padding: '14px',
                background: saving || !selectedMatiere || selectedQuestions.length === 0 
                  ? 'rgba(59,130,246,0.3)' 
                  : 'linear-gradient(135deg, #10b981, #059669)',
                border: 'none',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '1rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: saving || !selectedMatiere || selectedQuestions.length === 0 ? 'not-allowed' : 'pointer',
                boxShadow: !saving && selectedMatiere && selectedQuestions.length > 0 
                  ? '0 4px 12px rgba(16,185,129,0.3)' 
                  : 'none',
                transition: 'all 0.2s',
              }}
            >
              {saving ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  Publication...
                </>
              ) : (
                <>
                  <Save size={18} />
                  📤 Publier l'Épreuve
                </>
              )}
            </motion.button>

            {/* Résumé */}
            {selectedQuestions.length > 0 && (
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: 'rgba(16,185,129,0.1)',
                border: '1px solid rgba(16,185,129,0.2)',
                borderRadius: '10px',
                textAlign: 'center',
              }}>
                <p style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: 600 }}>
                  {selectedQuestions.length} question{selectedQuestions.length > 1 ? 's' : ''} sélectionnée{selectedQuestions.length > 1 ? 's' : ''}
                </p>
                <p style={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                  Total: {selectedQuestions.reduce((sum, q) => sum + (q.points || 1), 0)} points
                </p>
                <p style={{ color: '#34d399', fontSize: '0.65rem', marginTop: '4px' }}>
                  ✅ Sera publié immédiatement
                </p>
              </div>
            )}
          </motion.div>

          {/* Panel 2: Questions disponibles */}
          <motion.div variants={itemVariants} style={{
            background: 'rgba(15,23,42,0.7)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(59,130,246,0.15)',
            borderRadius: '20px',
            padding: '24px',
          }}>
            <h2 style={{
              fontFamily: "'Sora', sans-serif",
              fontSize: '1.1rem',
              fontWeight: 600,
              color: '#f8fafc',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen size={18} color="#3b82f6" />
                Questions disponibles
              </span>
              {availableQuestions.length > 0 && (
                <span style={{
                  background: 'rgba(59,130,246,0.2)',
                  color: '#3b82f6',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  padding: '2px 10px',
                  borderRadius: '999px',
                }}>
                  {availableQuestions.length}
                </span>
              )}
            </h2>

            {/* Barre de recherche */}
            <div style={{ marginBottom: '16px', position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher une question..."
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 38px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(59,130,246,0.2)',
                  borderRadius: '10px',
                  color: '#f8fafc',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
            </div>

            {/* Actions rapides */}
            {filteredQuestions.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={addAllQuestions}
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.75rem',
                    background: 'rgba(59,130,246,0.1)',
                    border: '1px solid rgba(59,130,246,0.2)',
                    borderRadius: '6px',
                    color: '#60a5fa',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Plus size={14} />
                  Tout ajouter
                </motion.button>
              </div>
            )}

            {/* Liste des questions */}
            {fetchingQuestions ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 20px', flexDirection: 'column', alignItems: 'center' }}>
                <Loader size={32} color="#3b82f6" className="animate-spin" />
                <p style={{ color: '#64748b', marginTop: '16px', fontSize: '0.9rem' }}>
                  Chargement des questions...
                </p>
              </div>
            ) : (
              <div style={{ maxHeight: '600px', overflowY: 'auto', paddingRight: '4px' }}>
                {filteredQuestions.length > 0 ? (
                  <AnimatePresence>
                    {filteredQuestions.map((question, index) => (
                      <motion.div
                        key={question.id || index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        whileHover={{ x: 4 }}
                        onClick={() => addQuestion(question)}
                        style={{
                          padding: '14px 16px',
                          background: selectedQuestions.some(q => q.id === question.id) 
                            ? 'rgba(16,185,129,0.08)' 
                            : 'rgba(255,255,255,0.02)',
                          border: selectedQuestions.some(q => q.id === question.id)
                            ? '1px solid rgba(16,185,129,0.3)'
                            : '1px solid rgba(59,130,246,0.08)',
                          borderRadius: '10px',
                          marginBottom: '10px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                          <p style={{ 
                            color: '#f8fafc', 
                            fontWeight: 500, 
                            fontSize: '0.9rem',
                            flex: 1,
                            lineHeight: '1.5',
                          }}>
                            {question.text}
                          </p>
                          {selectedQuestions.some(q => q.id === question.id) && (
                            <CheckCircle size={16} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                          )}
                        </div>
                        
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
                          {question.options.slice(0, 3).map((opt, i) => (
                            <span
                              key={i}
                              style={{
                                fontSize: '0.65rem',
                                padding: '2px 8px',
                                background: 'rgba(255,255,255,0.04)',
                                color: '#94a3b8',
                                borderRadius: '4px',
                              }}
                            >
                              {opt.length > 25 ? opt.substring(0, 25) + '...' : opt}
                            </span>
                          ))}
                          {question.options.length > 3 && (
                            <span style={{ fontSize: '0.65rem', color: '#64748b' }}>
                              +{question.options.length - 3}
                            </span>
                          )}
                        </div>
                        
                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                          <span style={{ 
                            fontSize: '0.6rem', 
                            color: '#64748b',
                            background: 'rgba(255,255,255,0.04)',
                            padding: '2px 8px',
                            borderRadius: '4px',
                          }}>
                            {question.chapter || 'Général'}
                          </span>
                          <span style={{ 
                            fontSize: '0.6rem', 
                            color: '#10b981',
                            background: 'rgba(16,185,129,0.1)',
                            padding: '2px 8px',
                            borderRadius: '4px',
                          }}>
                            {question.points || 1} pt{question.points > 1 ? 's' : ''}
                          </span>
                          {question.type && (
                            <span style={{ 
                              fontSize: '0.6rem', 
                              color: '#8b5cf6',
                              background: 'rgba(139,92,246,0.1)',
                              padding: '2px 8px',
                              borderRadius: '4px',
                            }}>
                              {question.type === 'single' ? 'QCM' : 'QCM Multiple'}
                            </span>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                ) : (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
                    {selectedMatiere ? (
                      <>
                        <AlertCircle size={32} style={{ marginBottom: '12px', opacity: 0.3 }} />
                        <p>Aucune question trouvée</p>
                        <p style={{ fontSize: '0.8rem', marginTop: '8px' }}>
                          Vérifiez que des questions existent dans la base avec ces critères
                        </p>
                      </>
                    ) : (
                      <>
                        <BookOpen size={32} style={{ marginBottom: '12px', opacity: 0.3 }} />
                        <p>Sélectionnez un domaine, sous-domaine, niveau et matière</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </motion.div>

          {/* Panel 3: Questions sélectionnées */}
          <motion.div variants={itemVariants} style={{
            background: 'rgba(15,23,42,0.7)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(59,130,246,0.15)',
            borderRadius: '20px',
            padding: '24px',
            position: 'sticky',
            top: '80px',
          }}>
            <h2 style={{
              fontFamily: "'Sora', sans-serif",
              fontSize: '1.1rem',
              fontWeight: 600,
              color: '#f8fafc',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookMarked size={18} color="#10b981" />
                Sélectionnées
              </span>
              {selectedQuestions.length > 0 && (
                <span style={{
                  background: 'rgba(16,185,129,0.2)',
                  color: '#10b981',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  padding: '2px 10px',
                  borderRadius: '999px',
                }}>
                  {selectedQuestions.length}
                </span>
              )}
            </h2>

            {/* Actions */}
            {selectedQuestions.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={clearAllQuestions}
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.75rem',
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    borderRadius: '6px',
                    color: '#ef4444',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Trash2 size={14} />
                  Tout retirer
                </motion.button>
              </div>
            )}

            {/* Liste des questions sélectionnées */}
            {selectedQuestions.length > 0 ? (
              <div style={{ maxHeight: '550px', overflowY: 'auto', paddingRight: '4px' }}>
                <AnimatePresence>
                  {selectedQuestions.map((question, index) => (
                    <motion.div
                      key={question.id || index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      style={{
                        padding: '12px 14px',
                        background: 'rgba(16,185,129,0.05)',
                        border: '1px solid rgba(16,185,129,0.15)',
                        borderRadius: '10px',
                        marginBottom: '10px',
                        position: 'relative',
                      }}
                    >
                      <button
                        onClick={() => removeQuestion(question.id)}
                        style={{
                          position: 'absolute',
                          top: '10px',
                          right: '10px',
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          opacity: 0.6,
                          transition: 'opacity 0.2s',
                          padding: '4px',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
                      >
                        <XCircle size={16} />
                      </button>

                      <p style={{ 
                        color: '#f8fafc', 
                        fontWeight: 500, 
                        fontSize: '0.85rem',
                        paddingRight: '24px',
                        lineHeight: '1.4',
                      }}>
                        {index + 1}. {question.text}
                      </p>
                      
                      <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                        <span style={{ 
                          fontSize: '0.6rem', 
                          color: '#10b981',
                          background: 'rgba(16,185,129,0.1)',
                          padding: '2px 8px',
                          borderRadius: '4px',
                        }}>
                          {question.points || 1} pt{question.points > 1 ? 's' : ''}
                        </span>
                        {question.chapter && (
                          <span style={{ 
                            fontSize: '0.6rem', 
                            color: '#64748b',
                            background: 'rgba(255,255,255,0.04)',
                            padding: '2px 8px',
                            borderRadius: '4px',
                          }}>
                            {question.chapter}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
                <BookMarked size={32} style={{ marginBottom: '12px', opacity: 0.3 }} />
                <p>Aucune question sélectionnée</p>
                <p style={{ fontSize: '0.8rem', marginTop: '8px' }}>
                  Cliquez sur les questions pour les ajouter
                </p>
              </div>
            )}
          </motion.div>
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
          background: rgba(59,130,246,0.3);
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(59,130,246,0.5);
        }
      `}</style>
    </div>
  );
};

export default DatabaseQuizCreation;