// src/pages/Admin/AIQuizCreationPage.jsx
// Page de création de quiz avec IA DeepSeek
// ✅ Ajout de l'option "Chapitre" comme dans CreateQuestion
// ✅ Normalisation des chapitres

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Sparkles, Brain, Loader, BookOpen,
  Layers, Tag, Clock, Award, CheckCircle, XCircle,
  AlertCircle, ChevronDown, ChevronUp, Plus, Trash2,
  Eye, Save, Zap, Settings, RefreshCw, Download,
  Copy, FileText, Users, GraduationCap, Bot, Shield
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/http';
import {
  getAllDomaines,
  getAllSousDomaines,
  getAllLevels,
  getAllMatieres,
  getDomainNom,
  getSousDomaineNom,
  getLevelNom,
  getMatiereNom
} from '../../data/domainConfig';
import toast from 'react-hot-toast';

const QUESTION_TYPES = [
  { id: 1, nom: 'Savoir', color: '#3b82f6', description: 'Notions de base' },
  { id: 2, nom: 'Savoir-Faire', color: '#10b981', description: 'Compétences pratiques' },
  { id: 3, nom: 'Savoir-être', color: '#8b5cf6', description: 'Potentiel psychologique' }
];

const DIFFICULTY_LEVELS = [
  { value: 'facile', label: 'Facile', color: '#10b981' },
  { value: 'moyen', label: 'Moyen', color: '#f59e0b' },
  { value: 'difficile', label: 'Difficile', color: '#ef4444' }
];

// ─── NORMALISATION DES CHAPITRES (comme dans CreateQuestion) ──────────────
const normalizeChapterOnChange = (s) =>
  (s || '').trimStart().replace(/\s{2,}/g, ' ');

const normalizeChapterOnBlur = (s) =>
  (s || '')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[.;:,!?]+$/, '')
    .trim()
    .toUpperCase();

const normalizeChapterStr = (s) =>
  (s || '')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[.;:,!?]+$/, '')
    .trim()
    .toUpperCase();

const AIQuizCreationPage = () => {
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const isAdmin = hasRole('admin') || hasRole('superadmin');
  const isFormateur = hasRole('formateur') || isAdmin;

  // ─── ÉTATS ───
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDescription, setQuizDescription] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [expandedQuestion, setExpandedQuestion] = useState(null);
  const [generationError, setGenerationError] = useState(null);

  // ─── FILTRES POUR LA GÉNÉRATION ───
  const [selectedDomainId, setSelectedDomainId] = useState('');
  const [selectedSousDomaineId, setSelectedSousDomaineId] = useState('');
  const [selectedLevelId, setSelectedLevelId] = useState('');
  const [selectedMatiereId, setSelectedMatiereId] = useState('');
  const [selectedType, setSelectedType] = useState(''); // Type de question
  const [difficulty, setDifficulty] = useState('moyen');
  const [questionCount, setQuestionCount] = useState(5);
  const [specificTopics, setSpecificTopics] = useState('');
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  
  // ✅ NOUVEAU : Chapitre (comme dans CreateQuestion)
  const [libChapitre, setLibChapitre] = useState('');

  // ─── AFFICHAGE ───
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState('');

  // ─── COMPUTED ───
  const domains = getAllDomaines();
  const sousDomaines = selectedDomainId ? getAllSousDomaines(selectedDomainId) : [];
  const levels = selectedDomainId && selectedSousDomaineId 
    ? getAllLevels(selectedDomainId, selectedSousDomaineId) 
    : [];
  const matieres = selectedDomainId && selectedSousDomaineId 
    ? getAllMatieres(selectedDomainId, selectedSousDomaineId) 
    : [];

  const selectedCount = selectedQuestions.length;

  // ─── RÉINITIALISATION ───
  const resetForm = () => {
    setSelectedDomainId('');
    setSelectedSousDomaineId('');
    setSelectedLevelId('');
    setSelectedMatiereId('');
    setSelectedType('');
    setDifficulty('moyen');
    setQuestionCount(5);
    setSpecificTopics('');
    setAdditionalInstructions('');
    setLibChapitre(''); // ✅ Réinitialiser le chapitre
    setGeneratedQuestions([]);
    setSelectedQuestions([]);
    setQuizTitle('');
    setQuizDescription('');
    setGenerationError(null);
  };

  // ─── GÉNÉRATION AVEC DEEPSEEK ───
  const generateQuestionsWithAI = useCallback(async () => {
    // Validation
    if (!selectedDomainId) {
      toast.error('Veuillez sélectionner un domaine');
      return;
    }
    if (!selectedSousDomaineId) {
      toast.error('Veuillez sélectionner un sous-domaine');
      return;
    }
    if (!selectedLevelId) {
      toast.error('Veuillez sélectionner un niveau');
      return;
    }
    if (!selectedMatiereId) {
      toast.error('Veuillez sélectionner une matière');
      return;
    }

    setGenerating(true);
    setGenerationProgress(0);
    setGenerationStatus('Préparation de la requête...');
    setGenerationError(null);

    try {
      // Récupérer les noms pour le prompt
      const domaineNom = getDomainNom(selectedDomainId);
      const sousDomaineNom = getSousDomaineNom(selectedDomainId, selectedSousDomaineId);
      const niveauNom = getLevelNom(selectedDomainId, selectedSousDomaineId, selectedLevelId);
      const matiereNom = getMatiereNom(selectedDomainId, selectedSousDomaineId, selectedMatiereId);
      const typeNom = selectedType ? QUESTION_TYPES.find(t => t.id === parseInt(selectedType))?.nom : 'tous types';

      // ✅ Normaliser le chapitre
      const normalizedChapitre = normalizeChapterStr(libChapitre) || 'Général';

      setGenerationStatus(`Génération de ${questionCount} questions sur ${matiereNom} (niveau ${niveauNom})...`);

      // ✅ PAYLOAD AVEC CHAPITRE
      const payload = {
        domain: domaineNom,
        subDomain: sousDomaineNom,
        level: niveauNom,
        subject: matiereNom,
        numQuestions: questionCount,
        difficulty: difficulty,
        type: selectedType ? (selectedType === '1' ? 'qcm' : 'qcm') : 'qcm',
        topics: specificTopics ? specificTopics.split(',').map(t => t.trim()).filter(Boolean) : [],
        instructions: additionalInstructions || '',
        chapitre: normalizedChapitre // ✅ Ajout du chapitre
      };

      console.log('[AIQuiz] 📤 Envoi de la requête DeepSeek:', payload);

      // Simuler la progression
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 5 + Math.random() * 10;
        });
      }, 800);

      // ✅ Appel à l'API backend
      const response = await api.post('/generate-questions', payload);

      clearInterval(progressInterval);
      setGenerationProgress(100);
      setGenerationStatus('Génération terminée !');

      console.log('[AIQuiz] 📦 Réponse reçue:', response.data);

      // Analyser la réponse
      let questions = [];
      if (response.data?.success && Array.isArray(response.data.questions)) {
        questions = response.data.questions;
      } else if (Array.isArray(response.data)) {
        questions = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        questions = response.data.data;
      }

      const metadata = response.data?.metadata || { mode: 'deepseek' };

      // Transformer les questions au format attendu
      const formattedQuestions = questions.map((q, index) => ({
        _id: `temp-${Date.now()}-${index}`,
        libQuestion: q.text || q.libQuestion || q.question || '',
        options: q.options || ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: q.answer || q.correctAnswer || q.correct || q.options?.[0] || '',
        explanation: q.explanation || q.explain || '',
        typeQuestion: selectedType ? parseInt(selectedType) : 1,
        points: q.points || 1,
        tempsMin: q.tempsMin || 1,
        difficulty: q.difficulty || difficulty,
        // ✅ Utiliser le chapitre normalisé ou celui de la réponse
        libChapitre: q.libChapitre || q.chapitre || normalizedChapitre || 'Général',
        domaine: domaineNom,
        sousDomaine: sousDomaineNom,
        niveau: niveauNom,
        matiere: matiereNom,
        status: isAdmin ? 'approved' : 'pending',
        createdAt: new Date().toISOString(),
        _metadata: metadata
      }));

      console.log(`[AIQuiz] ✅ ${formattedQuestions.length} questions générées`);
      console.log(`[AIQuiz] 📊 Mode: ${metadata.mode || 'deepseek'}`);
      console.log(`[AIQuiz] 📂 Chapitre: ${normalizedChapitre}`);

      if (formattedQuestions.length === 0) {
        toast.error('Aucune question générée. Veuillez réessayer avec des paramètres différents.');
        setGenerationError('Aucune question générée');
      } else {
        setGeneratedQuestions(formattedQuestions);
        setSelectedQuestions(formattedQuestions.map(q => q._id));
        toast.success(`${formattedQuestions.length} questions générées avec succès !`);
        
        if (!quizTitle) {
          setQuizTitle(`Quiz ${matiereNom} - ${niveauNom} (${new Date().toLocaleDateString('fr-FR')})`);
        }
      }
    } catch (error) {
      console.error('[AIQuiz] ❌ Erreur de génération:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Erreur lors de la génération';
      setGenerationError(errorMsg);
      
      if (errorMsg.includes('API key') || errorMsg.includes('clé') || errorMsg.includes('DeepSeek')) {
        toast.error('❌ Problème avec l\'API DeepSeek. Vérifiez la configuration.');
      } else {
        toast.error(`❌ ${errorMsg}`);
      }
    } finally {
      setGenerating(false);
      setGenerationStatus('');
    }
  }, [
    selectedDomainId, selectedSousDomaineId, selectedLevelId,
    selectedMatiereId, selectedType, difficulty, questionCount,
    specificTopics, additionalInstructions, libChapitre, quizTitle, isAdmin
  ]);

  // ─── SAUVEGARDE DU QUIZ ───
  const saveQuiz = async () => {
    if (selectedQuestions.length === 0) {
      toast.error('Sélectionnez au moins une question');
      return;
    }

    if (!quizTitle.trim()) {
      toast.error('Veuillez donner un titre au quiz');
      return;
    }

    const questionsToSave = generatedQuestions.filter(q => 
      selectedQuestions.includes(q._id)
    );

    setSaving(true);
    try {
      const quizData = {
        title: quizTitle,
        description: quizDescription || `Quiz généré par IA sur ${getMatiereNom(selectedDomainId, selectedSousDomaineId, selectedMatiereId)}`,
        domaine: getDomainNom(selectedDomainId),
        sousDomaine: getSousDomaineNom(selectedDomainId, selectedSousDomaineId),
        niveau: getLevelNom(selectedDomainId, selectedSousDomaineId, selectedLevelId),
        matiere: getMatiereNom(selectedDomainId, selectedSousDomaineId, selectedMatiereId),
        questions: questionsToSave.map(q => ({
          libQuestion: q.libQuestion,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || '',
          typeQuestion: q.typeQuestion || 1,
          points: q.points || 1,
          tempsMin: q.tempsMin || 1,
          difficulty: q.difficulty || difficulty,
          libChapitre: q.libChapitre || normalizeChapterStr(libChapitre) || 'Général',
          domaine: q.domaine || getDomainNom(selectedDomainId),
          sousDomaine: q.sousDomaine || getSousDomaineNom(selectedDomainId, selectedSousDomaineId),
          niveau: q.niveau || getLevelNom(selectedDomainId, selectedSousDomaineId, selectedLevelId),
          matiere: q.matiere || getMatiereNom(selectedDomainId, selectedSousDomaineId, selectedMatiereId),
          status: isAdmin ? 'approved' : 'pending'
        })),
        isPublic: true,
        generatedBy: 'ai',
        aiModel: 'deepseek',
        createdAt: new Date().toISOString(),
        createdBy: user?.id || user?._id
      };

      console.log('[AIQuiz] 📤 Sauvegarde du quiz:', quizData);

      const response = await api.post('/quizzes', quizData);

      if (response.data?.success) {
        toast.success(`Quiz "${quizTitle}" créé avec succès !`);
        setTimeout(() => {
          navigate(isAdmin ? '/admin/quizzes' : '/formateur/quizzes');
        }, 1500);
      } else {
        throw new Error(response.data?.error || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('[AIQuiz] ❌ Erreur sauvegarde:', error);
      toast.error(error.response?.data?.error || error.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  // ─── TOGGLE SÉLECTION ───
  const toggleSelectAll = () => {
    if (selectedQuestions.length === generatedQuestions.length) {
      setSelectedQuestions([]);
    } else {
      setSelectedQuestions(generatedQuestions.map(q => q._id));
    }
  };

  const toggleSelectQuestion = (id) => {
    setSelectedQuestions(prev =>
      prev.includes(id) ? prev.filter(qid => qid !== id) : [...prev, id]
    );
  };

  // ─── EXPORT ───
  const exportQuestions = () => {
    const questionsToExport = generatedQuestions.filter(q => 
      selectedQuestions.includes(q._id)
    );
    
    if (questionsToExport.length === 0) {
      toast.error('Aucune question sélectionnée');
      return;
    }

    const headers = ['Question', 'Options', 'Bonne réponse', 'Explication', 'Type', 'Chapitre', 'Difficulté'];
    const rows = questionsToExport.map(q => [
      q.libQuestion,
      q.options.join(' | '),
      q.correctAnswer,
      q.explanation || '',
      QUESTION_TYPES.find(t => t.id === q.typeQuestion)?.nom || '',
      q.libChapitre || 'Général',
      q.difficulty || difficulty
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(';')).join('\n');
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quiz_ia_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${questionsToExport.length} questions exportées`);
  };

  // ─── QUESTION CARD ───
  const QuestionCard = ({ question, index }) => {
    const isExpanded = expandedQuestion === question._id;
    const isSelected = selectedQuestions.includes(question._id);
    const typeInfo = QUESTION_TYPES.find(t => t.id === question.typeQuestion);

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.03 }}
        style={{
          background: isSelected ? 'rgba(99,102,241,0.08)' : 'rgba(15,23,42,0.5)',
          border: `1px solid ${isSelected ? 'rgba(99,102,241,0.4)' : 'rgba(99,102,241,0.15)'}`,
          borderRadius: 12,
          overflow: 'hidden',
          marginBottom: 8
        }}
      >
        <div
          onClick={() => setExpandedQuestion(isExpanded ? null : question._id)}
          style={{
            padding: '12px 16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12
          }}
        >
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              toggleSelectQuestion(question._id);
            }}
            style={{ marginTop: 4, accentColor: '#6366f1', cursor: 'pointer' }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ color: '#64748b', fontSize: '0.65rem' }}>#{index + 1}</span>
              {typeInfo && (
                <span style={{
                  padding: '1px 8px',
                  background: `${typeInfo.color}20`,
                  border: `1px solid ${typeInfo.color}30`,
                  borderRadius: 10,
                  color: typeInfo.color,
                  fontSize: '0.6rem',
                  fontWeight: 600
                }}>
                  {typeInfo.nom}
                </span>
              )}
              <span style={{
                padding: '1px 8px',
                background: question.difficulty === 'facile' ? 'rgba(16,185,129,0.15)' :
                          question.difficulty === 'difficile' ? 'rgba(239,68,68,0.15)' :
                          'rgba(245,158,11,0.15)',
                border: `1px solid ${question.difficulty === 'facile' ? 'rgba(16,185,129,0.3)' :
                         question.difficulty === 'difficile' ? 'rgba(239,68,68,0.3)' :
                         'rgba(245,158,11,0.3)'}`,
                borderRadius: 10,
                color: question.difficulty === 'facile' ? '#10b981' :
                       question.difficulty === 'difficile' ? '#ef4444' : '#f59e0b',
                fontSize: '0.6rem',
                fontWeight: 600
              }}>
                {question.difficulty || 'moyen'}
              </span>
              <span style={{ fontSize: '0.6rem', color: '#64748b' }}>⭐ {question.points || 1} pt</span>
            </div>
            <p style={{ color: '#f8fafc', fontSize: '0.85rem', marginTop: 4, lineHeight: 1.4 }}>
              {question.libQuestion}
            </p>
            <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
              {question.options?.slice(0, 2).map((opt, i) => (
                <span key={i} style={{ fontSize: '0.6rem', color: '#64748b', background: 'rgba(255,255,255,0.03)', padding: '2px 8px', borderRadius: 4 }}>
                  {String.fromCharCode(65 + i)}. {opt.length > 30 ? opt.slice(0, 30) + '...' : opt}
                </span>
              ))}
              {question.options?.length > 2 && (
                <span style={{ fontSize: '0.6rem', color: '#64748b' }}>+{question.options.length - 2}</span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {isSelected && <CheckCircle size={14} color="#10b981" />}
            {isExpanded ? <ChevronUp size={16} color="#64748b" /> : <ChevronDown size={16} color="#64748b" />}
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{ padding: '0 16px 16px 44px' }}>
                <div style={{ marginBottom: 10 }}>
                  <p style={{ color: '#94a3b8', fontSize: '0.65rem', marginBottom: 4 }}>Options :</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                    {question.options?.map((opt, i) => {
                      const isCorrect = opt === question.correctAnswer;
                      return (
                        <div key={i} style={{
                          padding: '4px 8px',
                          background: isCorrect ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.02)',
                          border: `1px solid ${isCorrect ? '#10b981' : 'rgba(99,102,241,0.1)'}`,
                          borderRadius: 4,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6
                        }}>
                          <span style={{ color: isCorrect ? '#10b981' : '#64748b', fontSize: '0.7rem', fontWeight: 600 }}>
                            {String.fromCharCode(65 + i)}.
                          </span>
                          <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>{opt}</span>
                          {isCorrect && <CheckCircle size={10} color="#10b981" style={{ marginLeft: 'auto' }} />}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {question.explanation && (
                  <div style={{ padding: 6, background: 'rgba(59,130,246,0.05)', borderRadius: 6, marginBottom: 8 }}>
                    <p style={{ color: '#64748b', fontSize: '0.7rem' }}>💡 {question.explanation}</p>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 12, fontSize: '0.6rem', color: '#64748b', flexWrap: 'wrap' }}>
                  <span>📚 {question.domaine || 'N/A'}</span>
                  <span>📖 {question.sousDomaine || 'N/A'}</span>
                  <span>🎓 {question.niveau || 'N/A'}</span>
                  <span>📘 {question.matiere || 'N/A'}</span>
                  <span>📂 {question.libChapitre || 'Général'}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  // ─── RENDU ───
  if (!isFormateur) {
    return (
      <div style={{ minHeight: '100vh', background: '#05071a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#94a3b8' }}>
          <Shield size={48} color="#ef4444" style={{ marginBottom: 16 }} />
          <h2 style={{ color: '#f8fafc' }}>Accès non autorisé</h2>
          <p>Vous devez être formateur ou administrateur.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #05071a 0%, #0a0f2e 60%, #05071a 100%)', padding: 24 }}>
      <div style={{
        position: 'fixed', inset: 0,
        backgroundImage: 'linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        pointerEvents: 'none', zIndex: 0
      }} />

      <main style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto' }}>
        {/* ─── HEADER ─── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(isAdmin ? '/admin' : '/formateur/dashboard')}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: 12,
              padding: 12,
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
              marginBottom: 8
            }}>
              <Bot size={14} color="#6366f1" />
              <span style={{ color: '#a5b4fc', fontSize: '0.7rem', fontWeight: 600 }}>IA DEEPSEEK</span>
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 12 }}>
              Création de quiz par IA
              <span style={{
                fontSize: '0.6rem',
                padding: '2px 10px',
                background: 'rgba(139,92,246,0.15)',
                border: '1px solid rgba(139,92,246,0.3)',
                borderRadius: 12,
                color: '#a78bfa',
                fontWeight: 500
              }}>
                DeepSeek
              </span>
            </h1>
            <p style={{ color: '#64748b' }}>
              Générez des questions intelligentes avec l'IA DeepSeek en fonction du référentiel
            </p>
          </div>
        </div>

        {/* ─── FORMULAIRE DE GÉNÉRATION ─── */}
        <div style={{
          background: 'rgba(15,23,42,0.7)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: 20,
          padding: 24,
          marginBottom: 24
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {/* Domaine */}
            <div>
              <label style={{ color: '#94a3b8', fontSize: '0.75rem', display: 'block', marginBottom: 4 }}>
                Domaine *
              </label>
              <select
                value={selectedDomainId}
                onChange={(e) => {
                  setSelectedDomainId(e.target.value);
                  setSelectedSousDomaineId('');
                  setSelectedLevelId('');
                  setSelectedMatiereId('');
                }}
                style={{
                  width: '100%',
                  padding: 10,
                  background: '#0f172a',
                  border: '1px solid rgba(99,102,241,0.2)',
                  borderRadius: 8,
                  color: '#f8fafc',
                  outline: 'none'
                }}
              >
                <option value="">Sélectionner...</option>
                {domains.map(d => <option key={d.id} value={d.id}>{d.id} - {d.nom}</option>)}
              </select>
            </div>

            {/* Sous-domaine */}
            <div>
              <label style={{ color: '#94a3b8', fontSize: '0.75rem', display: 'block', marginBottom: 4 }}>
                Sous-domaine *
              </label>
              <select
                value={selectedSousDomaineId}
                onChange={(e) => {
                  setSelectedSousDomaineId(e.target.value);
                  setSelectedLevelId('');
                  setSelectedMatiereId('');
                }}
                disabled={!selectedDomainId}
                style={{
                  width: '100%',
                  padding: 10,
                  background: '#0f172a',
                  border: '1px solid rgba(99,102,241,0.2)',
                  borderRadius: 8,
                  color: '#f8fafc',
                  outline: 'none',
                  opacity: selectedDomainId ? 1 : 0.5
                }}
              >
                <option value="">Sélectionner...</option>
                {sousDomaines.map(sd => <option key={sd.id} value={sd.id}>{sd.id} - {sd.nom}</option>)}
              </select>
            </div>

            {/* Niveau */}
            <div>
              <label style={{ color: '#94a3b8', fontSize: '0.75rem', display: 'block', marginBottom: 4 }}>
                Niveau *
              </label>
              <select
                value={selectedLevelId}
                onChange={(e) => setSelectedLevelId(e.target.value)}
                disabled={!selectedSousDomaineId}
                style={{
                  width: '100%',
                  padding: 10,
                  background: '#0f172a',
                  border: '1px solid rgba(99,102,241,0.2)',
                  borderRadius: 8,
                  color: '#f8fafc',
                  outline: 'none',
                  opacity: selectedSousDomaineId ? 1 : 0.5
                }}
              >
                <option value="">Sélectionner...</option>
                {levels.map(l => <option key={l.id} value={l.id}>{l.id} - {l.nom}</option>)}
              </select>
            </div>

            {/* Matière */}
            <div>
              <label style={{ color: '#94a3b8', fontSize: '0.75rem', display: 'block', marginBottom: 4 }}>
                Matière *
              </label>
              <select
                value={selectedMatiereId}
                onChange={(e) => setSelectedMatiereId(e.target.value)}
                disabled={!selectedSousDomaineId}
                style={{
                  width: '100%',
                  padding: 10,
                  background: '#0f172a',
                  border: '1px solid rgba(99,102,241,0.2)',
                  borderRadius: 8,
                  color: '#f8fafc',
                  outline: 'none',
                  opacity: selectedSousDomaineId ? 1 : 0.5
                }}
              >
                <option value="">Sélectionner...</option>
                {matieres.map(m => <option key={m.id} value={m.id}>{m.id} - {m.nom}</option>)}
              </select>
            </div>

            {/* Type de question */}
            <div>
              <label style={{ color: '#94a3b8', fontSize: '0.75rem', display: 'block', marginBottom: 4 }}>
                Type de question
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                style={{
                  width: '100%',
                  padding: 10,
                  background: '#0f172a',
                  border: '1px solid rgba(99,102,241,0.2)',
                  borderRadius: 8,
                  color: '#f8fafc',
                  outline: 'none'
                }}
              >
                <option value="">Tous les types</option>
                {QUESTION_TYPES.map(t => <option key={t.id} value={t.id}>{t.nom}</option>)}
              </select>
            </div>

            {/* Difficulté */}
            <div>
              <label style={{ color: '#94a3b8', fontSize: '0.75rem', display: 'block', marginBottom: 4 }}>
                Difficulté
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                style={{
                  width: '100%',
                  padding: 10,
                  background: '#0f172a',
                  border: '1px solid rgba(99,102,241,0.2)',
                  borderRadius: 8,
                  color: '#f8fafc',
                  outline: 'none'
                }}
              >
                {DIFFICULTY_LEVELS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>

            {/* Nombre de questions */}
            <div>
              <label style={{ color: '#94a3b8', fontSize: '0.75rem', display: 'block', marginBottom: 4 }}>
                Nombre de questions
              </label>
              <input
                type="number"
                value={questionCount}
                onChange={(e) => setQuestionCount(Math.min(20, Math.max(1, parseInt(e.target.value) || 1)))}
                min={1}
                max={20}
                style={{
                  width: '100%',
                  padding: 10,
                  background: '#0f172a',
                  border: '1px solid rgba(99,102,241,0.2)',
                  borderRadius: 8,
                  color: '#f8fafc',
                  outline: 'none'
                }}
              />
            </div>

            {/* ✅ CHAPITRE (comme dans CreateQuestion) */}
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ color: '#94a3b8', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <BookOpen size={14} color="#f59e0b" />
                Chapitre <span style={{ color: '#64748b', fontSize: '0.65rem' }}>(optionnel - sera normalisé)</span>
              </label>
              <input
                type="text"
                value={libChapitre}
                onChange={(e) => setLibChapitre(normalizeChapterOnChange(e.target.value))}
                onBlur={(e) => {
                  const normalized = normalizeChapterOnBlur(e.target.value);
                  if (normalized !== e.target.value) {
                    setLibChapitre(normalized);
                  }
                }}
                placeholder="Ex : CHAPITRE 3 — LES FONCTIONS DÉRIVÉES"
                style={{
                  width: '100%',
                  padding: 10,
                  background: '#0f172a',
                  border: '1px solid rgba(99,102,241,0.2)',
                  borderRadius: 8,
                  color: '#f8fafc',
                  outline: 'none'
                }}
              />
              {libChapitre && libChapitre !== normalizeChapterOnBlur(libChapitre) && (
                <p style={{ color: '#f59e0b', fontSize: '0.65rem', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <AlertCircle size={12} />
                  💡 Sera normalisé en : <strong>{normalizeChapterOnBlur(libChapitre)}</strong>
                </p>
              )}
            </div>
          </div>

          {/* Options avancées */}
          <button
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            style={{
              marginTop: 12,
              padding: '6px 12px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: 6,
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Settings size={14} />
            Options avancées {showAdvancedOptions ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>

          <AnimatePresence>
            {showAdvancedOptions && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ color: '#94a3b8', fontSize: '0.7rem', display: 'block', marginBottom: 4 }}>
                      Thèmes spécifiques (séparés par des virgules)
                    </label>
                    <input
                      type="text"
                      value={specificTopics}
                      onChange={(e) => setSpecificTopics(e.target.value)}
                      placeholder="Ex: dérivées, intégrales, probabilités"
                      style={{
                        width: '100%',
                        padding: 8,
                        background: '#0f172a',
                        border: '1px solid rgba(99,102,241,0.2)',
                        borderRadius: 8,
                        color: '#f8fafc',
                        outline: 'none',
                        fontSize: '0.85rem'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ color: '#94a3b8', fontSize: '0.7rem', display: 'block', marginBottom: 4 }}>
                      Instructions supplémentaires
                    </label>
                    <input
                      type="text"
                      value={additionalInstructions}
                      onChange={(e) => setAdditionalInstructions(e.target.value)}
                      placeholder="Ex: questions orientées cas pratiques"
                      style={{
                        width: '100%',
                        padding: 8,
                        background: '#0f172a',
                        border: '1px solid rgba(99,102,241,0.2)',
                        borderRadius: 8,
                        color: '#f8fafc',
                        outline: 'none',
                        fontSize: '0.85rem'
                      }}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Boutons de génération */}
          <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={generateQuestionsWithAI}
              disabled={generating || !selectedMatiereId}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 28px',
                background: generating ? 'rgba(99,102,241,0.3)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                border: 'none',
                borderRadius: 12,
                color: '#fff',
                fontWeight: 600,
                cursor: generating || !selectedMatiereId ? 'not-allowed' : 'pointer',
                opacity: generating || !selectedMatiereId ? 0.6 : 1
              }}
            >
              {generating ? (
                <>
                  <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  Génération en cours...
                </>
              ) : (
                <>
                  <Zap size={18} />
                  Générer avec DeepSeek
                </>
              )}
            </motion.button>

            <button
              onClick={resetForm}
              style={{
                padding: '12px 20px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10,
                color: '#94a3b8',
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={16} /> Réinitialiser
            </button>
          </div>

          {/* Progression */}
          {generating && (
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{generationStatus}</span>
                <span style={{ color: '#a5b4fc', fontSize: '0.75rem', fontWeight: 600 }}>
                  {Math.round(generationProgress)}%
                </span>
              </div>
              <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${generationProgress}%` }}
                  transition={{ duration: 0.3 }}
                  style={{
                    height: '100%',
                    background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                    borderRadius: 2
                  }}
                />
              </div>
            </div>
          )}

          {/* Erreur */}
          {generationError && (
            <div style={{ marginTop: 12, padding: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8 }}>
              <p style={{ color: '#ef4444', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={16} />
                {generationError}
              </p>
            </div>
          )}
        </div>

        {/* ─── RÉSULTATS DE LA GÉNÉRATION ─── */}
        {generatedQuestions.length > 0 && (
          <div style={{
            background: 'rgba(15,23,42,0.7)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: 20,
            padding: 24
          }}>
            {/* En-tête des résultats */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2 style={{ color: '#f8fafc', fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle size={18} color="#10b981" />
                  {generatedQuestions.length} questions générées
                  <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 400 }}>
                    ({selectedQuestions.length} sélectionnées)
                  </span>
                </h2>
                <p style={{ color: '#64748b', fontSize: '0.75rem' }}>
                  {getMatiereNom(selectedDomainId, selectedSousDomaineId, selectedMatiereId)} · Niveau {getLevelNom(selectedDomainId, selectedSousDomaineId, selectedLevelId)}
                  {libChapitre && ` · 📂 ${normalizeChapterStr(libChapitre)}`}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  onClick={toggleSelectAll}
                  style={{
                    padding: '6px 14px',
                    background: 'rgba(99,102,241,0.1)',
                    border: '1px solid rgba(99,102,241,0.3)',
                    borderRadius: 8,
                    color: '#a5b4fc',
                    cursor: 'pointer',
                    fontSize: '0.75rem'
                  }}
                >
                  {selectedQuestions.length === generatedQuestions.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                </button>
                <button
                  onClick={exportQuestions}
                  disabled={selectedQuestions.length === 0}
                  style={{
                    padding: '6px 14px',
                    background: 'rgba(16,185,129,0.1)',
                    border: '1px solid rgba(16,185,129,0.3)',
                    borderRadius: 8,
                    color: '#10b981',
                    cursor: selectedQuestions.length === 0 ? 'not-allowed' : 'pointer',
                    opacity: selectedQuestions.length === 0 ? 0.5 : 1,
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  <Download size={14} /> Exporter CSV
                </button>
              </div>
            </div>

            {/* Titre et description du quiz */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ color: '#94a3b8', fontSize: '0.7rem', display: 'block', marginBottom: 4 }}>
                  Titre du quiz *
                </label>
                <input
                  type="text"
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  placeholder="Donnez un titre à votre quiz"
                  style={{
                    width: '100%',
                    padding: 10,
                    background: '#0f172a',
                    border: '1px solid rgba(99,102,241,0.2)',
                    borderRadius: 8,
                    color: '#f8fafc',
                    outline: 'none'
                  }}
                />
              </div>
              <div>
                <label style={{ color: '#94a3b8', fontSize: '0.7rem', display: 'block', marginBottom: 4 }}>
                  Description
                </label>
                <input
                  type="text"
                  value={quizDescription}
                  onChange={(e) => setQuizDescription(e.target.value)}
                  placeholder="Description du quiz"
                  style={{
                    width: '100%',
                    padding: 10,
                    background: '#0f172a',
                    border: '1px solid rgba(99,102,241,0.2)',
                    borderRadius: 8,
                    color: '#f8fafc',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Liste des questions */}
            <div style={{ maxHeight: 500, overflowY: 'auto' }}>
              {generatedQuestions.map((q, idx) => (
                <QuestionCard key={q._id || idx} question={q} index={idx} />
              ))}
            </div>

            {/* Bouton de sauvegarde */}
            <div style={{ marginTop: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={saveQuiz}
                disabled={saving || selectedQuestions.length === 0 || !quizTitle.trim()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 28px',
                  background: saving ? 'rgba(16,185,129,0.3)' : 'linear-gradient(135deg, #10b981, #059669)',
                  border: 'none',
                  borderRadius: 12,
                  color: '#fff',
                  fontWeight: 600,
                  cursor: saving || selectedQuestions.length === 0 || !quizTitle.trim() ? 'not-allowed' : 'pointer',
                  opacity: saving || selectedQuestions.length === 0 || !quizTitle.trim() ? 0.6 : 1
                }}
              >
                {saving ? (
                  <>
                    <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Sauvegarder le quiz ({selectedQuestions.length} questions)
                  </>
                )}
              </motion.button>

              <button
                onClick={() => setShowPreview(!showPreview)}
                style={{
                  padding: '12px 20px',
                  background: 'rgba(59,130,246,0.1)',
                  border: '1px solid rgba(59,130,246,0.3)',
                  borderRadius: 10,
                  color: '#60a5fa',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <Eye size={16} /> Aperçu
              </button>
            </div>
          </div>
        )}

        {/* ─── AIDE ─── */}
        <div style={{
          marginTop: 24,
          padding: 16,
          background: 'rgba(15,23,42,0.5)',
          border: '1px solid rgba(99,102,241,0.1)',
          borderRadius: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Brain size={16} color="#8b5cf6" />
            <span style={{ color: '#f8fafc', fontWeight: 600, fontSize: '0.85rem' }}>
              Comment fonctionne la génération IA ?
            </span>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.75rem', lineHeight: 1.6 }}>
            DeepSeek génère des questions adaptées à votre référentiel pédagogique.
            Les questions sont au format QCM avec 4 options et une réponse correcte.
            Vous pouvez sélectionner les questions qui vous conviennent, les exporter ou les sauvegarder directement dans votre banque.
            {isAdmin && ' En tant qu\'administrateur, les questions sont directement validées.'}
            {!isAdmin && ' Les questions seront soumises à validation par un administrateur.'}
          </p>
        </div>
      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: rgba(15,23,42,0.3); border-radius: 10px; }
        ::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.3); border-radius: 10px; }
        select option { background: #1e293b; color: #f8fafc; }
        input:focus, select:focus, textarea:focus {
          border-color: rgba(99,102,241,0.5) !important;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
        }
      `}</style>
    </div>
  );
};

export default AIQuizCreationPage;